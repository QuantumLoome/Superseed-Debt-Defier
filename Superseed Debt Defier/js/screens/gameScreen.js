/**
 * Game Screen
 * Handles the main gameplay screen functionality
 */
const GameScreen = (() => {
    // DOM elements
    let gameWrapperElem;
    let levelMessageElem;
    
    // Initialize
    function initialize() {
        console.log("Initializing game screen...");
        
        // Cache DOM elements
        gameWrapperElem = document.getElementById('gameWrapper');
        levelMessageElem = document.getElementById('levelMessage');
        
        console.log("Game screen initialized.");
    }
    
    // Show level message
    function showLevelMessage(level) {
        if (!levelMessageElem) return;
        
        levelMessageElem.textContent = `Level ${level}`;
        levelMessageElem.style.opacity = '1';
        levelMessageElem.style.color = 'rgba(255, 255, 255, 0.5)'; // More subdued color
        levelMessageElem.style.fontSize = '1.5rem'; // Slightly smaller
        levelMessageElem.style.textShadow = '1px 1px 2px rgba(0,0,0,0.5)'; // Soft shadow
        
        setTimeout(() => {
            if (levelMessageElem) {
                levelMessageElem.style.opacity = '0';
            }
        }, 1500);
    }
    
    // Show damage flash effect
    function showDamageFlash() {
        const damageFlashElem = document.getElementById('damageFlash');
        
        if (damageFlashElem) {
            damageFlashElem.classList.add('active');
            
            if (window.flashTimeout) clearTimeout(window.flashTimeout);
            
            window.flashTimeout = setTimeout(() => {
                if (damageFlashElem) {
                    damageFlashElem.classList.remove('active');
                }
            }, 100);
        }
        
        if (gameWrapperElem) {
            gameWrapperElem.classList.remove('shake');
            void gameWrapperElem.offsetWidth; // Trigger reflow
            gameWrapperElem.classList.add('shake');
            
            if (window.shakeTimeout) clearTimeout(window.shakeTimeout);
            
            window.shakeTimeout = setTimeout(() => {
                if (gameWrapperElem) {
                    gameWrapperElem.classList.remove('shake');
                }
            }, 150);
        }
    }
    
    // Show bomb flash effect
    function showBombFlash() {
        const bombFlashElem = document.getElementById('bombFlash');
        
        if (bombFlashElem) {
            bombFlashElem.classList.remove('active');
            void bombFlashElem.offsetWidth; // Trigger reflow
            bombFlashElem.classList.add('active');
        }
    }
    
    // Public API
    return {
        initialize,
        showLevelMessage,
        showDamageFlash,
        showBombFlash
    };
})();