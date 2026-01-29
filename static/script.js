document.addEventListener('DOMContentLoaded', () => {
    let allMovies = [];
    let selectedMovies = [];
    const maxSelection = 5;

    const movieGrid = document.getElementById('movieGrid');
    const searchInput = document.getElementById('movieSearch');
    const selectedList = document.getElementById('selectedMovies');
    const selectionCount = document.getElementById('selectionCount');
    const predictBtn = document.getElementById('getRecommendations');
    const resultsSection = document.getElementById('resultsSection');

    // Fetch movies 
    fetch('/api/movies')
        .then(res => res.json())
        .then(data => {
            allMovies = data;
            renderGrid(allMovies.slice(0, 50)); // Initial Render
        });

    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        const filtered = allMovies.filter(m => m.title.toLowerCase().includes(query));
        renderGrid(filtered.slice(0, 50));
    });

    function renderGrid(movies) {
        movieGrid.innerHTML = '';
        if (movies.length === 0) {
            movieGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #6b7280;">No movies found.</p>';
            return;
        }

        movies.forEach(movie => {
            const isSelected = selectedMovies.some(m => m.id === movie.id);
            const div = document.createElement('div');
            div.className = `grid-item ${isSelected ? 'selected' : ''}`;
            div.onclick = () => toggleSelection(movie);

            div.innerHTML = `
                <img src="${movie.poster_url}" alt="${movie.title}" loading="lazy">
                <div class="info">
                    <h4>${movie.title}</h4>
                    <div class="rating"><i class="fas fa-star"></i> ${movie.vote_average}</div>
                </div>
            `;
            movieGrid.appendChild(div);
        });
    }

    function toggleSelection(movie) {
        const index = selectedMovies.findIndex(m => m.id === movie.id);

        if (index >= 0) {
            // Remove
            selectedMovies.splice(index, 1);
        } else {
            // Add
            if (selectedMovies.length >= maxSelection) {
                alert('Limit reached! Max 5 movies.');
                return;
            }
            selectedMovies.push({ ...movie, rating: 5 });
        }

        updateUI();
    }

    function updateRating(id, val) {
        const movie = selectedMovies.find(m => m.id === id);
        if (movie) movie.rating = parseInt(val);
    }

    window.updateRating = updateRating;
    window.removeMovie = (id) => {
        const index = selectedMovies.findIndex(m => m.id === id);
        if (index >= 0) {
            selectedMovies.splice(index, 1);
            updateUI();
        }
    };

    function updateUI() {
        selectionCount.textContent = `(${selectedMovies.length}/5)`;
        predictBtn.disabled = selectedMovies.length === 0;

        // Update list
        selectedList.innerHTML = '';
        if (selectedMovies.length === 0) {
            selectedList.innerHTML = '<p class="empty-state">Click movies on the left to add them.</p>';
        } else {
            selectedMovies.forEach(m => {
                const item = document.createElement('div');
                item.className = 'selected-item';
                item.innerHTML = `
                    <img src="${m.poster_url}" alt="poster">
                    <div class="selected-info">
                        <h5>${m.title}</h5>
                        <input type="range" class="rating-input" min="1" max="10" value="${m.rating}" 
                        title="Rate this movie" oninput="window.updateRating(${m.id}, this.value)">
                    </div>
                    <i class="fas fa-times remove-item" onclick="window.removeMovie(${m.id})"></i>
                `;
                selectedList.appendChild(item);
            });
        }

        // Re-render grid to show selection state (optional optimization: direct DOM update)
        // For simplicity, just update classes if visible
        document.querySelectorAll('.grid-item').forEach(el => el.classList.remove('selected'));
        selectedMovies.forEach(m => {
            // Find grid item strictly by iterating or if we stick ID on element
            // Since we regenerate grid on search this is tricky, simplified by just re-rendering grid 
            // BUT expensive. Let's just find visible texts.
            // Better: re-render is fine for 50 items.
        });

        // Simple hack: Re-render current view or just toggle class on click?
        // Let's just re-render current search view to be safe
        const query = searchInput.value.toLowerCase();
        const filtered = allMovies.filter(m => m.title.toLowerCase().includes(query)).slice(0, 50);
        renderGrid(filtered);
    }

    predictBtn.addEventListener('click', () => {
        predictBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';

        fetch('/api/recommend', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ movies: selectedMovies })
        })
            .then(res => res.json())
            .then(data => {
                renderResults(data);
                resultsSection.classList.remove('hidden');
            })
            .finally(() => {
                predictBtn.innerHTML = '<i class="fas fa-wand-magic-sparkles"></i> Get Recommendations';
            });
    });

    function renderResults(data) {
        const renderList = (listId, movies) => {
            const container = document.getElementById(listId);
            container.innerHTML = '';
            movies.forEach(m => {
                const div = document.createElement('div');
                div.className = 'mini-item';
                div.innerHTML = `
                    <img src="${m.poster_url}" alt="poster">
                    <div class="mini-info">
                        <h5>${m.title}</h5>
                        <p>${m.genres.split('|').slice(0, 2).join(', ')}</p>
                    </div>
                `;
                container.appendChild(div);
            });
        };

        renderList('recommendationsList', data.recommendations);
        renderList('avoidsList', data.avoids);
    }
});
