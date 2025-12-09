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
    const ingredientSearchInput = document.getElementById('ingredientSearchInput');
    const ingredientSearchButton = document.getElementById('ingredientSearchButton');
    const mealPlanButton = document.getElementById('mealPlanButton');
    const mealPlanModal = document.getElementById('mealPlanModal');
    const mealPlanModalContent = document.getElementById('mealPlanModalContent');

    const API_KEY = '1'; 
    const API_BASE = `https://www.themealdb.com/api/json/v1/${API_KEY}`;
    const API_URL_SEARCH = `${API_BASE}/search.php?s=`;
    const API_URL_LOOKUP = `${API_BASE}/lookup.php?i=`;
    const API_URL_RANDOM = `${API_BASE}/random.php`;
    const API_URL_LIST_CATEGORIES = `${API_BASE}/list.php?c=list`;
    const API_URL_LIST_CUISINES = `${API_BASE}/list.php?a=list`;
    const API_URL_FILTER_CATEGORY = `${API_BASE}/filter.php?c=`;
    const API_URL_FILTER_CUISINE = `${API_BASE}/filter.php?a=`;
    const API_URL_FILTER_INGREDIENT = `${API_BASE}/filter.php?i=`;

    let lastSearch = {query: '', isIngredientSearch: false};

    searchButton.addEventListener('click', searchMeals);
    favouritesButton.addEventListener('click', showFavourites);
    shoppingListButton.addEventListener('click', showShoppingList);
    ingredientSearchButton.addEventListener('click', searchByIngredient);
    
    if (mealPlanButton) {
        mealPlanButton.addEventListener('click', showMealPlanModal);
    }

    modalContent.addEventListener('click', (event) => {
        if (event.target.id === 'closeModalButton' || event.target.closest('#closeModalButton')) {
            closeModal();
            return;
        }
        
        const favouriteButton = event.target.closest('.favourite-button');
        if (favouriteButton) {
            const mealId = favouriteButton.dataset.id;
            toggleFavourite(mealId, favouriteButton);
            return;
        }

        const addToListButton = event.target.closest('.add-to-list-button');
        if (addToListButton) {
            const ingredient = addToListButton.dataset.ingredient;
            const measure = addToListButton.dataset.measure;
            addToShoppingList(ingredient, measure);
            return;
        }

        const removeFromListButton = event.target.closest('.remove-from-list-button');
        if (removeFromListButton) {
            const ingredient = removeFromListButton.dataset.ingredient;
            removeFromShoppingList(ingredient);
            showShoppingList(); 
            return;
        }

        const addToPlanButton = event.target.closest('.add-to-plan-button');
        if (addToPlanButton) {
            const mealId = addToPlanButton.dataset.id;
            const mealName = addToPlanButton.dataset.name;
            showDaySelector(mealId, mealName); 
            return;
        }

        const daySelectButton = event.target.closest('.day-select-button');
        if (daySelectButton) {
            const {day, id, name} = daySelectButton.dataset;
            addMealToPlan(day, id, name);
            getRecipeDetails(id); 
            return;
        }

        const backToRecipeButton = event.target.closest('.back-to-recipe-button');
        if (backToRecipeButton) {
            getRecipeDetails(backToRecipeButton.dataset.id);
            return;
        }
    });

    searchInput.addEventListener('keyup', (event) => {
        categoryFilter.value = 'all';
        cuisineFilter.value = 'all';
        ingredientSearchInput.value = '';
        if (event.key === 'Enter') searchMeals();
    });

    ingredientSearchInput.addEventListener('keyup', (event) => {
        searchInput.value = '';
        categoryFilter.value = 'all';
        cuisineFilter.value = 'all';
        if (event.key === 'Enter') searchByIngredient();
    });

    recipeModal.addEventListener('click', (event) => {
        if (event.target === recipeModal) closeModal();
    });

    if (mealPlanModal) {
        mealPlanModal.addEventListener('click', (event) => {
            if (event.target === mealPlanModal) closeMealPlanModal();
        });
    }

    if (mealPlanModalContent) {
        mealPlanModalContent.addEventListener('click', (event) => {
            if (event.target.closest('#closeMealPlanModalButton')) {
                closeMealPlanModal();
                return;
            }
            const removeFromPlanButton = event.target.closest('.remove-from-plan-button');
            if (removeFromPlanButton) {
                const day = removeFromPlanButton.dataset.day;
                removeMealFromPlan(day);
                showMealPlanModal(); 
                return;
            }
            const mealPlanItem = event.target.closest('.meal-plan-item[data-id]');
            if (mealPlanItem) {
                const mealId = mealPlanItem.dataset.id;
                closeMealPlanModal();
                getRecipeDetails(mealId);
                return;
            }
        });
    }

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            if (!recipeModal.classList.contains('hidden')) closeModal();
            if (mealPlanModal && !mealPlanModal.classList.contains('hidden')) closeMealPlanModal();
        }
    });

    searchInput.addEventListener('input', () => {
        categoryFilter.value = 'all';
        cuisineFilter.value = 'all';
    });

    categoryFilter.addEventListener('change', () => {
        searchInput.value = '';
        cuisineFilter.value = 'all';
        ingredientSearchInput.value = '';
        searchMeals();
    });

    cuisineFilter.addEventListener('change', () => {
        searchInput.value = '';
        categoryFilter.value = 'all';
        ingredientSearchInput.value = '';
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
            console.error('Failed to get filters:', error);
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
            currentQuery = category;
        } else if (cuisine !== 'all') {
            currentQuery = cuisine;
            url = `${API_URL_FILTER_CUISINE}${cuisine}`;
        } else {
            displayMessage('Please enter a meal, select a category, or choose a cuisine.');
            return;
        }
        await fetchAndDisplay(url, currentQuery);
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
                fetch(`${API_URL_LOOKUP}${id}`).then(res => res.json())
            );
            const results = await Promise.all(promises);
            const meals = results.filter(res => res.meals).map(res => res.meals[0]);
            
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
            if (meal[`strIngredient${i}`] && meal[`strIngredient${i}`].trim() !== "") {
                const ingredientName = meal[`strIngredient${i}`];
                const ingredientMeasure = meal[`strMeasure${i}`] || "";
                ingredients.push(`
                    <li class="ingredient-item">
                        <span>${ingredientName} - ${ingredientMeasure}</span>
                        <button class="add-to-list-button" data-ingredient="${ingredientName}" data-measure="${ingredientMeasure}">+</button>
                    </li>
                `);
            } else {
                continue; 
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
                </div>`;
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
                ${videoHtml}
                <h3>Ingredients</h3>
                <ul>${ingredients.join('')}</ul> 
                <h3>Instructions</h3>
                <p>${meal.strInstructions.replace(/\n/g, '<br>')}</p>
                <div class="modal-footer-actions">
                    <button class="add-to-plan-button" data-id="${meal.idMeal}" data-name="${meal.strMeal}">
                        Add to Meal Plan
                    </button>
                </div>
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
            showNotification('Added to favourites');
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

    function showNotification(message, isError = false) {
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
    }

    function getNoResultsMessage() {
        if (lastSearch.isIngredientSearch) {
            return `No results found for ingredient: '${lastSearch.query}'`;
        }
        if (lastSearch.query) {
            return `No results found for: '${lastSearch.query}'`;
        }
        const category = categoryFilter.value;
        const cuisine = cuisineFilter.value;
        if (category !== 'all') {
             return `No results found in category: '${category}'`;
        }
        if (cuisine !== 'all') {
            return `No results found for cuisine: '${cuisine}'`;
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

    function addToShoppingList(ingredient, measure) {
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

    function getMealPlan() {
        const plan = localStorage.getItem('mealPlan');
        if (plan) {
            return JSON.parse(plan);
        }
        return {
            Monday: null,
            Tuesday: null,
            Wednesday: null,
            Thursday: null,
            Friday: null,
            Saturday: null,
            Sunday: null
        };
    }

    function saveMealPlan(plan) {
        localStorage.setItem('mealPlan', JSON.stringify(plan));
    }

    function showMealPlanModal() {
        if (!mealPlanModal || !mealPlanModalContent) return;
        const plan = getMealPlan();
        const days = Object.keys(plan);
        
        let planHtml = days.map(day => {
            const meal = plan[day];
            let mealHtml = '';
            if (meal) {
                mealHtml = `
                    <div class="meal-plan-item" data-id="${meal.id}">
                        <h4>${meal.name}</h4>
                    </div>
                    <button class="remove-from-plan-button" data-day="${day}">Remove</button>
                `;
            } else {
                mealHtml = '<p class="meal-plan-empty">No meal planned.</p>';
            }
            return `
                <div class="meal-plan-day">
                    <h3>${day}</h3>
                    ${mealHtml}
                </div>
            `;
        }).join('');

        mealPlanModalContent.innerHTML = `
            <div class="modal-header">
                <div class="modal-title-group">
                    <h2>My Weekly Meal Plan</h2>
                </div>
                <button id="closeMealPlanModalButton">&times;</button>
            </div>
            <div class="modal-body meal-plan-modal-body">
                ${planHtml}
            </div>
        `;
        mealPlanModal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }

    function closeMealPlanModal() {
        if (!mealPlanModal) return;
        mealPlanModal.classList.add('hidden');
        document.body.style.overflow = '';
    }

    function showDaySelector(mealId, mealName) {
        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        const dayButtons = days.map(day => `
            <button class="day-select-button" 
                    data-day="${day}" 
                    data-id="${mealId}" 
                    data-name="${mealName}">
                ${day}
            </button>
        `).join('');

        modalContent.innerHTML = `
            <div class="modal-header">
                <div class="modal-title-group">
                    <h2>Add "${mealName}" to...</h2>
                </div>
                <button id="closeModalButton">&times;</button>
            </div>
            <div class="modal-body day-selector-body">
                ${dayButtons}
            </div>
            <div class="modal-footer-actions">
                <button class="back-to-recipe-button" data-id="${mealId}">Back to Recipe</button>
            </div>
        `;
    }

    function addMealToPlan(day, mealId, mealName) {
        const plan = getMealPlan();
        plan[day] = {id: mealId, name: mealName};
        saveMealPlan(plan);
        showNotification(`Added ${mealName} to ${day}`);
    }

    function removeMealFromPlan(day) {
        const plan = getMealPlan();
        plan[day] = null;
        saveMealPlan(plan);
        showNotification(`Removed meal from ${day}`);
    }

    populateFilters();
});