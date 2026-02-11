# MRS (Movie Recommend System)
![MRS UI Mockup](static/mrs_mockup.png)
**MRS** is an intelligent web-based tool for movie recommendations and dataset management. It utilizes Content-Based Filtering (TF-IDF & Cosine Similarity) to analyze movie genres and suggest titles based on a user's recent watch history and ratings. Users can also manage the underlying dataset by adding new movies or editing existing ratings.
## Technical Stack
*   **Backend**: Python, Flask
*   **Data Processing**: Pandas, NumPy
*   **Machine Learning**: Scikit-Learn (TfidfVectorizer, cosine_similarity)
*   **Frontend**: HTML5, Vanilla JavaScript, CSS3 (Green/White minimalist theme)
*   **Data Storage**: CSV (Persistent storage for `movies.csv`)
## Installation & Usage
1.  **Clone the repository**
2.  **Install dependencies**:
    ```bash
    pip install -r requirements.txt
    ```
3.  **Run the application**:
    ```bash
    python app.py
    ```
4.  **Access**: Open `http://localhost:5000` in your browser.
## API Endpoints
### 1. Get Movies
-   **URL**: `/api/movies`
-   **Method**: `GET`
-   **Returns**: JSON list of all movies (ID, title, poster_url, rating, genres).
### 2. Get Recommendations
-   **URL**: `/api/recommend`
-   **Method**: `POST`
-   **Payload**: `{"movies": [{"id": 1, "rating": 9}, ...]}`
-   **Returns**: Top 5 recommended movies and top 5 movies to avoid based on user profile vector.
### 3. Add Movie
-   **URL**: `/api/movie/add`
-   **Method**: `POST`
-   **Payload**: `{"title": "Movie Name", "genres": "Action|Sci-Fi", "rating": 8.5}`
-   **Description**: Appends new movie to `movies.csv` and re-initializes the ML model.
### 4. Update Movie
-   **URL**: `/api/movie/update`
-   **Method**: `POST`
-   **Payload**: `{"id": 101, "rating": 7.5}`
-   **Description**: Updates the rating of an existing movie in `movies.csv`.
## Project Structure
*   `app.py`: Main Flask application and ML logic.
*   `generate_data.py`: Script to generate synthetic movie dataset with poster URLs.
*   `movies.csv`: The dataset (Source of Truth).
*   `templates/`: HTML templates (`index.html`, `manage.html`, `base.html`).
*   `static/`: CSS, JS, and Assets.
