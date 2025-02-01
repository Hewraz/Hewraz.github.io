// Core resources
let threads = 0;

// Loom Spinner data
let loomSpinners = 0;
let loomSpinnerCost = 50;

// Speed Upgrade
let speedLevel = 0;
const speedCosts = [50, 150, 300, 600, 1200];

// Efficiency Upgrade
let efficiencyLevel = 0;
const efficiencyCosts = [100, 200, 400, 800];

// Cost for weaving an event
let eventCost = 100;

// ----- HELPER FUNCTIONS -----
function getCostDiscountFactor() {
    // 5% discount per level, never below 50%
    const discount = 0.05 * efficiencyLevel;
    return Math.max(1 - discount, 0.5);
}

function getProductionMultiplier() {
    // +10% per efficiency level
    return 1 + 0.1 * efficiencyLevel;
}

// Dynamic cost for Speed Upgrades
function getSpeedUpgradeBaseCost() {
    if (speedLevel < speedCosts.length) {
        return speedCosts[speedLevel];
    } else {
        // beyond array => double the last known cost
        let lastCost = speedCosts[speedCosts.length - 1];
        return lastCost * Math.pow(2, speedLevel - speedCosts.length + 1);
    }
}
function getSpeedUpgradeCost() {
    return Math.floor(getSpeedUpgradeBaseCost() * getCostDiscountFactor());
}

// Dynamic cost for Efficiency Upgrades
function getEfficiencyUpgradeBaseCost() {
    if (efficiencyLevel < efficiencyCosts.length) {
        return efficiencyCosts[efficiencyLevel];
    } else {
        let lastCost = efficiencyCosts[efficiencyCosts.length - 1];
        return lastCost * Math.pow(2, efficiencyLevel - efficiencyCosts.length + 1);
    }
}
function getEfficiencyUpgradeCost() {
    // Efficiency upgrade cost is not discounted by itself
    return getEfficiencyUpgradeBaseCost();
}

function getLoomSpinnerCost() {
    return Math.floor(loomSpinnerCost * getCostDiscountFactor());
}

function getThreadsPerSecond() {
    // Each Loom Spinner produces 1 base, multiplied by 2^speedLevel, then efficiency bonus
    const spinnerRate = Math.pow(2, speedLevel) * getProductionMultiplier();
    return Math.floor(loomSpinners * spinnerRate);
}

// ----- UI UPDATES -----
function updateUI() {
    document.getElementById('threadCount').textContent = threads;
    document.getElementById('threadsPerSecond').textContent = getThreadsPerSecond();

    // Loom Spinner button
    const spinnerCost = getLoomSpinnerCost();
    const spinnerBtn = document.getElementById('loomSpinnerUpgrade');
    spinnerBtn.textContent = `Buy Loom Spinner (${spinnerCost} threads)`;
    spinnerBtn.disabled = threads < spinnerCost;

    // Speed Upgrade button
    const speedCost = getSpeedUpgradeCost();
    const speedBtn = document.getElementById('speedUpgrade');
    speedBtn.textContent = `Speed Upgrade (Cost: ${speedCost}, Level: ${speedLevel})`;
    speedBtn.disabled = threads < speedCost;

    // Efficiency Upgrade button
    const effCost = getEfficiencyUpgradeCost();
    const effBtn = document.getElementById('efficiencyUpgrade');
    effBtn.textContent = `Efficiency Upgrade (Cost: ${effCost}, Level: ${efficiencyLevel})`;
    effBtn.disabled = threads < effCost;

    // Event creation button
    document.getElementById('createEvent').disabled = threads < eventCost;
}

// Visual feedback
function showVisualFeedback(text, x, y) {
    const feedback = document.createElement('div');
    feedback.classList.add('visual-feedback');
    feedback.style.left = `${x}px`;
    feedback.style.top = `${y}px`;
    feedback.textContent = text;
    document.body.appendChild(feedback);

    setTimeout(() => {
        feedback.remove();
    }, 1000);
}

// ----- GAME LOGIC & EVENTS -----
document.getElementById('threadButton').addEventListener('click', (e) => {
    threads++;
    updateUI();

    // Show the +1 feedback
    const rect = e.target.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top;
    showVisualFeedback('+1', x, y);
});

document.getElementById('loomSpinnerUpgrade').addEventListener('click', () => {
    const cost = getLoomSpinnerCost();
    if (threads >= cost) {
        threads -= cost;
        loomSpinners++;
        // Increase base cost for the next Loom Spinner
        loomSpinnerCost = Math.floor(loomSpinnerCost * 1.5);
        updateUI();
    }
});

document.getElementById('speedUpgrade').addEventListener('click', () => {
    const cost = getSpeedUpgradeCost();
    if (threads >= cost) {
        threads -= cost;
        speedLevel++;
        updateUI();
    }
});

document.getElementById('efficiencyUpgrade').addEventListener('click', () => {
    const cost = getEfficiencyUpgradeCost();
    if (threads >= cost) {
        threads -= cost;
        efficiencyLevel++;
        updateUI();
    }
});

// Automation for thread production
setInterval(() => {
    const tps = getThreadsPerSecond();
    if (tps > 0) {
        threads += tps;
        updateUI();

        // Show feedback on the main button
        const button = document.getElementById('threadButton');
        const rect = button.getBoundingClientRect();
        const x = rect.left + rect.width / 2;
        const y = rect.top;
        showVisualFeedback(`+${tps}`, x, y);
    }
}, 1000);

// Create timeline event
document.getElementById('createEvent').addEventListener('click', () => {
    if (threads >= eventCost) {
        threads -= eventCost;
        const eventDiv = document.createElement('div');
        eventDiv.classList.add('event');
        eventDiv.textContent = `Event ${document.querySelectorAll('.event').length + 1}: A moment in time.`;
        document.getElementById('events').appendChild(eventDiv);
        updateUI();
    }
});

// ----- SAVE / LOAD FUNCTIONALITY -----
function saveGame() {
    const gameState = {
        threads,
        loomSpinners,
        speedLevel,
        efficiencyLevel,
        loomSpinnerCost,
        // We'll store the text from each event so we can rebuild them on load
        events: []
    };

    document.querySelectorAll('.event').forEach(eventDiv => {
        gameState.events.push(eventDiv.textContent);
    });

    localStorage.setItem('timeWeaverSave', JSON.stringify(gameState));
    // Silently save (or optionally console.log / show a small message)
    console.log('Game auto-saved.');
}

function loadGame() {
    const savedData = localStorage.getItem('timeWeaverSave');
    if (!savedData) {
        console.log('No saved game found!');
        return;
    }
    try {
        const data = JSON.parse(savedData);
        threads = data.threads || 0;
        loomSpinners = data.loomSpinners || 0;
        speedLevel = data.speedLevel || 0;
        efficiencyLevel = data.efficiencyLevel || 0;
        loomSpinnerCost = data.loomSpinnerCost || 50;

        // Rebuild event list
        const eventsContainer = document.getElementById('events');
        eventsContainer.innerHTML = '';
        if (Array.isArray(data.events)) {
            data.events.forEach((eventText) => {
                const eventDiv = document.createElement('div');
                eventDiv.classList.add('event');
                eventDiv.textContent = eventText;
                eventsContainer.appendChild(eventDiv);
            });
        }

        updateUI();
        console.log('Game auto-loaded successfully!');
    } catch (e) {
        console.error('Error loading save data: ', e);
        alert('Failed to load the game. The save data might be corrupted.');
    }
}

// Hook up manual Save/Load buttons (if kept)
document.getElementById('saveGame').addEventListener('click', saveGame);

// ----- AUTOMATIC LOAD ON PAGE LOAD -----
// This will attempt to load the game immediately.
loadGame();

// ----- AUTOMATIC SAVE -----
// Save the game every 10 seconds (adjust as desired)
setInterval(saveGame, 10000);

// Initialize UI after load or fresh start
updateUI();