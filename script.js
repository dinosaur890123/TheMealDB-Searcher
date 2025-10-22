document.addEventListener('DOMContentLoaded', () => {
    const searchButton = document.getElementById('searchButton');
    const searchInput = document.getElementById('searchInput');
    const resultsContainer = document.getElementById('resultsContainer');
    const placeholder = document.getElementById('placeholder');
    const recipeModal = document.getElementById('recipe-modal');
    const modalContent = document.getElementById('modal-content');
    const API_KEY = '1';
    const API_URL_SEARCH = `https://www.themealdb.com/api/json/v1/${API_KEY}/search.php?s=`;
    const API_URL_LOOKUP = `https://www.themealdb.com/api/json/v1/${API_KEY}/lookup.php?i=`;
    searchButton.addEventListener('click', searchMeals);
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
            displayMessage('Error fetching recipes. Please try again later.');
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
        const ingredients = [];
        for (let i = 1; i <= 20; i++) {
            if (meal[`strIngredient${i}`]) {
                ingredients.push(`${meal[`strIngredient${i}`]} - ${meal[`strMeasure${i}`]}`);
            } else {
                break;
            }
        }
        modalContent.innerHTML = `
            <div class="modal-header">
                <h2>${meal.strMeal}</h2>
                <button id="closeModalButton">&times;</button>
            </div>
            <div class="modal-body">
                <img src="${meal.strMealThumb}" alt="${meal.strMeal}">
                <h3>Ingredients</h3>
                <ul>
                    ${ingredients.map(ing => `<li>${ing}</li>`).join('')}
                </ul>
                <h3>Meal instructions</h3>
                <p>${meal.strInstructions}</p>
            </div>
            `;
            document.getElementById('closeModalButton').addEventListener('click', () => {
            recipeModal.classList.add('hidden');
            document.body.style.overflow = ''; 
        });
    }
    function displayMessage(message) {
        resultsContainer.innerHTML = `<div style="text-align: center; color: #6b6767; margin-top: 4rem;">${message}</div>`;
    }
    function closeModal() {
        recipeModal.classList.add('hidden');
        document.body.style.overflow = '';
    }
});

