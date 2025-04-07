/**
 * Level Manager
 * Handles level generation and progression
 */
const LevelManager = (() => {
    // Generate a level based on level number
    function generateLevel(level) {
        console.log(`Generating level ${level}...`);
        
        // Calculate number of enemies to spawn
        const baseEnemyCount = 5;
        const enemyIncreasePerLevel = level < 10 
        ? 1.2                    // Gentler increase in early levels
        : 1.5 + (level * 0.1);   // Steeper increase in later levels
        const maxEnemies = GAME_CONFIG.MAX_TOTAL_ENEMIES;
        const MAX_LOAN_SHARKS_PER_LEVEL = 2;
        const MAX_BANKRUPTCY_AGENTS_PER_LEVEL = 3;
        
        const bossLevel = level % 5 === 0;
        const enemyCount = Math.min(
            maxEnemies, 
            Math.ceil(baseEnemyCount + (level * enemyIncreasePerLevel)) // More precise calculation
        );
        let enemiesToSpawn = bossLevel ? Math.max(1, enemyCount - 1) : enemyCount;
        
        console.log(`Target enemies: ${enemiesToSpawn} (Level: ${level})`);
        
        // Clear existing enemies
        window.enemies = [];
        
        // Keep track of special enemy types
        let loanSharkCount = 0;
        let bankruptcyAgentCount = 0;
        
        // New enemy distribution logic
        const enemyTypeDistribution = {
            1: { 
                debtCollector: 0.7, 
                debtSniper: 0.3 
            },
            3: { 
                debtCollector: 0.4, 
                interestCompounder: 0.3, 
                debtSniper: 0.2,
                loanShark: 0.1 
            },
            6: { 
                debtCollector: 0.2, 
                interestCompounder: 0.2, 
                loanShark: 0.2,
                bankruptcyAgent: 0.1,
                assetSeizer: 0.1,
                hedgeFund: 0.1,
                debtSniper: 0.1 
            },
            10: { 
                debtCollector: 0.1, 
                interestCompounder: 0.1, 
                loanShark: 0.2,
                bankruptcyAgent: 0.15,
                assetSeizer: 0.15,
                hedgeFund: 0.15,
                debtSniper: 0.15 
            }
        };

        // Function to get enemy distribution for a given level
        function getEnemyDistribution(currentLevel) {
            for (let thresholdLevel of Object.keys(enemyTypeDistribution).reverse()) {
                if (currentLevel >= parseInt(thresholdLevel)) {
                    return enemyTypeDistribution[thresholdLevel];
                }
            }
            return enemyTypeDistribution[1]; // Default to first level distribution
        }

        // Spawn regular enemies
        for (let i = 0; i < enemiesToSpawn; i++) {
            const distribution = getEnemyDistribution(level);
            const randomValue = Math.random();
            let cumulativeProbability = 0;
            let selectedEnemyType = null;

            for (const [enemyKey, probability] of Object.entries(distribution)) {
                cumulativeProbability += probability;
                if (randomValue <= cumulativeProbability) {
                    selectedEnemyType = ENEMY_TYPES[enemyKey];
                    break;
                }
            }

            // Fallback to debt collector if no type selected
            selectedEnemyType = selectedEnemyType || ENEMY_TYPES.debtCollector;

            // Enforce maximums for special enemy types
            if (selectedEnemyType === ENEMY_TYPES.loanShark) {
                if (loanSharkCount >= MAX_LOAN_SHARKS_PER_LEVEL) {
                    selectedEnemyType = ENEMY_TYPES.debtCollector;
                } else {
                    loanSharkCount++;
                }
            } else if (selectedEnemyType === ENEMY_TYPES.bankruptcyAgent) {
                if (bankruptcyAgentCount >= MAX_BANKRUPTCY_AGENTS_PER_LEVEL) {
                    selectedEnemyType = ENEMY_TYPES.debtCollector;
                } else {
                    bankruptcyAgentCount++;
                }
            }

            // Find safe position to spawn enemy
            let pos = findSafeSpawnPosition(150);
            
            if (pos && selectedEnemyType) {
                // Spawn the enemy
                EnemySystem.spawnEnemy(pos.x, pos.y, selectedEnemyType);
            } else {
                console.warn("Could not find safe spawn or valid enemy type for random enemy slot.");
            }
        }
        
        // Handle boss spawning for milestone levels
        if (level % 5 === 0) {
            // Determine number of bosses to spawn: one additional boss per 5 levels
            let bossCount = Math.floor(level / 5);
            
            // A horizontal margin from the edges so bosses appear at opposite sides
            const margin = 60;
            
            // Calculate vertical spacing for multiple bosses
            const verticalSegments = bossCount + 1; // +1 to create spacing between bosses
            
            for (let i = 0; i < bossCount; i++) {
                // Position bosses strategically
                let pos = { x: 0, y: 0 };
                
                if (bossCount === 1) {
                    // Spawn away from the player for single boss (keep original logic)
                    const playerX = window.player.x;
                    const playerY = window.player.y;
                    const canvasWidth = window.canvas.width;
                    const canvasHeight = window.canvas.height;
                    
                    // Determine opposite quadrant
                    if (playerX < canvasWidth / 2) {
                        pos.x = canvasWidth - margin;
                    } else {
                        pos.x = margin;
                    }
                    
                    if (playerY < canvasHeight / 2) {
                        pos.y = canvasHeight - margin;
                    } else {
                        pos.y = margin;
                    }
                } else {
                    // For multiple bosses, distribute them along the edges
                    // Alternate between left and right sides
                    pos.x = (i % 2 === 0) ? margin : window.canvas.width - margin;
                    
                    // Calculate a specific Y position for each boss to prevent stacking
                    // Evenly distribute bosses vertically with spacing
                    const verticalSegmentSize = window.canvas.height / verticalSegments;
                    pos.y = verticalSegmentSize * (i + 1); // Skip the first segment for spacing
                    
                    // Add small random offset for less predictable positioning
                    pos.y += (Math.random() - 0.5) * 40;
                    
                    // Ensure bosses stay within safe bounds
                    pos.y = Math.max(margin, Math.min(window.canvas.height - margin, pos.y));
                }
                
                console.log(`Spawning boss ${i+1}/${bossCount} at position:`, pos.x, pos.y);
                EnemySystem.spawnEnemy(pos.x, pos.y, ENEMY_TYPES.bossCreditor);
            }
        }
        
        console.log(`Level ${level} generation complete. Actual enemies: ${window.enemies.length}`);
    }
    
    // Find a safe position to spawn an enemy (away from player)
    function findSafeSpawnPosition(minDistance, preferOpposite = false) {
        let spawnX, spawnY, attempts = 0;
        const maxAttempts = 50;
        const canvas = window.canvas;
        
        while (attempts < maxAttempts) {
            attempts++;
            
            if (preferOpposite && attempts < maxAttempts / 2) {
                // Try to spawn opposite to player relative to center of screen
                const angleToPlayer = Math.atan2(window.player.y - canvas.height / 2, window.player.x - canvas.width / 2);
                const oppositeAngle = angleToPlayer + Math.PI;
                const spawnDist = canvas.width * 0.4;
                
                spawnX = canvas.width / 2 + Math.cos(oppositeAngle) * spawnDist;
                spawnY = canvas.height / 2 + Math.sin(oppositeAngle) * spawnDist;
            } else {
                // Spawn along screen edges
                spawnX = Math.random() * canvas.width;
                spawnY = Math.random() * canvas.height;
                
                if (Math.random() < 0.5) {
                    spawnX = Math.random() < 0.5 ? 0 - 50 : canvas.width + 50;
                } else {
                    spawnY = Math.random() < 0.5 ? 0 - 50 : canvas.height + 50;
                }
            }
            
            // Ensure spawn position is within allowed range
            spawnX = Math.max(-100, Math.min(canvas.width + 100, spawnX));
            spawnY = Math.max(-100, Math.min(canvas.height + 100, spawnY));
            
            // Check distance to player
            const distToPlayer = Math.hypot(spawnX - window.player.x, spawnY - window.player.y);
            
            if (distToPlayer > minDistance) {
                return { x: spawnX, y: spawnY };
            }
        }
        
        console.warn(`Failed to find safe spawn after ${maxAttempts} attempts.`);
        
        // Fallback spawn position
        return { 
            x: Math.random() < 0.5 ? 0 : window.canvas.width, 
            y: Math.random() * window.canvas.height 
        };
    }
    
    // Spawn fragments from destroyed enemies
    function spawnFragments(x, y, count) {
        for (let i = 0; i < count; i++) {
            const frag = PoolManager.get('fragments');
            if (frag) {
                const offsetX = (Math.random() - 0.5) * 10;
                const offsetY = (Math.random() - 0.5) * 10;
                frag.spawn(x + offsetX, y + offsetY);
            } else {
                break; // Pool is exhausted
            }
        }
    }
    
    // Public API
    return {
        generateLevel,
        findSafeSpawnPosition,
        spawnFragments
    };
})();