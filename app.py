from flask import Flask, request, jsonify, render_template
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
import os

app = Flask(__name__)

# Load Data
try:
    df = pd.read_csv('movies.csv')
    df['genres'] = df['genres'].fillna('')
    # Create TF-IDF Matrix
    tfidf = TfidfVectorizer(stop_words='english')
    tfidf_matrix = tfidf.fit_transform(df['genres'])
except Exception as e:
    print(f"Error loading data: {e}")
    df = pd.DataFrame()
    tfidf_matrix = None

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/about')
def about():
    return render_template('about.html')

@app.route('/api/movies', methods=['GET'])
def get_movies():
    """Return list of movies for search/grid"""
    if df.empty:
        return jsonify([])
    # Return all movies or a subset for the grid
    movies = df[['id', 'title', 'poster_url', 'vote_average']].to_dict(orient='records')
    return jsonify(movies)

@app.route('/api/recommend', methods=['POST'])
def recommend():
    data = request.json
    user_movies = data.get('movies', []) # List of {id, rating}
    
    if not user_movies or tfidf_matrix is None:
        return jsonify({'error': 'No data provided or server not ready'}), 400

    # Build User Profile
    user_indices = []
    user_ratings = []
    
    id_to_idx = {row['id']: i for i, row in df.iterrows()}
    
    for item in user_movies:
        movie_id = item.get('id')
        rating = item.get('rating', 5) # Default 5/10
        if movie_id in id_to_idx:
            idx = id_to_idx[movie_id]
            user_indices.append(idx)
            # Use centered rating (e.g. 1-10 -> -4.5 to 4.5) to capture like/dislike
            user_ratings.append(rating - 5.5) 
            
    if not user_indices:
        return jsonify({'error': 'No known movies found'}), 400
        
    # User Profile Vector = Weighted Sum of Movie Vectors
    user_profile = np.zeros(tfidf_matrix.shape[1])
    for i, idx in enumerate(user_indices):
        movie_vec = tfidf_matrix[idx].toarray().flatten()
        user_profile += movie_vec * user_ratings[i]
        
    # Compute Similarity with ALL movies
    # Reshape user_profile to (1, n_features)
    cosine_sim = cosine_similarity(user_profile.reshape(1, -1), tfidf_matrix)
    scores = cosine_sim.flatten()
    
    # Get top recommendations (highest scores) and avoids (lowest scores)
    # Exclude watched movies
    scores[user_indices] = -np.inf # Mark watched as low to avoid recommending them again
    
    top_indices = scores.argsort()[-5:][::-1] # Top 5
    bottom_indices = scores.argsort()[:5] # Bottom 5
    
    recommendations = df.iloc[top_indices][['id', 'title', 'genres', 'description', 'vote_average', 'poster_url']].to_dict(orient='records')
    avoids = df.iloc[bottom_indices][['id', 'title', 'genres', 'description', 'vote_average', 'poster_url']].to_dict(orient='records')
    
    return jsonify({
        'recommendations': recommendations,
        'avoids': avoids
    })

if __name__ == '__main__':
    app.run(debug=True, port=5000)
