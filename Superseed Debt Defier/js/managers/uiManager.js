/**
 * UIManager
 * Handles all UI updates and DOM element interactions
 */
const UIManager = (() => {
    // Cache DOM elements
    let elements = {
        levelDisplay: null,
        scoreDisplay: null,
        healthSegments: null,
        powerUpIndicators: null,
        levelMessage: null,
        damageFlash: null,
        bombFlash: null,
        gameWrapper: null,
        multiplierDisplay: null,
        bombCount: null,
        dashIcon: null,
        dashCooldown: null,
        
        // Pause menu elements
        pauseLevel: null,
        pauseScore: null,
        pauseMultiplier: null,
        pauseBombs: null,
        
        // Game over elements
        finalScoreDisplay: null,
        finalPlayerName: null
    };
    
    // Initialize by caching all DOM elements
    function initialize() {
        elements.levelDisplay = document.getElementById('levelDisplay');
        elements.scoreDisplay = document.getElementById('scoreDisplay');
        elements.healthSegments = document.getElementById('healthSegments');
        elements.powerUpIndicators = document.getElementById('powerUpIndicators');
        elements.levelMessage = document.getElementById('levelMessage');
        elements.damageFlash = document.getElementById('damageFlash');
        elements.bombFlash = document.getElementById('bombFlash');
        elements.gameWrapper = document.getElementById('gameWrapper');
        elements.multiplierDisplay = document.getElementById('multiplierDisplay');
        elements.bombCount = document.getElementById('bombCount');
        elements.dashIcon = document.getElementById('dashIcon');
        elements.dashCooldown = document.getElementById('dashCooldown');
        
        
        // Pause menu elements
        elements.pauseLevel = document.getElementById('pauseLevel');
        elements.pauseScore = document.getElementById('pauseScore');
        elements.pauseMultiplier = document.getElementById('pauseMultiplier');
        elements.pauseBombs = document.getElementById('pauseBombs');
        
        // Game over elements
        elements.finalScoreDisplay = document.getElementById('finalScoreDisplay');
        elements.finalPlayerName = document.getElementById('finalPlayerName');
        
        console.log("UI elements cached");
    }
    
    // Update score and level display
    function updateGameInfo() {
        if (elements.scoreDisplay && player) {
            elements.scoreDisplay.textContent = player.score;
        }
        
        if (elements.levelDisplay) {
            elements.levelDisplay.textContent = 'Level ' + GameManager.level;
        }
    }
    
    // Update health display with segments
    function updateHealthDisplay() {
        if (!elements.healthSegments || !player) return;
        
        elements.healthSegments.innerHTML = '';
        
        for (let i = 0; i < player.maxHealth; i++) {
            const segment = document.createElement('div');
            segment.className = 'health-segment';
            
            if (i < player.health) {
                segment.classList.add('full');
            } else {
                segment.classList.add('empty');
            }
            
            elements.healthSegments.appendChild(segment);
        }
    }
    

// Update active power-ups display
function updatePowerUpIndicators() {
    if (!elements.powerUpIndicators || !player) return;
    
    elements.powerUpIndicators.innerHTML = '';
    
    const activePowerUpsMap = [
        { key: 'rapidFire', name: 'Rapid Fire', iconClass: 'rapid-fire-icon' },
        { key: 'doubleDamage', name: 'Double Damage', iconClass: 'double-damage-icon' },
        { key: 'speedBoost', name: 'Speed Boost', iconClass: 'speed-boost-icon' },
        { key: 'spreadShot', name: 'Spread Shot', iconClass: 'spread-shot-icon' },
        { key: 'piercingShot', name: 'Piercing Shot', iconClass: 'piercing-shot-icon' },
        { key: 'homingMissile', name: 'Homing Seed', iconClass: 'homing-missile-icon' }
    ];
    
    const now = Date.now();
    
    activePowerUpsMap.forEach(powerUpInfo => {
        const powerUpState = player.powerUps[powerUpInfo.key];
        
        if (powerUpState && powerUpState.active) {
            const timeLeft = Math.max(0, (powerUpState.endTime - now) / 1000).toFixed(1);
            
            if (timeLeft > 0) {
                const indicator = document.createElement('div');
                indicator.className = 'power-up-indicator';
                indicator.innerHTML = `
                    <div class="power-up-icon ${powerUpInfo.iconClass}"></div>
                    <div style="display: flex; flex-direction: column; overflow: hidden;">
                        <div style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                            ${powerUpInfo.name}
                        </div>
                        <div style="font-size: 10px; opacity: 0.7;">${timeLeft}s</div>
                    </div>
                `;
                elements.powerUpIndicators.appendChild(indicator);
            } else {
                powerUpState.active = false;
            }
        }
    });
}
    
    // Update score multiplier display
    function updateMultiplierDisplay() {
        if (elements.multiplierDisplay && player) {
            elements.multiplierDisplay.textContent = `x${player.multiplier.toFixed(1)}`;
        }
    }
    
    // Update bomb count display
    function updateBombDisplay() {
        if (elements.bombCount && player) {
            elements.bombCount.textContent = player.bombsRemaining;
        }
    }
    
    // Show level start message
    function showLevelMessage() {
        if (!elements.levelMessage) return;
        
        elements.levelMessage.textContent = `Level ${GameManager.level}`;
        elements.levelMessage.style.opacity = '1';
        
        setTimeout(() => {
            if (elements.levelMessage) {
                elements.levelMessage.style.opacity = '0';
            }
        }, 1500);
    }
    
    // Show red flash and screen shake when damaged
    function showDamageFlash() {
        if (elements.damageFlash) {
            elements.damageFlash.classList.add('active');
            
            if (window.flashTimeout) clearTimeout(window.flashTimeout);
            
            window.flashTimeout = setTimeout(() => {
                if (elements.damageFlash) {
                    elements.damageFlash.classList.remove('active');
                }
            }, 100);
        }
        
        if (elements.gameWrapper) {
            elements.gameWrapper.classList.remove('shake');
            void elements.gameWrapper.offsetWidth; // Trigger reflow
            elements.gameWrapper.classList.add('shake');
            
            if (window.shakeTimeout) clearTimeout(window.shakeTimeout);
            
            window.shakeTimeout = setTimeout(() => {
                if (elements.gameWrapper) {
                    elements.gameWrapper.classList.remove('shake');
                }
            }, 150);
        }
    }
    
    // Show bomb flash animation
    function showBombFlash() {
        if (elements.bombFlash) {
            elements.bombFlash.classList.remove('active');
            void elements.bombFlash.offsetWidth; // Trigger reflow
            elements.bombFlash.classList.add('active');
        }
    }
    
    // Update pause menu information
    function updatePauseInfo() {
        if (elements.pauseLevel) elements.pauseLevel.textContent = GameManager.level;
        if (elements.pauseScore) elements.pauseScore.textContent = player.score;
        if (elements.pauseMultiplier) elements.pauseMultiplier.textContent = `x${player.multiplier.toFixed(1)}`;
        if (elements.pauseBombs) elements.pauseBombs.textContent = player.bombsRemaining;
    }
    
    // Update game over screen
    function updateGameOverScreen() {
        if (elements.finalScoreDisplay) {
            elements.finalScoreDisplay.textContent = player.score;
        }
        
        if (elements.finalPlayerName) {
            elements.finalPlayerName.textContent = GameManager.playerName;
        }
    }
    
    function updateDashCooldown() {
        const overlay = document.querySelector('#dashCooldown > div');
        const dashIndicator = document.getElementById('dashIndicator');
        if (!overlay || !window.player || !dashIndicator) return;
    
        const now = Date.now();
        const timeSinceDash = now - player.lastDashTime;
        const cooldown = GAME_CONFIG.DASH_COOLDOWN;
    
        const progress = Math.min(1, timeSinceDash / cooldown);
        overlay.style.height = `${(1 - progress) * 100}%`;
    
        if (progress === 1) {
            overlay.style.boxShadow = '0 0 10px #7BD0CF';
            dashIndicator.classList.add('ready');
        } else {
            overlay.style.boxShadow = 'none';
            dashIndicator.classList.remove('ready');
        }
    }

    // Public API
    return {
        initialize,
        updateGameInfo,
        updateHealthDisplay,
        updatePowerUpIndicators,
        updateMultiplierDisplay,
        updateBombDisplay,
        updateDashCooldown,
        showLevelMessage,
        showDamageFlash,
        showBombFlash,
        updatePauseInfo,
        updateGameOverScreen
    };
})();