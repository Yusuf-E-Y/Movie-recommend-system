import requests

BASE_URL = 'http://localhost:5000/api'

def test_add_movie():
    print("Testing Add Movie...")
    payload = {
        'title': 'Test Movie 2026',
        'genres': 'Sci-Fi',
        'rating': 9.5,
        'description': 'A verification movie.'
    }
    
    # We must run the server separately or import app. Since app.py is complex, let's use app.test_client
    from app import app
    client = app.test_client()
    
    response = client.post('/api/movie/add', json=payload)
    if response.status_code == 200:
        data = response.get_json()
        if data['success'] and data['movie']['title'] == 'Test Movie 2026':
            print("SUCCESS: Movie added.")
            return data['movie']['id']
    else:
        print(f"FAILED: {response.data}")
    return None

def test_update_movie(movie_id):
    print(f"Testing Update Movie ID: {movie_id}...")
    from app import app
    client = app.test_client()
    
    payload = {'id': movie_id, 'rating': 10.0}
    response = client.post('/api/movie/update', json=payload)
    
    if response.status_code == 200:
        print("SUCCESS: Movie rating updated.")
    else:
        print(f"FAILED: {response.data}")

if __name__ == '__main__':
    mid = test_add_movie()
    if mid:
        test_update_movie(mid)
