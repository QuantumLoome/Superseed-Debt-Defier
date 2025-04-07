/**
 * Pause Screen
 * Handles the pause screen functionality
 */
const PauseScreen = (() => {
    // DOM elements
    let pauseMenuElem;
    let pauseLevelElem;
    let pauseScoreElem;
    let pauseMultiplierElem;
    let pauseBombsElem;
    let resumeButtonElem;
    let restartButtonElem;
    let pauseBackgroundElem;
    
    // Initialize
    function initialize() {
        console.log("Initializing pause screen...");
        
        // Cache DOM elements
        pauseMenuElem = document.getElementById('pauseMenu');
        pauseLevelElem = document.getElementById('pauseLevel');
        pauseScoreElem = document.getElementById('pauseScore');
        pauseMultiplierElem = document.getElementById('pauseMultiplier');
        pauseBombsElem = document.getElementById('pauseBombs');
        resumeButtonElem = document.getElementById('resumeButton');
        restartButtonElem = document.getElementById('restartPauseButton');
        pauseBackgroundElem = document.getElementById('pauseBackground');
        
        // Set up button event listeners
        if (resumeButtonElem) {
            resumeButtonElem.addEventListener('click', GameManager.resumeGame);
        } else {
            console.error("Resume button element not found!");
        }
        
        if (restartButtonElem) {
            restartButtonElem.addEventListener('click', GameManager.startGame);
        } else {
            console.error("Restart button element not found on pause screen!");
        }
        
        // Create pause background element if it doesn't exist
        if (!pauseBackgroundElem && pauseMenuElem) {
            pauseBackgroundElem = document.createElement('div');
            pauseBackgroundElem.id = 'pauseBackground';
            pauseMenuElem.prepend(pauseBackgroundElem);
            
            // Apply styling
            pauseBackgroundElem.style.position = 'absolute';
            pauseBackgroundElem.style.top = '0';
            pauseBackgroundElem.style.left = '0';
            pauseBackgroundElem.style.width = '100%';
            pauseBackgroundElem.style.height = '100%';
            
            // Try different approaches to set the background image
            const sprite = GameAssets && GameAssets.getSprite ? GameAssets.getSprite('pauseBackground') : null;
            
            if (sprite && sprite.src) {
                // If sprite is loaded, use it directly
                console.log("Using loaded pause background sprite");
                pauseBackgroundElem.style.backgroundImage = `url(${sprite.src})`;
            } else {
                // Try direct path
                console.log("Using direct path for pause background");
                pauseBackgroundElem.style.backgroundImage = 'url("assets/images/pause-background.png")';
            }
            
            pauseBackgroundElem.style.backgroundSize = 'cover';
            pauseBackgroundElem.style.backgroundPosition = 'center';
            pauseBackgroundElem.style.backgroundColor = 'rgba(0, 0, 0, 0.5)'; // Fallback color
            pauseBackgroundElem.style.opacity = '0';
            pauseBackgroundElem.style.zIndex = '-1';
            pauseBackgroundElem.style.transition = 'opacity 0.3s ease-in-out';
        }
        
        console.log("Pause screen initialized.");
    }
    
    // Show pause menu
    function show() {
        if (!pauseMenuElem) return;
        
        // Update pause info
        updatePauseInfo();
        
        // Show the pause menu
        pauseMenuElem.classList.add('active');
        
        // Fade in the background
        if (pauseBackgroundElem) {
            pauseBackgroundElem.style.opacity = '0';
            setTimeout(() => {
                pauseBackgroundElem.style.opacity = '0.7'; // Higher opacity for better visibility
            }, 10);
        }
    }
    
    // Hide pause menu
    function hide() {
        if (!pauseMenuElem) return;
        pauseMenuElem.classList.remove('active');
        
        // Fade out the background
        if (pauseBackgroundElem) {
            pauseBackgroundElem.style.opacity = '0';
        }
    }
    
    // Update pause screen information
    function updatePauseInfo() {
        if (!player) return;
        
        if (pauseLevelElem) pauseLevelElem.textContent = GameManager.level;
        if (pauseScoreElem) pauseScoreElem.textContent = player.score;
        if (pauseMultiplierElem) pauseMultiplierElem.textContent = `x${player.multiplier.toFixed(1)}`;
        if (pauseBombsElem) pauseBombsElem.textContent = player.bombsRemaining;
    }
    
    // Public API
    return {
        initialize,
        show,
        hide,
        updatePauseInfo
    };
})();