document.addEventListener('DOMContentLoaded', () => {
    // --- Common Logic ---
    const currentPath = window.location.pathname;

    // --- MANAGE PAGE LOGIC ---
    if (currentPath === '/manage') {
        initManagePage();
    }
    // --- INDEX PAGE LOGIC ---
    else if (currentPath === '/') {
        initIndexPage();
    }

    function initManagePage() {
        const form = document.getElementById('addMovieForm');
        const manageSearch = document.getElementById('manageSearch');
        const manageGrid = document.getElementById('manageGrid');
        let allMovies = [];

        // Fetch for Manage List
        fetch('/api/movies')
            .then(res => res.json())
            .then(data => {
                allMovies = data;
                renderManageList(allMovies.slice(0, 20));
            });

        // Add Movie
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const btn = form.querySelector('button');
            const origText = btn.textContent;
            btn.textContent = 'Saving...';
            btn.disabled = true;

            const payload = {
                title: document.getElementById('newTitle').value,
                genres: document.getElementById('newGenres').value,
                rating: document.getElementById('newRating').value
            };

            fetch('/api/movie/add', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        alert('Movie Added!');
                        form.reset();
                        allMovies.unshift(data.movie); // Add to local list
                        renderManageList(allMovies.slice(0, 20));
                    } else {
                        alert('Error: ' + (data.error || 'Unknown'));
                    }
                })
                .finally(() => {
                    btn.textContent = origText;
                    btn.disabled = false;
                });
        });

        // Search in Manage
        manageSearch.addEventListener('input', (e) => {
            const q = e.target.value.toLowerCase();
            const filtered = allMovies.filter(m => m.title.toLowerCase().includes(q));
            renderManageList(filtered.slice(0, 50));
        });

        window.updateMovieRating = (id, newRating) => {
            fetch('/api/movie/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: id, rating: newRating })
            }).then(res => res.json()).then(d => {
                if (!d.success) alert('Failed to update');
            });
        };

        function renderManageList(movies) {
            manageGrid.innerHTML = '';
            movies.forEach(m => {
                const div = document.createElement('div');
                div.className = 'selected-item'; // Reuse class for layout
                div.innerHTML = `
                    <div class="selected-info">
                        <h5>${m.title} <span style="color:#9ca3af; font-size:0.8em">#${m.id}</span></h5>
                        <input type="number" step="0.1" min="1" max="10" 
                            value="${m.vote_average}" 
                            style="width: 60px; padding: 2px;"
                            onchange="window.updateMovieRating(${m.id}, this.value)"
                        >
                    </div>
                `;
                manageGrid.appendChild(div);
            });
        }
    }

    function initIndexPage() {
        // Reuse existing index logic but scoped
        let selectedMovies = [];
        const maxSelection = 5;
        let allMovies = [];

        const movieGrid = document.getElementById('movieGrid');
        const searchInput = document.getElementById('movieSearch');
        const selectedList = document.getElementById('selectedMovies');
        const selectionCount = document.getElementById('selectionCount');
        const predictBtn = document.getElementById('getRecommendations');
        const resultsSection = document.getElementById('resultsSection');

        fetch('/api/movies')
            .then(res => res.json())
            .then(data => {
                allMovies = data;
                renderGrid(allMovies.slice(0, 50));
            });

        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            const filtered = allMovies.filter(m => m.title.toLowerCase().includes(query));
            renderGrid(filtered.slice(0, 50));
        });

        function renderGrid(movies) {
            if (!movieGrid) return;
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
                selectedMovies.splice(index, 1);
            } else {
                if (selectedMovies.length >= maxSelection) {
                    alert('Limit reached! Max 5 movies.');
                    return;
                }
                selectedMovies.push({ ...movie, rating: 5 });
            }
            updateUI();
        }

        window.updateRating = (id, val) => {
            const movie = selectedMovies.find(m => m.id === id);
            if (movie) movie.rating = parseInt(val);
        };

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
                            oninput="window.updateRating(${m.id}, this.value)">
                        </div>
                        <i class="fas fa-times remove-item" onclick="window.removeMovie(${m.id})"></i>
                    `;
                    selectedList.appendChild(item);
                });
            }

            // Re-render visible grid to update selection styles
            const query = searchInput.value.toLowerCase();
            const filtered = allMovies.filter(m => m.title.toLowerCase().includes(query)).slice(0, 50);
            renderGrid(filtered);
        }

        if (predictBtn) {
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
        }

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
    }
});
