/**
 * Start Screen
 * Handles the initial game screen functionality
 */
const StartScreen = (() => {
    // DOM elements
    let startScreenElem;
    let playerNameInputElem;
    let startButtonElem;
    let helpButtonElem;
    
    // Initialize
    function initialize() {
        console.log("Initializing start screen...");
        
        // Cache DOM elements
        startScreenElem = document.getElementById('startScreen');
        playerNameInputElem = document.getElementById('playerNameInput');
        startButtonElem = document.getElementById('startButton');
        helpButtonElem = document.getElementById('helpButton');

        if (helpButtonElem) {
            helpButtonElem.addEventListener('click', () => {
              const helpModal = document.getElementById('helpModal');
              if (helpModal) {
                helpModal.style.display = 'flex';
              }
            });
          } else {
            console.error("Help button not found!");
          }
        
        // Set up event handlers
        if (startButtonElem) {
            startButtonElem.addEventListener('click', GameManager.startGame);
        } else {
            console.error("Start button element not found!");
        }
        
        console.log("Start screen initialized.");
    }
    
    // Show start screen with animations
    function show() {
        if (!startScreenElem) return;
        
        startScreenElem.style.display = 'flex';
        startScreenElem.style.opacity = '0';
        void startScreenElem.offsetWidth; // Trigger reflow
        startScreenElem.style.animation = 'fadeIn 0.5s 0.1s ease-out forwards';
        
        // Animate children
        const children = startScreenElem.querySelectorAll(':scope > *');
        children.forEach(child => {
            child.style.opacity = '0';
            child.style.animation = 'none';
            void child.offsetWidth; // Trigger reflow
            
            if (child.tagName === 'H1') {
                child.style.animation = 'fadeIn 0.6s 0.2s ease-out forwards';
            } else if (child.tagName === 'H2') {
                child.style.animation = 'fadeIn 0.6s 0.4s ease-out forwards';
            } else if (child.classList.contains('instructions-group')) {
                child.style.animation = 'fadeIn 0.6s 0.6s ease-out forwards';
            } else if (child.id === 'nameInputGroup') {
                child.style.animation = 'fadeIn 0.6s 0.7s ease-out forwards';
            } else if (child.tagName === 'BUTTON') {
                child.style.animation = 'fadeIn 0.6s 0.8s ease-out forwards, pulse 2s infinite ease-in-out';
            } else {
                child.style.animation = 'fadeIn 0.6s ease-out forwards';
            }
        });
    }
    
    // Hide start screen
    function hide() {
        if (!startScreenElem) return;
        startScreenElem.style.display = 'none';
    }
    
    // Get player name from input
    function getPlayerName() {
        return playerNameInputElem ? playerNameInputElem.value.trim() : "Defier";
    }
    
    // Public API
    return {
        initialize,
        show,
        hide,
        getPlayerName
    };
})();

// ===== NEW CODE START – Close Help Modal Functionality =====
document.addEventListener('DOMContentLoaded', () => {
  const closeHelpModal = document.getElementById('closeHelpModal');
  if (closeHelpModal) {
    closeHelpModal.addEventListener('click', () => {
      const helpModal = document.getElementById('helpModal');
      if (helpModal) {
        helpModal.style.display = 'none';
      }
    });
  } else {
    console.error("closeHelpModal element not found.");
  }
});
// ===== NEW CODE END =====
