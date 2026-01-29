import pandas as pd
import random
import urllib.parse

# Genres list
GENRES = ['Action', 'Adventure', 'Comedy', 'Drama', 'Sci-Fi', 'Horror', 'Romance', 'Thriller', 'Fantasy', 'Animation', 'Crime', 'Mystery']

# Adjectives and Nouns for title generation
ADJECTIVES = ['The Dark', 'A Quiet', 'The Last', 'Eternal', 'Rapid', 'Silent', 'Broken', 'Hidden', 'Lost', 'Future', 'Crimson', 'Galactic', 'Funny', 'Love', 'Deadly', 'Brave', 'Infinite', 'Green', 'White', 'Neon', 'Urban']
NOUNS = ['Knight', 'Place', 'Stand', 'Sunshine', 'Pursuit', 'Voice', 'Dreams', 'Secret', 'World', 'War', 'Tide', 'Storm', 'Heist', 'Shadow', 'Legacy', 'Heart', 'Journey', 'Forest', 'City', 'Light']

def generate_title():
    title = f"{random.choice(ADJECTIVES)} {random.choice(NOUNS)}"
    return title

def generate_genres():
    num_genres = random.randint(1, 3)
    return "|".join(random.sample(GENRES, num_genres))

def get_poster_url(title):
    # Use Placehold.co for reliable placeholders with the movie title
    encoded_title = urllib.parse.quote(title)
    # Different colors for variety based on title length
    color_hue = len(title) * 20 % 360
    return f"https://placehold.co/300x450/{color_hue:x}4444/FFF?text={encoded_title}"

data = []
for i in range(1, 1001):
    title = generate_title()
    data.append({
        'id': i,
        'title': title,
        'genres': generate_genres(),
        'description': f"A thrilling movie about {random.choice(NOUNS).lower()}s and the quest for {random.choice(NOUNS).lower()}.",
        'vote_average': round(random.uniform(3.0, 9.8), 1),
        'vote_count': random.randint(100, 10000),
        'poster_url': get_poster_url(title)
    })

df = pd.DataFrame(data)
df.to_csv('movies.csv', index=False)
print("movies.csv generated with 1000 entries and poster URLs.")
