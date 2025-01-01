// Initial state
let farm = [];
let gold = 100;
let plotPrice = 50;
let messages = [];
let inventory = {}; // Object to store harvested crops
let growthUpgradeLevel = 0;
let yieldUpgradeLevel = 0;

let lastSavedTime = null;

// Crop definitions
const crops = {
  wheat: { name: 'Wheat', growTime: 10, value: 10 },
  corn: { name: 'Corn', growTime: 20, value: 30 },
  pumpkin: { name: 'Pumpkin', growTime: 30, value: 50 },
};


// DOM elements
const farmContainer = document.getElementById('farm');
const cropSelect = document.getElementById('crop-select');
const plantCropButton = document.getElementById('plant-crop');
const harvestButton = document.getElementById('harvest');
const addPlotButton = document.getElementById('add-plot');
const goldDisplay = document.getElementById('gold-amount');
const messageBox = document.getElementById('message-box');
const inventoryContainer = document.getElementById('inventory');
const sellCropsButton = document.getElementById('sell-crops');
const upgradeGrowthButton = document.getElementById('upgrade-growth');
const upgradeYieldButton = document.getElementById('upgrade-yield');

// Sell all crops
function sellAllCrops() {
  let totalGoldEarned = 0;
  logMessage('HELLO')

  Object.keys(inventory).forEach(crop => {
    const cropData = crops[crop];
    const cropCount = inventory[crop];
    const goldEarned = cropCount * (cropData.value + yieldUpgradeLevel * 5); // Enhanced value per yield upgrade
    totalGoldEarned += goldEarned;
    delete inventory[crop]; // Clear the inventory of the crop
  });

  if (totalGoldEarned > 0) {
    gold += totalGoldEarned;
    logMessage(`Sold all crops for ${totalGoldEarned} gold!`);
  } else {
    logMessage('No crops to sell!');
  }

  updateUI();
  saveGameState();
}

// Upgrade functions (already updated to save state after use)
function upgradeGrowthSpeed() {
  if (gold >= 100) {
    gold -= 100;
    growthUpgradeLevel++;
    logMessage(`Growth speed upgraded to level ${growthUpgradeLevel}!`);
    updateCropDropdown(); // Update dropdown after upgrade
  } else {
    logMessage('Not enough gold to upgrade growth speed!');
  }
  updateUI();
  saveGameState(); // Save the new upgrade level
}

function upgradeYield() {
  if (gold >= 200) {
    gold -= 200;
    yieldUpgradeLevel++;
    logMessage(`Yield upgraded to level ${yieldUpgradeLevel}!`);
    updateCropDropdown(); // Update dropdown after upgrade
  } else {
    logMessage('Not enough gold to upgrade yield!');
  }
  updateUI();
  saveGameState(); // Save the new upgrade level
}

// Adjust crop growth time with upgrades
function adjustGrowthTime(cropData) {
  const reductionFactor = growthUpgradeLevel * 0.1; // Reduce grow time by 10% per level
  return Math.max(1, cropData.growTime * (1 - reductionFactor)); // Minimum grow time is 1 second
}

// Utility to calculate the upgraded crop values
function getUpgradedCropData(crop) {
  const baseData = crops[crop];
  const upgradedValue = baseData.value + yieldUpgradeLevel * 5; // Yield increases by 5 per upgrade level
  const upgradedGrowTime = Math.max(1, baseData.growTime * (1 - growthUpgradeLevel * 0.1)); // Reduce grow time by 10% per level
  return { ...baseData, value: upgradedValue, growTime: upgradedGrowTime };
}

// Update the dropdown only when necessary
function updateCropDropdown() {
  const previousSelection = cropSelect.value; // Save the current selected value

  // Clear existing options
  cropSelect.innerHTML = '';

  // Populate dropdown with updated crop options
  Object.keys(crops).forEach(crop => {
    const { name, growTime, value } = getUpgradedCropData(crop);
    const option = document.createElement('option');
    option.value = crop;
    option.textContent = `${name} (${Math.round(growTime)}s, ${value} Gold)`;
    cropSelect.appendChild(option);
  });

  // Reapply the previous selection
  if (Object.keys(crops).includes(previousSelection)) {
    cropSelect.value = previousSelection;
  } else {
    // Fallback to the first option if the previous selection is invalid
    cropSelect.value = Object.keys(crops)[0];
  }
}


// Modify planting function to include growth upgrades
function plantCrop() {
  const selectedCrop = cropSelect.value;
  const cropData = crops[selectedCrop];
  const availablePlot = farm.find(plot => !plot.crop);

  if (!availablePlot) {
    logMessage('No available plots to plant!');
    return;
  }

  availablePlot.crop = selectedCrop;
  availablePlot.growTime = adjustGrowthTime(cropData);
  availablePlot.maxGrowTime = availablePlot.growTime;

  startGrowTimer(availablePlot);
  logMessage(`${cropData.name} planted!`);
  updateUI();
  saveGameState();
}

// Event listeners for shop buttons
sellCropsButton.addEventListener('click', sellAllCrops);
upgradeGrowthButton.addEventListener('click', upgradeGrowthSpeed);
upgradeYieldButton.addEventListener('click', upgradeYield);


// Update UI (Exclude dropdown updates here)
function updateUI() {
  goldDisplay.textContent = gold;

  // Update farm slots
  farmContainer.innerHTML = '';
  farm.forEach(plotData => {
    const plotElement = document.createElement('div');
    plotElement.className = 'plot';
    plotElement.innerHTML = `
      <div class="progress-bar" style="width: ${plotData.crop ? ((plotData.maxGrowTime - plotData.growTime) / plotData.maxGrowTime) * 100 : 0}%"></div>
      <div class="crop-icon" style="display: ${plotData.crop ? 'block' : 'none'};">🌱</div>
    `;
    farmContainer.appendChild(plotElement);
  });

  // Update inventory
  inventoryContainer.innerHTML = '';
  Object.keys(inventory).forEach(crop => {
    const item = document.createElement('div');
    item.className = 'inventory-item';
    item.textContent = `${crops[crop].name}: ${inventory[crop]}`;
    inventoryContainer.appendChild(item);
  });

  // Update messages
  messageBox.value = messages.join('\n');
}

// Save game state to localStorage
function saveGameState() {
  const gameState = {
    farm,
    gold,
    plotPrice,
    messages,
    inventory,
    growthUpgradeLevel,
    yieldUpgradeLevel,
    lastSavedTime: Date.now(), // Save the current timestamp
  };
  localStorage.setItem('harvestOfHeroes', JSON.stringify(gameState));
}

// Load game state from localStorage
function loadGameState() {
  const savedState = JSON.parse(localStorage.getItem('harvestOfHeroes'));
  if (savedState) {
    farm = savedState.farm;
    gold = savedState.gold;
    plotPrice = savedState.plotPrice;
    messages = savedState.messages;
    inventory = savedState.inventory;
    growthUpgradeLevel = savedState.growthUpgradeLevel || 0; // Default to 0 if missing
    yieldUpgradeLevel = savedState.yieldUpgradeLevel || 0;   // Default to 0 if missing
    lastSavedTime = savedState.lastSavedTime;

    // Update grow timers based on elapsed time
    const elapsedTime = Math.floor((Date.now() - lastSavedTime) / 1000);
    farm.forEach(plot => {
      if (plot.crop) {
        plot.growTime = Math.max(0, plot.growTime - elapsedTime); // Reduce growTime by elapsed seconds

        // If the crop is still growing, restart its timer
        if (plot.growTime > 0) {
          startGrowTimer(plot);
        }
      }
    });
  } else {
    // Initialize with one plot if no saved state
    farm.push({ crop: null, growTime: 0, maxGrowTime: 0 });
  }
}

// Plant a selected crop
function plantCrop() {
  const selectedCrop = cropSelect.value;
  const cropData = crops[selectedCrop];
  const availablePlot = farm.find(plot => !plot.crop);

  if (!availablePlot) {
    logMessage('No available plots to plant!');
    return;
  }

  availablePlot.crop = selectedCrop;
  availablePlot.growTime = cropData.growTime;
  availablePlot.maxGrowTime = cropData.growTime;

  startGrowTimer(availablePlot);
  logMessage(`${cropData.name} planted!`);
  updateUI();
  saveGameState();
}

// Start a grow timer for a plot
function startGrowTimer(plot) {
  const growInterval = setInterval(() => {
    plot.growTime -= 1;
    if (plot.growTime <= 0) {
      clearInterval(growInterval);
    }
    updateUI();
    saveGameState();
  }, 1000);
}

// Harvest crops
function harvestCrops() {
  let harvested = 0;
  farm.forEach(plot => {
    if (plot.crop && plot.growTime === 0) {
      const crop = plot.crop;
      inventory[crop] = (inventory[crop] || 0) + 1;
      plot.crop = null;
      harvested++;
    }
  });

  if (harvested > 0) {
    logMessage(`${harvested} crop(s) harvested!`);
  } else {
    logMessage('No crops ready for harvesting!');
  }
  updateUI();
  saveGameState();
}

// Log messages
function logMessage(message) {
  const timestamp = new Date().toLocaleTimeString();
  messages.unshift(`[${timestamp}] ${message}`);
  if (messages.length > 50) messages.pop();
  updateUI();
  saveGameState();
}

// Initialize game
function initializeGame() {
  loadGameState();
  updateCropDropdown(); // Populate dropdown on game load
  updateUI();
}
initializeGame();

plantCropButton.addEventListener('click', plantCrop);
harvestButton.addEventListener('click', harvestCrops);
addPlotButton.addEventListener('click', () => {
  if (gold >= plotPrice) {
    gold -= plotPrice;
    plotPrice += 25;
    farm.push({ crop: null, growTime: 0, maxGrowTime: 0 });
    logMessage('New plot added!');
  } else {
    logMessage('Not enough gold to add a new plot!');
  }
  updateUI();
  saveGameState();
});
