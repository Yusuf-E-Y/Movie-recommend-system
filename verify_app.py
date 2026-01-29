import json
from app import app
import pandas as pd

def test_recommendation():
    # Ensure data exists
    try:
        df = pd.read_csv('movies.csv')
        if df.empty:
            print("FAILED: movies.csv is empty")
            return
    except Exception as e:
        print(f"FAILED: Could not load movies.csv: {e}")
        return

    client = app.test_client()
    
    # Get a few movie IDs to simulate user selection
    sample_movies = df.head(5).to_dict(orient='records')
    input_movies = [{'id': m['id'], 'rating': 9} for m in sample_movies] 
    
    payload = {'movies': input_movies}
    
    response = client.post('/api/recommend', json=payload)
    
    if response.status_code == 200:
        data = response.get_json()
        rec_list = data.get('recommendations', [])
        
        if rec_list and 'poster_url' in rec_list[0]:
            print(f"SUCCESS: API returned {len(rec_list)} recommendations with poster URLs.")
            print(f"Sample URL: {rec_list[0]['poster_url']}")
        else:
            print("FAILED: Response missing poster_url or recommendations")
            print(data)
    else:
        print(f"FAILED: Status Code {response.status_code}")
        print(response.data)

if __name__ == "__main__":
    test_recommendation()
