/**
 * Collision System
 * Handles collision detection and response
 */
const CollisionSystem = (() => {
    // Check for all game collisions
    function checkCollisions() {
        const now = Date.now();
        const canvas = window.canvas;
        
        // Skip collision detection if player is invulnerable
        if (!window.player.invulnerable) {
            let tookDamage = false;
            
            // Check collisions with enemies
            window.enemies.forEach(enemy => {
                if (!enemy.active) return;
                
                if (circleCollision(window.player, enemy)) {
                    window.player.health -= enemy.damage;
                    tookDamage = true;
                    AudioManager.playSound('hit'); // ✅ Add this line
                    
                    createParticles(window.player.x, window.player.y, "#ffffff", 10, 3, 3);
                    
                    // Apply knockback
                    const angle = Math.atan2(window.player.y - enemy.y, window.player.x - enemy.x);
                    const knockback = 20;
                    
                    window.player.x += Math.cos(angle) * knockback;
                    window.player.y += Math.sin(angle) * knockback;
                    
                    // Keep player within bounds
                    window.player.x = Math.max(window.player.radius, Math.min(canvas.width - window.player.radius, window.player.x));
                    window.player.y = Math.max(window.player.radius, Math.min(canvas.height - window.player.radius, window.player.y));
                }
            });
            
            // Check collisions with enemy projectiles
            PoolManager.getActive('enemyProjectiles').forEach(proj => {
                if (!proj.active) return;
                
                if (circleCollision(window.player, proj)) {
                    window.player.health -= proj.damage;
                    tookDamage = true;
                    
                    createParticles(window.player.x, window.player.y, "#ffffff", 8, 2.5, 2.5);
                    PoolManager.release(proj);
                }
            });
            
            // Handle player damage
            if (tookDamage) {
                GameScreen.showDamageFlash();
                window.player.invulnerable = true;
                window.player.invulnerableTime = now + GAME_CONFIG.INVULNERABILITY_DURATION;
                window.player.multiplier = 1.0;
                
                UIManager.updateMultiplierDisplay();
                UIManager.updateHealthDisplay();
                
                if (window.player.health <= 0) {
                    GameManager.gameOver();
                    return;
                }
            }
        }
        
        // Skip remaining collision checks if game is over
        if (GameManager.gameState === 'gameOver') return;
        
        // Check player projectiles against enemies
        const projectiles = PoolManager.getActive('projectiles');
        
        // Console log for debug
        if (projectiles.length > 0 && window.enemies.length > 0) {
        //    console.log(`Active projectiles: ${projectiles.length}, Active enemies: ${window.enemies.length}`);
        }
        
        projectiles.forEach(proj => {
            if (!proj.active) return;
            
            for (let j = 0; j < window.enemies.length; j++) {
                const enemy = window.enemies[j];
                if (!enemy.active) continue;
                
                if (circleCollision(proj, enemy)) {
                //    console.log(`Hit enemy! Type: ${enemy.type.name}`);
                    
                    // Skip if this piercing projectile already hit this enemy
                    if (proj.piercing && proj.hitEnemies && proj.hitEnemies.includes(enemy)) {
                        continue;
                    }
                    
                    let damageApplied = false;
                    let enemyDestroyed = false;
                    
                    // Handle enemy shield if present
                    if (enemy.shieldActive) {
                        enemy.shieldHealth -= proj.damage;
                        damageApplied = true;
                        
                        if (enemy.shieldHealth <= 0) {
                            enemy.shieldActive = false;
                            createParticles(enemy.x, enemy.y, enemy.type.shieldColor || "#7f8c8d", 15, 3, 3);
                        }
                    } else {
                        // Apply damage directly to enemy
                        enemy.health -= proj.damage;
                        damageApplied = true;
                        enemy.wasHit = true;
                        enemy.hitTime = now;
                        
                    //    console.log(`Enemy health: ${enemy.health}/${enemy.maxHealth}`);
                        
                        if (enemy.health <= 0) {
                            enemyDestroyed = true;
                    //        console.log(`Enemy destroyed: ${enemy.type.name}`);
                        }
                    }
                    
                    if (damageApplied) {
                        // Create impact effect
                        createParticles(proj.x, proj.y, "#ffffff", 4, 1.5, 2);
                        
                        // Handle piercing projectiles
                        if (proj.piercing) {
                            if (!proj.hitEnemies) proj.hitEnemies = [];
                            proj.hitEnemies.push(enemy);
                        } else {
                            PoolManager.release(proj);
                        }
                        
                        // Handle enemy destruction
                        if (enemyDestroyed) {
                            // Award score
                            const scoreGain = Math.floor(enemy.value * 10 * window.player.multiplier);
                            window.player.score += scoreGain;
                            UIManager.updateGameInfo();
                            
                            // Handle special enemy explosion effect
                            if (enemy.special === 'explodeBurst') {
                                handleBankruptcyAgentDeath(enemy);
                            } else {
                                // Standard death effect
                                createParticles(enemy.x, enemy.y, enemy.color, 15, 2.5, 3);
                            }
                            
                            // Spawn fragments for score multiplier
                            LevelManager.spawnFragments(enemy.x, enemy.y, enemy.fragmentCount);
                            
                            // Chance to spawn powerup
                            if (Math.random() < 0.2) {
                                const powerUp = PowerUp.spawn(enemy.x, enemy.y);
                                window.powerUps.push(powerUp);
                            }
                            
                            // Mark enemy as inactive
                            enemy.active = false;
                        }
                    }
                    
                    // Break loop if projectile was consumed
                    if (!proj.active) break;
                }
            }
        });
        
        // Remove destroyed enemies - CRITICAL FIX
        if (window.enemies.some(e => !e.active)) {
        //    console.log("Removing inactive enemies");
            window.enemies = window.enemies.filter(e => e.active);
        }
        
        // Skip powerup and fragment collection if game is over
        if (GameManager.gameState === 'gameOver') return;
        
        // Check for powerup collection
        const powerUps = GameManager.getPowerUps();
        const updatedPowerUps = [];
        
        for (let i = 0; i < powerUps.length; i++) {
            const powerUp = powerUps[i];
            
            if (circleCollision(window.player, powerUp)) {
                powerUp.activate();
                // Don't add to updated list - it's been collected
            } else {
                updatedPowerUps.push(powerUp);
            }
        }
        
        GameManager.setPowerUps(updatedPowerUps);
        
        // Check for fragment collection
        PoolManager.getActive('fragments').forEach(frag => {
            if (!frag.active) return;
            
            if (circleCollision(window.player, frag)) {
                // Increase multiplier
                window.player.multiplier = Math.min(GAME_CONFIG.MAX_MULTIPLIER, window.player.multiplier + frag.value);
                window.player.lastFragmentCollectionTime = now;
                
                UIManager.updateMultiplierDisplay();
                
                
                // Create collection effect
                createParticles(frag.x, frag.y, frag.color, 3, 1, 1.5);

                AudioManager.playSound('fragmentCollect', 0.1);
                
                // Return to pool
                PoolManager.release(frag);
            }
        });
    }
    
    // Handle Bankruptcy Agent death explosion
    function handleBankruptcyAgentDeath(enemy) {
        createParticles(enemy.x, enemy.y, "#e74c3c", 35, 4.5, 5.5);
        
        // Check if player is caught in explosion
        if (!window.player.invulnerable) {
            const distSqToPlayer = (window.player.x - enemy.x)**2 + (window.player.y - enemy.y)**2;
            
            if (distSqToPlayer < (enemy.type.explosionRadius || 70)**2) {
                // Damage player
                window.player.health -= enemy.type.explosionDamage || 2;
                
                GameScreen.showDamageFlash();
                window.player.invulnerable = true;
                window.player.invulnerableTime = Date.now() + GAME_CONFIG.INVULNERABILITY_DURATION;
                window.player.multiplier = 1.0;
                
                UIManager.updateMultiplierDisplay();
                UIManager.updateHealthDisplay();
                
                if (window.player.health <= 0) {
                    GameManager.gameOver();
                    return;
                }
            }
        }
        
        // Create burst of projectiles
        const burstCount = enemy.type.explosionBurstCount || 8;
        const angleIncrement = (Math.PI * 2) / burstCount;
        
        for (let i = 0; i < burstCount; i++) {
            const angle = i * angleIncrement;
            const burstProj = PoolManager.get('enemyProjectiles');
            
            if (burstProj) {
                burstProj.spawn(
                    enemy.x,
                    enemy.y,
                    4,
                    GAME_CONFIG.ENEMY_PROJECTILE_COLOR,
                    { x: Math.cos(angle), y: Math.sin(angle) },
                    enemy.type.explosionBurstSpeed || 5,
                    enemy.damage,
                    false
                );
            }
        }
    }
    
    // Public API
    return {
        checkCollisions
    };
})();