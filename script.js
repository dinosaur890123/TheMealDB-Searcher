document.addEventListener('DOMContentLoaded', () => {
    const searchButton = document.getElementById('searchButton');
    const searchInput = document.getElementById('searchInput');
    const resultsContainer = document.getElementById('resultsContainer');
    const placeholder = document.getElementById('placeholder');
    const recipeModal = document.getElementById('recipeModal');
    const modalContent = document.getElementById('modalContent');
    const favouritesButton = document.getElementById('favouritesButton');
    const categoryFilter = document.getElementById('categoryFilter');
    const cuisineFilter = document.getElementById('cuisineFilter');
    const shoppingListButton = document.getElementById('shoppingListButton');
    const API_KEY = '1';
    const API_URL_SEARCH = `https://www.themealdb.com/api/json/v1/${API_KEY}/search.php?s=`;
    const API_URL_LOOKUP = `https://www.themealdb.com/api/json/v1/${API_KEY}/lookup.php?i=`;
    const API_URL_RANDOM = `https://www.themealdb.com/api/json/v1/${API_KEY}/random.php`;
    const API_URL_LIST_CATEGORIES = `https://www.themealdb.com/api/json/v1/${API_KEY}/list.php?c=list`;
    const API_URL_LIST_CUISINES = `https://www.themealdb.com/api/json/v1/${API_KEY}/list.php?a=list`;
    const API_URL_FILTER_CATEGORY = `https://www.themealdb.com/api/json/v1/${API_KEY}/filter.php?c=`;
    const API_URL_FILTER_CUISINE = `https://www.themealdb.com/api/json/v1/${API_KEY}/filter.php?a=`;
    const API_URL_FILTER_INGREDIENT = `https://www.themealdb.com/api/json/v1/${API_KEY}/filter.php?i=`;

    searchButton.addEventListener('click', searchMeals);
    favouritesButton.addEventListener('click', showFavourites);
    shoppingListButton.addEventListener('click', showShoppingList);
    ingredientSearchButton.addEventListener('click', searchByIngredient);
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
        const addToListButton = event.target.closest('.add-to-list-button');
        if (addToListButton) {
            const ingredient = addToListButton.dataset.ingredient;
            const measure = addToListButton.dataset.measure;
            addToShoppingList(ingredient, measure);
        }
        const removeFromListButton = event.target.closest('.remove-from-list-button');
        if (removeFromListButton) {
            const ingredient = removeFromListButton.dataset.ingredient;
            removeFromShoppingList(ingredient);
            showShoppingList();
        }
    })
    searchInput.addEventListener('keyup', (event) => {
        if (event.key === 'Enter') {
            searchMeals();
        }
    });
    ingredientSearchInput.addEventListener('keyup', (event) => {
        if (event.key === 'Enter') {
            searchByIngredient();
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
    searchInput.addEventListener('input', () => {
        categoryFilter.value = 'all';
        cuisineFilter.value = 'all';
    });
    categoryFilter.addEventListener('change', () => {
        searchInput.value = '';
        cuisineFilter.value = 'all';
        searchMeals();
    });
    cuisineFilter.addEventListener('change', () => {
        searchInput.value = '';
        categoryFilter.value = 'all';
        searchMeals();
    });
    document.getElementById('randomButton').addEventListener('click', fetchRandomMeal);
    async function populateFilters() {
        try {
            const [categoriesResponse, cuisinesResponse] = await Promise.all([
                fetch(API_URL_LIST_CATEGORIES),
                fetch(API_URL_LIST_CUISINES)
            ]);
            const categoriesData = await categoriesResponse.json();
            const cuisinesData = await cuisinesResponse.json();
            if (categoriesData.meals) {
                categoriesData.meals.forEach(category => {
                    const option = document.createElement('option');
                    option.value = category.strCategory;
                    option.textContent = category.strCategory;
                    categoryFilter.appendChild(option);
                });
            }
            if (cuisinesData.meals) {
                cuisinesData.meals.forEach(cuisine => {
                    const option = document.createElement('option');
                    option.value = cuisine.strArea;
                    option.textContent = cuisine.strArea;
                    cuisineFilter.appendChild(option);
                });
            }
        } catch (error) {
            console.error('Failed to get filters :(', error);
        }
    }
    async function searchMeals() {
        const query = searchInput.value.trim();
        const category = categoryFilter.value;
        const cuisine = cuisineFilter.value;
        let url = '';
        let currentQuery = '';
        ingredientSearchInput.value = '';
        if (query) {
            url = `${API_URL_SEARCH}${query}`;
            currentQuery = query;
            categoryFilter.value = 'all';
            cuisineFilter.value = 'all';
        } else if (category !== 'all') {
            url = `${API_URL_FILTER_CATEGORY}${category}`;
        } else if (cuisine !== 'all') {
            url = `${API_URL_FILTER_CUISINE}${cuisine}`;
        } else {
            displayMessage('Please enter a meal, select a category, or choose a cuisine.');
            return;
        }
        await fetchAndDisplay(url, currentQuery);
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
    async function searchByIngredient() {
        const query = ingredientSearchInput.value.trim();
        if (!query) {
            displayMessage("Please enter an ingredient to search for.");
            return;
        }
        searchInput.value = '';
        categoryFilter.value = 'all';
        cuisineFilter.value = 'all';
        const url = API_URL_FILTER_INGREDIENT + query;
        await fetchAndDisplay(url, query, true);
    }
    async function fetchAndDisplay(url, queryForMessage, isIngredientSearch = false) {
        placeholder.style.display = 'none';
        resultsContainer.innerHTML = '<div>Searching...</div>';
        try {
            const response = await fetch(url); 
            const data = await response.json();
            lastSearch.query = queryForMessage;
            lastSearch.isIngredientSearch = isIngredientSearch;
            displayResults(data.meals);
        } catch (error) {
            console.error('Error fetching data:', error);
            displayMessage('Sorry, something went wrong :( Please try again.');
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
        if (!meals) {
            displayMessage(getNoResultsMessage());
            return;
        }
        const grid = document.createElement('div');
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
            displayMessage(getNoResultsMessage());
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
                const ingredientName = meal[`strIngredient${i}`];
                const ingredientMeasure = meal[`strMeasure${i}`];
                ingredients.push(`
                    <li class="ingredient-item">
                        <span>${ingredientName} - ${ingredientMeasure}</span>
                        <button class="add-to-list-button" data-ingredient="${ingredientName}" data-measure="${ingredientMeasure}">+</button>
                    </li>
                `);
            } else {
                break;
            }
        }
        let videoHtml = '';
        if (meal.strYoutube) {
            const videoUrl = meal.strYoutube.replace("watch?v=", "embed/");
            videoHtml = `
                <div class="video-container">
                    <iframe 
                        src="${videoUrl}" 
                        title="YouTube video player" 
                        frameborder="0" 
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                        allowfullscreen>
                    </iframe>
                </div>`
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
            showFavouritePopup('Added to favourites');
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
    function showNotification(message) {
        const popup = document.createElement('div');
        popup.className = 'favourite-popup';
        popup.textContent = message;
        document.body.appendChild(popup);
        void popup.offsetWidth;
        popup.classList.add('visible');
        if (isError) {
            popup.style.backgroundColor = '#dc3545';
        }
        setTimeout(() => {
            popup.classList.remove('visible');
        }, 2000);
        setTimeout(() => {
            popup.remove();
        }, 2500);
    }
    function displayMessage(message) {
        resultsContainer.innerHTML = `<div style="text-align: center; color: #6b6767; margin-top: 4rem;">${message}</div>`;
        if (favouriteIds.includes(mealId)) {
            removeFavourite(mealId);
            button.classList.remove('active');
        } else {
            addFavourite(mealId);
            button.classList.add('active');
            showFavouritePopup('Added to favourites');
        }
    }
    function getNoResultsMessage() {
        const query = searchInput.value.trim();
        const category = categoryFilter.value;
        const cuisine = cuisineFilter.value;
        if (query) {
        if (lastSearch.isIngredientSearch) {
            return `No results found for ingredient: '${lastSearch.query}'`;
        }
        if (lastSearch.query) {
            return `No results found for: '${lastSearch.query}'`;
        }
        return 'No results found.';
    }
    function getShoppingList() {
        const list = localStorage.getItem('shoppingList');
        return list ? JSON.parse(list) : [];
    }
    function saveShoppingList(list) {
        localStorage.setItem('shoppingList', JSON.stringify(list));
    }
    function addToShoppingList() {
        const list = getShoppingList();
        const isDuplicate = list.some(item => item.ingredient === ingredient);
        if (isDuplicate) {
            showNotification('Already on your shopping list', true);
        } else {
            list.push({ingredient, measure});
            saveShoppingList(list);
            showNotification('Added to shopping list');
        }
    }
    function removeFromShoppingList(ingredient) {
        let list = getShoppingList();
        list = list.filter(item => item.ingredient !== ingredient);
        saveShoppingList(list);
    }
    function showShoppingList() {
        const list = getShoppingList();
        let listHtml = '';
        if (list.length === 0) {
            listHtml = '<p style="text-align: center; margin-top: 2rem;">Your shopping list is empty.</p>';
        } else {
            listHtml = list.map(item => `
                <li class="shopping-list-item">
                    <span>${item.ingredient} - ${item.measure}</span>
                    <button class="remove-from-list-button" data-ingredient="${item.ingredient}">Remove</button>
                </li>
            `).join('');
        }
        modalContent.innerHTML = `
            <div class="modal-header">
                <div class="modal-title-group">
                    <h2>My Shopping List</h2>
                </div>
                <button id="closeModalButton">&times;</button>
            </div>
            <div class="modal-body shopping-list-modal-body">
                <ul style="list-style: none; padding: 0;">
                    ${listHtml}
                </ul>
            </div>
        `;
        recipeModal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }
    populateFilters();
});

