/**
 * Game Over Screen
 * Handles the game over screen functionality
 */
const GameOverScreen = (() => {
    // DOM elements
    let gameOverScreenElem;
    let finalScoreDisplayElem;
    let finalPlayerNameElem;
    let restartButtonElem;
    let shareButtonElem;
    let returnMenuButtonElem;
    
    // Initialize
    function initialize() {
        console.log("Initializing game over screen...");
        
        // Cache DOM elements
        gameOverScreenElem = document.getElementById('gameOverScreen');
        finalScoreDisplayElem = document.getElementById('finalScoreDisplay');
        finalPlayerNameElem = document.getElementById('finalPlayerName');
        restartButtonElem = document.getElementById('restartButton');
        shareButtonElem = document.getElementById('shareButton');
        returnMenuButtonElem = document.getElementById('returnMenuButton');
        
        // Set up event handlers
        if (restartButtonElem) {
            restartButtonElem.addEventListener('click', GameManager.startGame);
        } else {
            console.error("Restart button element not found!");
        }
        
        if (shareButtonElem) {
            shareButtonElem.addEventListener('click', shareScore);
        } else {
            console.error("Share button element not found!");
        }
        
        if (returnMenuButtonElem) {
            returnMenuButtonElem.addEventListener('click', GameManager.returnToMainMenu);
        } else {
            console.error("Return Menu button element not found!");
        }
        
        console.log("Game over screen initialized.");
    }
    
// Show game over screen
function show() {
    if (!gameOverScreenElem) return;
    
    // Set the background image for the game over screen
    gameOverScreenElem.style.backgroundImage = 'url("assets/images/end-game.png")';
    gameOverScreenElem.style.backgroundSize = 'cover';
    gameOverScreenElem.style.backgroundPosition = 'center';
    gameOverScreenElem.style.backgroundRepeat = 'no-repeat';

    // Show orange glow effect
    const orangeGlow = document.querySelector('.orange-glow');
if (orangeGlow) {
    orangeGlow.style.display = 'block';
}

    // Update final score
    updateFinalScore();
    
    // Show screen with animation
    gameOverScreenElem.style.display = 'flex';
    const gameOverContent = document.getElementById('gameOverContent');
    
    if (gameOverContent) {
        gameOverContent.style.opacity = '0';
        void gameOverContent.offsetWidth; // Trigger reflow
        gameOverContent.style.animation = 'fadeIn 0.5s 0.2s ease-out forwards';
    }
}

// Hide game over screen
function hide() {
    if (!gameOverScreenElem) return;
    gameOverScreenElem.style.display = 'none';
    
    // Hide orange glow effect
    const orangeGlow = document.querySelector('.orange-glow');
    if (orangeGlow) {
        orangeGlow.style.display = 'none';
    }
}
    
    // Update final score display
    function updateFinalScore() {
        if (!player) return;
        
        if (finalScoreDisplayElem) {
            finalScoreDisplayElem.textContent = player.score;
        }
        
        if (finalPlayerNameElem) {
            finalPlayerNameElem.textContent = GameManager.playerName;
        }
    }
    
    // Share score to Twitter
    function shareScore() {
        if (!player) return;
        
        const score = player.score;
        const playerName = GameManager.playerName;
        const text = `I just scored ${score} points as Defier ${playerName} in Debt Defier! Can you beat my score? #DebtDefierGameSuperseed`;
        const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
        
        const shareWindow = window.open(url, '_blank', 'width=550,height=420,noopener,noreferrer');
        
        if (shareWindow) {
            shareWindow.focus();
        } else {
            console.warn("Could not open share window. Pop-up blocker might be active.");
        }
    }
    

    
    // Public API
    return {
        initialize,
        show,
        hide,
        updateFinalScore
    };
})();