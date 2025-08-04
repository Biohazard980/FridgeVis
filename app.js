document.addEventListener('DOMContentLoaded', () => {
  const itemForm = document.getElementById('item-form');
  const itemList = document.getElementById('item-list');
  const showExpiringOnly = document.getElementById('show-expiring-only');
  const recipeList = document.getElementById('recipe-list');

  let fridgeItems = JSON.parse(localStorage.getItem('fridgeItems')) || [];

  // Sample recipe database
  const recipes = [
    {
      name: 'Tomato Pasta',
      ingredients: ['tomato', 'pasta', 'olive oil', 'garlic'],
    },
    {
      name: 'Omelette',
      ingredients: ['eggs', 'milk', 'cheese'],
    },
    {
      name: 'Fruit Salad',
      ingredients: ['apple', 'banana', 'orange'],
    },
    {
      name: 'Grilled Cheese Sandwich',
      ingredients: ['bread', 'cheese', 'butter'],
    },
  ];

  const saveItems = () => {
    localStorage.setItem('fridgeItems', JSON.stringify(fridgeItems));
  };

  // Normalize strings for matching (lowercase, trimmed)
  const normalize = (str) => str.trim().toLowerCase();

  const renderItems = () => {
    itemList.innerHTML = '';
    const today = new Date();

    fridgeItems
      .sort((a, b) => new Date(a.expiration) - new Date(b.expiration))
      .forEach((item, index) => {
        const expDate = new Date(item.expiration);
        const diffTime = expDate - today;
        const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

        if (showExpiringOnly.checked && daysLeft > 3) return;

        const listItem = document.createElement('li');
        listItem.innerHTML = `
          <span><strong>${item.name}</strong> x${item.quantity} <br>(${daysLeft} day${daysLeft !== 1 ? 's' : ''} left) <br>Expires: ${item.expiration}</span>
          <button data-index="${index}" class="remove-btn">Remove</button>
        `;

        if (daysLeft <= 3 && daysLeft >= 0) {
          listItem.classList.add('expiring-soon');
        }

        if (daysLeft < 0) {
          listItem.classList.add('expired');
        }

        itemList.appendChild(listItem);
      });

    renderRecipes();
  };

  const renderRecipes = () => {
    recipeList.innerHTML = '';
    if (fridgeItems.length === 0) {
      recipeList.innerHTML = '<li>Add items to your fridge to see recipe suggestions.</li>';
      return;
    }

    // Create a map of ingredient names to expiration status
    const fridgeMap = {};
    fridgeItems.forEach(item => {
      fridgeMap[normalize(item.name)] = item;
    });

    // Score recipes by how many ingredients are in the fridge and how many are expiring soon
    const scoredRecipes = recipes.map(recipe => {
      let matched = 0;
      let expiringCount = 0;
      recipe.ingredients.forEach(ing => {
        const normIng = normalize(ing);
        if (fridgeMap[normIng]) {
          matched++;
          // Check if expiring soon
          const expDate = new Date(fridgeMap[normIng].expiration);
          const diffTime = expDate - new Date();
          const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          if (daysLeft <= 3 && daysLeft >= 0) {
            expiringCount++;
          }
        }
      });
      return {
        ...recipe,
        matched,
        expiringCount,
        missing: recipe.ingredients.length - matched,
      };
    });

    // Sort: recipes with all ingredients first, then more expiring ingredients
    scoredRecipes.sort((a, b) => {
      if (a.missing !== b.missing) return a.missing - b.missing;
      return b.expiringCount - a.expiringCount;
    });

    scoredRecipes.forEach(recipe => {
      const li = document.createElement('li');
      li.innerHTML = `
        <strong>${recipe.name}</strong><br>
        Ingredients: ${recipe.ingredients.join(', ')}<br>
        Missing ingredients: ${recipe.missing}<br>
        Using expiring ingredients: ${recipe.expiringCount}
      `;
      recipeList.appendChild(li);
    });
  };

  itemForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = document.getElementById('item-name').value;
    const expiration = document.getElementById('expiration-date').value;
    const quantity = parseInt(document.getElementById('item-quantity').value);

    fridgeItems.push({ name, expiration, quantity });
    saveItems();
    renderItems();
    itemForm.reset();
  });

  itemList.addEventListener('click', (e) => {
    if (e.target.classList.contains('remove-btn')) {
      const index = e.target.getAttribute('data-index');
      fridgeItems.splice(index, 1);
      saveItems();
      renderItems();
    }
  });

  showExpiringOnly.addEventListener('change', renderItems);

  renderItems();
});
