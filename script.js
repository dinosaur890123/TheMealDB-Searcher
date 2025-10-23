document.addEventListener('DOMContentLoaded', () => {
    const searchButton = document.getElementById('searchButton');
    const searchInput = document.getElementById('searchInput');
    const resultsContainer = document.getElementById('resultsContainer');
    const placeholder = document.getElementById('placeholder');
    const recipeModal = document.getElementById('recipeModal');
    const modalContent = document.getElementById('modalContent');
    const favouritesButton = document.getElementById('favouritesButton');
    const API_KEY = '1';
    const API_URL_SEARCH = `https://www.themealdb.com/api/json/v1/${API_KEY}/search.php?s=`;
    const API_URL_LOOKUP = `https://www.themealdb.com/api/json/v1/${API_KEY}/lookup.php?i=`;
    const API_URL_RANDOM = `https://www.themealdb.com/api/json/v1/${API_KEY}/random.php`;
    searchButton.addEventListener('click', searchMeals);
    favouritesButton.addEventListener('click', showFavourites);
    modalContent.addEventListener('click', (event) => {
        if (event.target.id === 'closeModalButton' || event.target.closest('#closeModalButton')) {
            closeModal();
            return;
        }
        const favouriteButton = event.target.closest('.favourite-button');
        if (favouriteButton) {
            const mealId = favouriteButton.dataset.id;
            toggleFavourite(mealId, favouriteButton);
        }
    })
    searchInput.addEventListener('keyup', (event) => {
        if (event.key === 'Enter') {
            searchMeals();
        }
    });
    recipeModal.addEventListener('click', (event) => {
        if (event.target === recipeModal) {
            closeModal();
        }
    });
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && !recipeModal.classList.contains('hidden')) {
            closeModal();
        }
    });
    document.getElementById('randomButton').addEventListener('click', fetchRandomMeal);
    async function searchMeals() {
        const query = searchInput.value.trim();
        if (!query) {
            displayMessage('Please enter a meal to search for.');
            return;
        }
        placeholder.style.display = 'none';
        resultsContainer.innerHTML = '<div>Searching...</div>';
        try {
            const response = await fetch(`${API_URL_SEARCH}${query}`);
            const data = await response.json();
            displayResults(data.meals);
        } catch (error) {
            console.error('Failed to fetch meals:', error);
            displayMessage('Eror fetching recipes. Please try again later.');
        }
    }
    async function fetchRandomMeal() {
        modalContent.innerHTML = '<div>Finding a random recipe...</div>';
        recipeModal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
        resultsContainer.innerHTML = '';
        placeholder.style.display = 'none';
        try {
            const response = await fetch(API_URL_RANDOM);
            const data = await response.json();
            if (data.meals && data.meals.length > 0) {
                displayRecipeDetails(data.meals[0]);
            } else {
                modalContent.innerHTML = '<div style="text-align: center; color: red;">Could not find a random recipe :( Please try again</div>';
            } 
        } catch (error) {
            console.error('Error fetching random meal:', error);
            modalContent.innerHTML = '<div style="text-align: center; color: red;">Could not find recipe :( Please try again.</div>';
        }
    }
    async function showFavourites() {
        placeholder.textContent = 'Loading your favourites...';
        placeholder.style.display = 'block';
        resultsContainer.innerHTML = '';
        const favouriteIds = getFavouriteIds();
        if (favouriteIds.length === 0) {
            placeholder.textContent = 'You have no favourite recipes saved.';
            return;
        }
        try {
            const promises = favouriteIds.map(id => 
                fetch(`${API_URL_LOOKUP}${id}`)
                    .then(res => res.json())
            );
            const results = await Promise.all(promises);
            const meals = results.map(res => res.meals[0]);
            placeholder.style.display = 'none';
            displayResults(meals);
        } catch (error) {
            console.error('Error fetching favourites:', error);
            placeholder.textContent = 'Error loading your favourites.';
        }
    }
    function displayResults(meals) {
        resultsContainer.innerHTML = '';
        if (!meals) {
            displayMessage(`No results found for "${searchInput.value}". Please try another search.`);
            return;
        }
        const grid = document.createElement('div');
        grid.className = 'results-grid';
        meals.forEach(meal => {
            const mealCard = document.createElement('div');
            mealCard.className = 'meal-card';
            mealCard.innerHTML = `
                <img src="${meal.strMealThumb}" alt="${meal.strMeal}">
                <h3>${meal.strMeal}</h3>
            `;
            mealCard.addEventListener('click', () => getRecipeDetails(meal.idMeal));
            grid.appendChild(mealCard);
        });
        resultsContainer.appendChild(grid);
    }
    async function getRecipeDetails(mealId) {
        modalContent.innerHTML = '<div>Loading recipe...</div>';
        recipeModal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
        try {
            const response = await fetch(`${API_URL_LOOKUP}${mealId}`);
            const data = await response.json();
            displayRecipeDetails(data.meals[0]);
        } catch (error) {
            console.error('Failed to fetch recipe details:', error);
            modalContent.innerHTML = '<div style="padding: 2rem; text-align: center; color: red;">Could not load the recipe. Please retry :(.</div>';
        }
    }
    function displayRecipeDetails(meal) {
        const favouriteIds = getFavouriteIds();
        const isFavourite = favouriteIds.includes(meal.idMeal);
        const activeClass = isFavourite ? 'active' : '';
        const ingredients = [];
        for (let i = 1; i <= 20; i++) {
            if (meal[`strIngredient${i}`]) {
                ingredients.push(`<li>${meal[`strIngredient${i}`]} - ${meal[`strMeasure${i}`]}</li>`);
            } else {
                break;
            }
        }
        modalContent.innerHTML = `
            <div class="modal-header">
                <div class="modal-title-group">
                    <h2>${meal.strMeal}</h2>
                    <button class="favourite-button ${activeClass}" data-id="${meal.idMeal}">
                        &hearts;
                    </button>
                </div>
                <button id="closeModalButton">&times;</button>
            </div>
            <div class="modal-body">
                <img src="${meal.strMealThumb}" alt="${meal.strMeal}">
                <h3>Ingredients</h3>
                <ul>${ingredients.join('')}</ul> 
                <h3>Instructions</h3>
                <p>${meal.strInstructions.replace(/\n/g, '<br>')}</p>
            </div>
        `;
    }
    function closeModal() {
        recipeModal.classList.add('hidden');
        document.body.style.overflow = '';
    }
    function toggleFavourite(mealId, button) {
        const favouriteIds = getFavouriteIds();
        if (favouriteIds.includes(mealId)) {
            removeFavourite(mealId);
            button.classList.remove('active');
        } else {
            addFavourite(mealId);
            button.classList.add('active');
        }
    }
    function getFavouriteIds() {
        const favourites = localStorage.getItem('favouriteRecipes');
        return favourites ? JSON.parse(favourites) : [];
    }
    function addFavourite(mealId) {
        const favouriteIds = getFavouriteIds();
        if (!favouriteIds.includes(mealId)) {
            favouriteIds.push(mealId);
            localStorage.setItem('favouriteRecipes', JSON.stringify(favouriteIds));
        }
    }
    function removeFavourite(mealId) {
        let favouriteIds = getFavouriteIds();
        favouriteIds = favouriteIds.filter(id => id !== mealId);
        localStorage.setItem('favouriteRecipes', JSON.stringify(favouriteIds));
    }
    function showFavouritePopup(message) {
        const popup = document.createElement('div');
        popup.className = 'favourite-popup';
        popup.textContent = message;
        document.body.appendChild(popup);
        void popup.offsetWidth;
        popup.classList.add('visible');
        setTimeout(() => {
            popup.classList.remove('visible');
        }, 2000);
        setTimeout(() => {
            popup.remove();
        }, 2500);
    }
    function displayMessage(message) {
        resultsContainer.innerHTML = `<div style="text-align: center; color: #6b6767; margin-top: 4rem;">${message}</div>`;
    }
});

