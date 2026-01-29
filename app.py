from flask import Flask, request, jsonify, render_template
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
import os
import urllib.parse
import random

app = Flask(__name__)

# Global variables
df = pd.DataFrame()
tfidf_matrix = None

def load_data():
    global df, tfidf_matrix
    try:
        df = pd.read_csv('movies.csv')
        df['genres'] = df['genres'].fillna('')
        
        # Ensure we have a poster_url column if not exists
        if 'poster_url' not in df.columns:
             df['poster_url'] = df['title'].apply(lambda x: get_placeholder_url(x))

        # Re-calc TF-IDF
        tfidf = TfidfVectorizer(stop_words='english')
        tfidf_matrix = tfidf.fit_transform(df['genres'])
        print(f"Data Loaded: {len(df)} movies.")
    except Exception as e:
        print(f"Error loading data: {e}")
        df = pd.DataFrame()
        tfidf_matrix = None

def get_placeholder_url(title):
    try:
        encoded_title = urllib.parse.quote(title)
        color_hue = len(title) * 20 % 360
        return f"https://placehold.co/300x450/{color_hue:x}4444/FFF?text={encoded_title}"
    except:
        return "https://placehold.co/300x450?text=Movie"

# Initial Load
load_data()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/about')
def about():
    return render_template('about.html')

@app.route('/manage')
def manage():
    return render_template('manage.html')

@app.route('/api/movies', methods=['GET'])
def get_movies():
    if df.empty:
        return jsonify([])
    # Return list sorted by ID desc to see new ones
    movies = df[['id', 'title', 'poster_url', 'vote_average', 'genres']].sort_values(by='id', ascending=False).to_dict(orient='records')
    return jsonify(movies)

@app.route('/api/movie/add', methods=['POST'])
def add_movie():
    global df
    data = request.json
    title = data.get('title')
    genres = data.get('genres')
    
    if not title or not genres:
        return jsonify({'error': 'Title and Genres required'}), 400
    
    new_id = int(df['id'].max()) + 1 if not df.empty else 1
    new_movie = {
        'id': new_id,
        'title': title,
        'genres': genres,
        'description': data.get('description', 'No description.'),
        'vote_average': float(data.get('rating', 5.0)),
        'vote_count': 0,
        'poster_url': data.get('poster_url', get_placeholder_url(title))
    }
    
    # Add to DataFrame
    new_row = pd.DataFrame([new_movie])
    df = pd.concat([df, new_row], ignore_index=True)
    
    # Save & Reload
    df.to_csv('movies.csv', index=False)
    load_data() # Important to update TF-IDF
    
    return jsonify({'success': True, 'movie': new_movie})

@app.route('/api/movie/update', methods=['POST'])
def update_movie():
    global df
    data = request.json
    movie_id = data.get('id')
    new_rating = data.get('rating')
    
    if not movie_id or new_rating is None:
        return jsonify({'error': 'ID and Rating required'}), 400
    
    if movie_id in df['id'].values:
        df.loc[df['id'] == movie_id, 'vote_average'] = float(new_rating)
        df.to_csv('movies.csv', index=False)
        return jsonify({'success': True})
    
    return jsonify({'error': 'Movie not found'}), 404

@app.route('/api/recommend', methods=['POST'])
def recommend():
    data = request.json
    user_movies = data.get('movies', [])
    
    if not user_movies or tfidf_matrix is None:
        return jsonify({'error': 'No data provided or server not ready'}), 400

    user_indices = []
    user_ratings = []
    
    # Setup ID mapper
    id_to_idx = {row['id']: i for i, row in df.iterrows()}
    
    for item in user_movies:
        movie_id = item.get('id')
        rating = item.get('rating', 5)
        if movie_id in id_to_idx:
            idx = id_to_idx[movie_id]
            user_indices.append(idx)
            user_ratings.append(rating - 5.5) 
            
    if not user_indices:
        return jsonify({'error': 'No known movies found'}), 400
        
    user_profile = np.zeros(tfidf_matrix.shape[1])
    for i, idx in enumerate(user_indices):
        movie_vec = tfidf_matrix[idx].toarray().flatten()
        user_profile += movie_vec * user_ratings[i]
        
    cosine_sim = cosine_similarity(user_profile.reshape(1, -1), tfidf_matrix)
    scores = cosine_sim.flatten()
    
    scores[user_indices] = -np.inf 
    
    top_indices = scores.argsort()[-5:][::-1]
    bottom_indices = scores.argsort()[:5]
    
    recommendations = df.iloc[top_indices][['id', 'title', 'genres', 'description', 'vote_average', 'poster_url']].to_dict(orient='records')
    avoids = df.iloc[bottom_indices][['id', 'title', 'genres', 'description', 'vote_average', 'poster_url']].to_dict(orient='records')
    
    return jsonify({
        'recommendations': recommendations,
        'avoids': avoids
    })

if __name__ == '__main__':
    app.run(debug=True, port=5000)
