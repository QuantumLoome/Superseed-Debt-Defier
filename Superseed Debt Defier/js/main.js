/**
 * Main Game Entry Point
 * Initializes and manages the main game loop
 */
const GameManager = (() => {
    // Game state variables
    let gameState = 'start';
    let isPaused = false;
    let level = 1;
    let playerName = "Agent";
    let frameCount = 0;
    let lastTimestamp = 0;
    let levelCompleteTime = 0;
    let animationFrameId = null;
    let playerSlowFactor = 1.0;
    
    // Game entities
    let player;
    let enemies = [];
    let powerUps = [];
    let stars = [];
    
        // DOM elements for screens
    let startScreenElem;
    let gameOverScreenElem;
    let pauseMenuElem;
    let playerNameInputElem;
    
    // Canvas and context - these will be defined during initialization
    let canvas;
    let ctx;
    
    // Game border
    let borderPathPoints = [];

    // Create a default player to prevent null references 
    function createDefaultPlayer() {
        return {
            x: 0,
            y: 0,
            radius: 15,
            speed: 4,
            health: 3,
            maxHealth: 3,
            score: 0,
            fireRate: 120,
            lastFired: -Infinity,
            projectileSpeed: 8,
            damage: 10,
            direction: { x: 0, y: 1 },
            invulnerable: false,
            invulnerableTime: 0,
            multiplier: 1.0,
            lastFragmentCollectionTime: 0,
            bombsRemaining: 0,
            lastBombTime: 0,
            lastHomingFired: 0,
            powerUps: {
                rapidFire: { active: false, endTime: 0 },
                doubleDamage: { active: false, endTime: 0 },
                speedBoost: { active: false, endTime: 0 },
                spreadShot: { active: false, endTime: 0 },
                piercingShot: { active: false, endTime: 0 },
                homingMissile: { active: false, endTime: 0 }
            }
        };
    }
    
    // Initialize game
    async function initialize() {
        console.log("Initializing game...");
        
        try {
            // Get canvas and context - Important to do this first!
            canvas = document.getElementById('gameCanvas');
            if (!canvas) {
                throw new Error("Canvas element not found!");
            }
            ctx = canvas.getContext('2d');
            
            // Make canvas and ctx globally available
            window.canvas = canvas;
            window.ctx = ctx;

        // Add this new block of code right here
        // Load game sprites
        console.log("Loading game sprites...");
        await loadGameSprites();
        // End of new code block

            // Create default player to prevent null reference errors
            player = createDefaultPlayer();
            window.player = player;
            window.enemies = [];
            window.powerUps = [];
            
            // Cache screen elements
            startScreenElem = document.getElementById('startScreen');
            gameOverScreenElem = document.getElementById('gameOverScreen');
            pauseMenuElem = document.getElementById('pauseMenu');
            playerNameInputElem = document.getElementById('playerNameInput');
            
            // Initialize subsystems in correct order
            BackgroundSystem.initialize();
            PoolManager.initialize();
            UIManager.initialize();
            
            // Initialize screen controllers
            StartScreen.initialize();
            GameScreen.initialize();
            PauseScreen.initialize();
            GameOverScreen.initialize();
            
            // Finally initialize input last (after all UI is ready)
            InputManager.initialize({
                canvas: canvas,
                startGame: startGame,
                pauseGame: pauseGame,
                resumeGame: resumeGame,
                returnToMainMenu: returnToMainMenu,
                triggerBomb: triggerBomb,
                triggerDash: function() {  // Add this line
                    if (player && PlayerSystem.triggerDash) {
                        PlayerSystem.triggerDash(Date.now());
                    }
                },
                shareScore: function() {
                    shareToTwitter(playerName, player.score || 0);
                }
            });
            
            // PERFORMANCE OPTIMIZATION: Pre-create a large batch of particles
            console.log("Pre-creating particles to eliminate first-bomb lag...");
            // Create 50+ particles up front and force them through an update cycle
            for (let i = 0; i < 50; i++) {
                const p = PoolManager.get('particles');
                if (p) {
                    // Create with the exact same parameters used by the bomb
                    p.spawn(0, 0, 3, "#ffffff", 0, 0, 1, 0.02);
                    p.update(0.016); // Force a single update cycle
                    p.reset();
                }
            }

            // Create a batch of enemy explosion particles with same parameters as bomb
            for (let i = 0; i < 50; i++) {
                createParticles(-1000, -1000, "#ff0000", 4, 3, 3);
            }

            // Force immediate garbage collection
            setTimeout(() => {
                console.log("Initial particle warm-up complete");
            }, 100);
            // Initialize border
            borderPathPoints = initializeBorderPath(canvas.width, canvas.height, 4, 20);
            
            // Start game loop
            if (!animationFrameId) {
                lastTimestamp = performance.now();
                animationFrameId = requestAnimationFrame(gameLoop);
            }
            
            console.log("Game initialized successfully.");
        } catch (error) {
            console.error("Critical error during initialization:", error);
            document.body.innerHTML = '<div style="color: red; padding: 20px; text-align: center;">Critical Error during game initialization: ' + error.message + '</div>';
            throw error;
        }
    }
    
    // Start new game
    function startGame() {
        try {
            console.log("Starting new game...");
            
            // Get player name
            playerName = StartScreen.getPlayerName();
            console.log("Player Name:", playerName);
            
            // Reset game state
            isPaused = false;
            gameState = 'playing';
            level = 1;
            frameCount = 0;
            
            // Initialize player
            player = PlayerSystem.createPlayer();
            window.player = player;
            
            // Clear game objects
            enemies = [];
            window.enemies = enemies;
            powerUps = [];
            window.powerUps = powerUps;
            PoolManager.resetAll();
            
            // Generate level (using LevelManager from levelManager.js)
            LevelManager.generateLevel(level);
            
            // Update UI
            UIManager.updateHealthDisplay();
            UIManager.updateMultiplierDisplay();
            UIManager.updateBombDisplay();
            UIManager.updateGameInfo();
            UIManager.updatePowerUpIndicators();
            
            // Hide screens
            StartScreen.hide();
            GameOverScreen.hide();
            PauseScreen.hide();
            
            // Start game loop if not running
            if (animationFrameId) cancelAnimationFrame(animationFrameId);
            lastTimestamp = performance.now();
            animationFrameId = requestAnimationFrame(gameLoop);
            
            console.log("Game started successfully.");
        } catch (error) {
            console.error("ERROR in startGame():", error);
            gameOver();
        }
    }
    
 // End game
function gameOver() {
    if (gameState === 'gameOver') return;
    
    console.log("Game Over!");
    
    isPaused = false;
    gameState = 'gameOver';
    
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
    
    // Hide pause menu if visible
    PauseScreen.hide();
    
    // Ensure GameOverScreen is defined before calling show
    if (typeof GameOverScreen !== 'undefined' && GameOverScreen.show) {
        GameOverScreen.show();
    } else {
        console.error("GameOverScreen is not properly initialized");
        // Fallback display method
        alert(`Game Over! Your score: ${player.score}`);
    }
    
    // Restart game loop for background effects
    animationFrameId = requestAnimationFrame(gameLoop);
}
    
    // Return to main menu
    function returnToMainMenu() {
        console.log("Returning to main menu.");
        
        isPaused = false;
        
        // Hide screens
        GameOverScreen.hide();
        PauseScreen.hide();
        
        // Show start screen
        StartScreen.show();
        
        gameState = 'start';
        
        // Restart game loop if not running
        if (!animationFrameId) {
            animationFrameId = requestAnimationFrame(gameLoop);
        }
    }
    
    // Proceed to next level
    function nextLevel() {
        console.log(`Going to level ${level + 1}...`);
        
        level++;
        
        // Award extra health every 3 levels
        if (level % 3 === 0) {
            player.maxHealth += 1;
            player.health = Math.min(player.maxHealth, player.health + 1);
            UIManager.updateHealthDisplay();
        }
        
        // Clear all projectiles
        // PoolManager.getActive('projectiles').forEach(p => PoolManager.release(p));
        // PoolManager.getActive('enemyProjectiles').forEach(p => PoolManager.release(p));
        
        // Clear existing enemies array
        window.enemies = [];
        enemies = [];
        
        // Generate new level (using LevelManager from levelManager.js)
        LevelManager.generateLevel(level);
        
        // Show level message
        GameScreen.showLevelMessage(level);
    }
    
    // Pause game
    function pauseGame() {
        if (gameState !== 'playing') return;
        
        isPaused = true;
        
        // Show pause menu
        PauseScreen.show();
        
        console.log("Game Paused");
    }
    
    // Resume paused game
    function resumeGame() {
        if (!isPaused) return;
        
        isPaused = false;
        
        // Hide pause menu
        PauseScreen.hide();
        
        // Reset timestamp to prevent large delta
        lastTimestamp = performance.now();
        
        // Restart animation if needed
        if (!animationFrameId) {
            animationFrameId = requestAnimationFrame(gameLoop);
        }
        
        console.log("Game Resumed");
    }
    
    // Use bomb ability
        let firstBombUsed = false;
        
        function triggerBomb() {
            const now = Date.now();
            
            if (!player.bombsRemaining) return;
            
            if (player.bombsRemaining > 0 && now - player.lastBombTime > GAME_CONFIG.BOMB_COOLDOWN) {
                console.log("BOMB triggered!");
                
                // Add this block
                const gameWrapper = document.getElementById('gameWrapper');
                const fullRepaidMessage = document.createElement('div');
                fullRepaidMessage.textContent = 'FULLY REPAID!';
                fullRepaidMessage.style.position = 'absolute';
                fullRepaidMessage.style.top = '50%';
                fullRepaidMessage.style.left = '50%';
                fullRepaidMessage.style.transform = 'translate(-50%, -50%)';
                fullRepaidMessage.style.color = 'rgba(123, 208, 207, 0.7)';
                fullRepaidMessage.style.fontSize = '2rem';
                fullRepaidMessage.style.fontWeight = 'bold';
                fullRepaidMessage.style.textShadow = '2px 2px 4px rgba(0,0,0,0.5)';
                fullRepaidMessage.style.zIndex = '10';
                fullRepaidMessage.style.opacity = '0';
                
                gameWrapper.appendChild(fullRepaidMessage);
                
                // Animate the message
                setTimeout(() => {
                    fullRepaidMessage.style.transition = 'opacity 0.1s ease-in-out';
                    fullRepaidMessage.style.opacity = '1';
                    
                    setTimeout(() => {
                        fullRepaidMessage.style.opacity = '0';
                        setTimeout(() => {
                            gameWrapper.removeChild(fullRepaidMessage);
                        }, 500);
                    }, 1000);
                }, 100);
                
                player.bombsRemaining--;
                player.lastBombTime = now;
                
                // Update bomb count display
                UIManager.updateBombDisplay();
                
                // Show bomb flash effect
                GameScreen.showBombFlash();
                
                // Add screen shake effect for more impact
                if (gameWrapper) {
                    gameWrapper.classList.add('bomb-shake');
                    setTimeout(() => {
                        if (gameWrapper) {
                            gameWrapper.classList.remove('bomb-shake');
                        }
                    }, 600);
                }
                // Track bosses and regular enemies separately
                const preservedEnemies = [];
                
                // Process each enemy
                for (let i = 0; i < window.enemies.length; i++) {
                    const enemy = window.enemies[i];
                    
                    if (!enemy.active) continue;
                    
                    // Hard-coded check for boss
                    const isBoss = (enemy.type.name === "The Creditor" || enemy.radius >= 40);
                    
                    if (isBoss) {
                        // PRESERVE BOSS
                        createParticles(enemy.x, enemy.y, enemy.color, 20, 4, 4);
                        console.log("Preserving boss enemy:", enemy.type.name);
                        preservedEnemies.push(enemy);
                    } else {
                        // Destroy regular enemy
                        createParticles(enemy.x, enemy.y, enemy.color, 30, 6, 5);
                        enemy.active = false;
                    }
                }
                
                // Clear enemy projectiles
                PoolManager.getActive('enemyProjectiles').forEach(proj => {
                    if (proj.active) {
                        createParticles(proj.x, proj.y, proj.color, 10, 3, 3);
                        PoolManager.release(proj);
                    }
                });
                
                // Set the global and local arrays to ONLY include preserved bosses
                window.enemies = preservedEnemies;
                enemies = preservedEnemies;
                
                console.log("After bomb: Preserved " + preservedEnemies.length + " boss enemies");
            }
        }
    
    // Main game loop
    function gameLoop(timestamp) {
        // Skip updates if paused, but still render
        if (isPaused) {
            animationFrameId = requestAnimationFrame(gameLoop);
            return;
        }
        
        // Ensure timestamp is a number
        if (typeof timestamp !== 'number') {
            timestamp = performance.now();
        }
        
        // Calculate delta time
        const now = Date.now();
        let deltaTime = (timestamp - lastTimestamp) / 1000;
        
        // Cap delta time to prevent large jumps
        if (deltaTime > 0.5) {
            deltaTime = 1 / 60;
        }
        
        lastTimestamp = timestamp;
        const dt = Math.min(deltaTime, GAME_CONFIG.MAX_DELTA_TIME);
        
        frameCount++;
        
        // Debug: Log game state and enemy count every 300 frames
        if (frameCount % 300 === 0) {
            console.log(`Game state: ${gameState}, Enemies: ${window.enemies.length}`);
        }
        
        playerSlowFactor = 1.0; // Reset slow factor each frame
        
        // Handle different game states
        try {
            // Always update background
            BackgroundSystem.update(dt);
            
            if (gameState === 'start' || gameState === 'gameOver') {
                // Minimal updates for menu screens
                RenderSystem.render(ctx);
                animationFrameId = requestAnimationFrame(gameLoop);
                return;
            }
            
            if (gameState === 'playing') {
                // Make sure player and powerUps exist and have all needed properties
                if (!player || !player.powerUps) {
                    console.warn("Player or powerUps not properly initialized");
                    player = PlayerSystem.createPlayer();
                    window.player = player;
                }
                
                // Update powerups first to apply effects
                const powerUpExpired = PlayerSystem.updatePowerUps(now);
                if (powerUpExpired) UIManager.updatePowerUpIndicators();

                if (frameCount % 10 === 0) UIManager.updatePowerUpIndicators();
                if (frameCount % 5 === 0 && player) UIManager.updateDashCooldown(); // Update dash cooldown indicator frequently

                // Add this line to update power-up timers even when not expired
                if (frameCount % 10 === 0) UIManager.updatePowerUpIndicators(); // Update timers frequently
                
                // Update entities
                EnemySystem.updateEnemies(dt, now);
                PlayerSystem.updatePlayer(dt);
                PoolManager.updatePool('projectiles', dt);
                PoolManager.updatePool('enemyProjectiles', dt);
                PowerUpSystem.updatePowerUps(dt);
                PoolManager.updatePool('particles', dt);
                PoolManager.updatePool('fragments', dt);
                
                // Update multiplier
                PlayerSystem.updateMultiplier(dt, now);
                
                // Check collisions
                CollisionSystem.checkCollisions();
                
                // Check if level is complete using the global enemy array
                if (window.enemies.length === 0) {
                    console.log("No enemies detected, verifying level completion...");
                    
                    // Force-rebuild the enemies array from any remaining active enemies
                    const remainingEnemies = [];
                    
                    // Scan for any bosses that might have been incorrectly deactivated
                    for (let i = 0; i < window.enemies.length; i++) {
                        const enemy = window.enemies[i];
                        if (enemy && (enemy.type.name === "The Creditor" || enemy.radius >= 40)) {
                            // Forcefully reactivate any boss
                            enemy.active = true;
                            remainingEnemies.push(enemy);
                            console.log("Found boss that should remain active:", enemy.type.name);
                        }
                    }
                    
                    if (remainingEnemies.length > 0) {
                        // Restore enemies we found
                        window.enemies = remainingEnemies;
                        enemies = remainingEnemies;
                        console.log("Corrected enemies array - restored " + remainingEnemies.length + " bosses");
                    } else {
                        // Truly no enemies left
                        console.log("Level complete confirmed - all enemies defeated");
                        gameState = 'levelComplete';
                        levelCompleteTime = now;
                    }
                }
                
                // Update UI periodically
                if (frameCount % 30 === 0) {
                    UIManager.updateGameInfo();
                }
            } else if (gameState === 'levelComplete') {
                // Update entities during level transition
                PlayerSystem.updatePlayer(dt);
                PoolManager.updatePool('projectiles', dt);
                PoolManager.updatePool('enemyProjectiles', dt);
                PowerUpSystem.updatePowerUps(dt);
                PoolManager.updatePool('particles', dt);
                PoolManager.updatePool('fragments', dt);
                PlayerSystem.updateMultiplier(dt, now);
                CollisionSystem.checkCollisions();
                
                // Wait for transition delay
                const timeElapsed = now - levelCompleteTime;
                if (timeElapsed > GAME_CONFIG.LEVEL_TRANSITION_DELAY) {
                    nextLevel();
                    UIManager.updateGameInfo();
                    UIManager.updatePowerUpIndicators();
                    gameState = 'playing';
                }
            }
            
            // Check for firing weapons
            PlayerSystem.fireIfNeeded(now);
            
        } catch (error) {
            console.error("ERROR in game loop update:", error);
            gameOver();
            animationFrameId = requestAnimationFrame(gameLoop);
            return;
        }
        
        // Render game
        try {
            RenderSystem.render(ctx);
        } catch (error) {
            console.error("ERROR in rendering:", error);
            gameOver();
            animationFrameId = requestAnimationFrame(gameLoop);
            return;
        }
        
        // Continue game loop
        animationFrameId = requestAnimationFrame(gameLoop);
    }
    
    // Make game entities accessible to other modules
    function getEnemies() {
        return enemies;
    }
    
    function getPowerUps() {
        return powerUps;
    }
    
    function setPowerUps(newPowerUps) {
        powerUps = newPowerUps;
        window.powerUps = powerUps;
    }
    
    // Public API
    return {
        initialize,
        startGame,
        pauseGame,
        resumeGame,
        gameOver,
        returnToMainMenu,
        triggerBomb,
        getEnemies,
        getPowerUps,
        setPowerUps,
        get canvas() { return canvas; },
        get ctx() { return ctx; },
        get gameState() { return gameState; },
        get isPaused() { return isPaused; },
        get level() { return level; },
        get playerName() { return playerName; },
        get frameCount() { return frameCount; },
        get borderPathPoints() { return borderPathPoints; },
        get playerSlowFactor() { return playerSlowFactor; },
        set playerSlowFactor(value) { playerSlowFactor = value; }
    };
})();

// Create a PowerUpSystem to manage powerups
const PowerUpSystem = (() => {
    function updatePowerUps(dt) {
        const powerUps = GameManager.getPowerUps();
        const updatedPowerUps = [];
        
        if (!powerUps) return;
        
        for (let i = 0; i < powerUps.length; i++) {
            if (powerUps[i] && powerUps[i].update && powerUps[i].update(dt)) {
                updatedPowerUps.push(powerUps[i]);
            }
        }
        
        GameManager.setPowerUps(updatedPowerUps);
    }
    
    return {
        updatePowerUps
    };
})();

// Initialize game when DOM is loaded
window.addEventListener('DOMContentLoaded', () => {
    try {
        console.log("DOM loaded, initializing game...");
        
        // Create global references needed by other modules
        window.enemies = [];
        window.powerUps = [];
        
        GameManager.initialize();
    } catch (error) {
        console.error("Critical error during initialization:", error);
        document.body.innerHTML = '<div style="color: red; padding: 20px; text-align: center;">Critical Error during game initialization: ' + error.message + '</div>';
    }
});

window.addEventListener('DOMContentLoaded', () => {
    AudioManager.loadSounds(); // Load game sounds
    GameManager.initialize();
  });

  window.addEventListener('DOMContentLoaded', () => {
    AudioManager.loadSounds();
    
    // Delay music until first interaction (helps with autoplay restrictions)
//    document.body.addEventListener('click', () => {
//      AudioManager.playMusic();
 //   }, { once: true });
  
    GameManager.initialize();
  });

  const musicButton = document.getElementById('toggleMusicBtn');

  // Initial icon and state (starts OFF)
  musicButton.textContent = '🔇';
  musicButton.classList.remove('active');
  
  musicButton.addEventListener('click', () => {
    const isNowPlaying = musicButton.classList.toggle('active');
  
    if (isNowPlaying) {
      AudioManager.playMusic();
      musicButton.textContent = 'Music On 🎵';
    } else {
      AudioManager.pauseMusic();
      musicButton.textContent = 'Music Off 🔇';
    }
  });
  