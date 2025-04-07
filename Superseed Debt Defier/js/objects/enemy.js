/**
 * Enemy System
 * Manages enemy entities and their behavior
 */
const EnemySystem = (() => {
    // Spawn a new enemy
    function spawnEnemy(x, y, enemyType) {
        if (!enemyType) {
            console.error("Attempted to spawn enemy with undefined type!");
            return;
        }
        
        const canvas = window.canvas;
        
        const enemy = {
            type: enemyType,
            x: x,
            y: y,
            radius: enemyType.radius,
            speed: enemyType.speed,
            health: enemyType.health,
            maxHealth: enemyType.health,
            damage: enemyType.damage,
            color: enemyType.color,
            value: enemyType.value,
            special: enemyType.special,
            lastSpecial: 0,
            lastShot: 0,
            initialSpawn: true,
            direction: { x: 0, y: 0 },
            wasHit: false,
            hitTime: 0,
            _colorRgb: null,
            lastRepositionTime: 0,
            isAttacking: false,
            attackWave: 0,
            lastAttackWaveTime: 0,
            isSlowing: false,
            slowEndTime: 0,
            isChargingSlow: false,
            slowChargeStartTime: 0,
            isLunging: false,
            lungeEndTime: 0,
            isTelegraphingLunge: false,
            lungeTelegraphEndTime: 0,
            lastLungeTime: 0,
            lungeDirection: { x: 0, y: 0 },
            fragmentCount: enemyType.fragmentCount || 1,
            offspringCount: 0,
            lastSpecial: Date.now() + (Math.random() * 3000),
            isBoss: enemyType.isBoss || false,
            active: true
        };
        
        // Keep enemy within canvas bounds
        enemy.x = Math.max(enemy.radius, Math.min(canvas.width - enemy.radius, enemy.x));
        enemy.y = Math.max(enemy.radius, Math.min(canvas.height - enemy.radius, enemy.y));
        
        // Parse color for hit effect
        if (enemy.color && enemy.color.startsWith('#')) {
            const hex = enemy.color.substring(1);
            try {
                if (hex.length === 6) {
                    enemy._colorRgb = {
                        r: parseInt(hex.substring(0, 2), 16),
                        g: parseInt(hex.substring(2, 4), 16),
                        b: parseInt(hex.substring(4, 6), 16)
                    };
                } else if (hex.length === 3) {
                    enemy._colorRgb = {
                        r: parseInt(hex[0] + hex[0], 16),
                        g: parseInt(hex[1] + hex[1], 16),
                        b: parseInt(hex[2] + hex[2], 16)
                    };
                }
            } catch (e) {
                console.error("Error parsing enemy color hex:", enemy.color, e);
                enemy._colorRgb = null;
            }
        }
        
        // Setup shield if needed
        if (enemyType.special === "shield") {
            enemy.shieldActive = true;
            enemy.shieldHealth = enemyType.shieldHealth;
        }
        
        window.enemies.push(enemy);
        return enemy;
    }
    
    // Update all enemies
    function updateEnemies(dt, timestamp) {
        const canvas = window.canvas;
        
        window.enemies.forEach(enemy => {
            if (!enemy.active) return;
            
            // Initialize on first update
            if (enemy.initialSpawn) {
                if (enemy.type.special === "shoot" || enemy.type.special === "rangedShoot") {
                    enemy.lastShot = timestamp + 1500; // Delay first shot
                } else if (enemy.type.special === "multishoot") {
                    enemy.lastShot = timestamp + 1000; // Delay first shot
                }
                enemy.initialSpawn = false;
            }
            
            // Calculate distance to player
            const dx = window.player.x - enemy.x;
            const dy = window.player.y - enemy.y;
            const distance = Math.hypot(dx, dy);
            
            let moveX = 0;
            let moveY = 0;
            let currentSpeedMultiplier = 1.0;
            
            // Handle special abilities
            if (enemy.special === 'lunge') {
                handleLungeLogic(enemy, dx, dy, distance, dt, timestamp);
            } else if (enemy.special === 'slowField') {
                handleSlowFieldLogic(enemy, distance, dt, timestamp);
            } else if (enemy.special === 'multishoot') {
                handleMultishootLogic(enemy, dx, dy, dt, timestamp);
            } else if (enemy.special === 'nullify') {
                handleNullifyLogic(enemy, distance, timestamp);
            } else if (enemy.special === 'rangedShoot') {
                handleRangedShootLogic(enemy, timestamp);
            }
            else if (enemy.special === 'multiply') {
                // Initialize offspring count if it doesn't exist
                if (enemy.offspringCount === undefined) {
                    enemy.offspringCount = 0;
                }
                
                // Handle Interest Compounder multiplication
                if (timestamp - enemy.lastSpecial > enemy.type.multiplyCooldown) {
                    console.log("Interest Compounder checking multiplication");
                    
                    // Only multiply if under max offspring and with the random chance
                    if (enemy.offspringCount < (enemy.type.maxOffspring || 2) && 
                        Math.random() < 0.2 && // Higher chance - 20% for testing
                        window.enemies.length < GAME_CONFIG.MAX_TOTAL_ENEMIES - 1) {
                        
                        // Calculate spawn position based on parent radius
                        const spawnDistance = enemy.radius * 3; // Increased distance
                        const spawnAngle = Math.random() * Math.PI * 2; // Random angle
                        const spawnX = enemy.x + Math.cos(spawnAngle) * spawnDistance;
                        const spawnY = enemy.y + Math.sin(spawnAngle) * spawnDistance;
                        
                        // Instead of modifying the enemy type, use a simpler approach
                        // Create a brand new enemy using the original ENEMY_TYPES definition
                        const offspringEnemy = EnemySystem.spawnEnemy(
                            spawnX,
                            spawnY,
                            {
                                name: "Interest Compounder Offspring", // More descriptive name
                                radius: 10, // Hardcoded value
                                speed: 3.2,
                                health: 15, // Hardcoded value
                                damage: 1,
                                color: enemy.color,
                                value: 5,
                                special: "",
                                aggressionFactor: 0.85,
                                fragmentCount: 2,
                                isBoss: false
                            }
                        );
                        
                        // Only proceed if offspring was created
                        if (offspringEnemy) {
                            // Increment offspring count
                            enemy.offspringCount++;
                            
                            // Increase cooldown
                            enemy.lastSpecial = timestamp;
                            
                            // Visual feedback - more particles for visibility
                            createParticles(enemy.x, enemy.y, enemy.color, 20, 3, 3);
                            createParticles(spawnX, spawnY, enemy.color, 15, 2, 2);
                            
                            console.log(`Interest Compounder successfully multiplied! New enemy at (${spawnX}, ${spawnY})`);
                        } else {
                            console.error("Failed to spawn offspring enemy");
                        }
                    } else {
                        // Reset cooldown even if didn't multiply
                        enemy.lastSpecial = timestamp + Math.random() * 2000;
                        
                        if (enemy.offspringCount >= (enemy.type.maxOffspring || 2)) {
                            console.log("Interest Compounder reached max offspring");
                        } else if (window.enemies.length >= GAME_CONFIG.MAX_TOTAL_ENEMIES - 1) {
                            console.log("Too many enemies to multiply");
                        } else {
                            console.log("Interest Compounder didn't multiply (failed random check)");
                        }
                    }
                }
                
                // Visual effect when about to multiply
                const timeUntilNextMultiply = enemy.type.multiplyCooldown - (timestamp - enemy.lastSpecial);
                if (timeUntilNextMultiply < 1000 && enemy.offspringCount < (enemy.type.maxOffspring || 2)) {
                    // Visual pulsing effect when about to multiply
                    if (GameManager.frameCount % 10 === 0) {
                        createParticles(enemy.x, enemy.y, enemy.color, 2, 1, 1);
                    }
                }
            }
            // Movement logic
            if (currentSpeedMultiplier > 0) {
                if (enemy.type.special === 'shoot' || enemy.type.special === 'rangedShoot') {
                    // Ranged enemy movement - try to stay at optimal range
                    const fleeDist = enemy.type.fleeDistance || 100;
                    const minDist = enemy.type.minDistance || 150;
                    const maxDist = enemy.type.maxDistance || 250;
                    const repositionCD = enemy.type.repositionCooldown || 3000;
                    
                    if (distance > 0) {
                        if (distance < fleeDist) {
                            // Too close, move away
                            moveX = -dx / distance * enemy.speed * GAME_CONFIG.BASE_SPEED_MULTIPLIER * dt;
                            moveY = -dy / distance * enemy.speed * GAME_CONFIG.BASE_SPEED_MULTIPLIER * dt;
                        } else if (distance > maxDist && distance > minDist) {
                            // Too far, move closer
                            moveX = dx / distance * enemy.speed * GAME_CONFIG.BASE_SPEED_MULTIPLIER * dt * 0.8;
                            moveY = dy / distance * enemy.speed * GAME_CONFIG.BASE_SPEED_MULTIPLIER * dt * 0.8;
                        } else if (distance >= minDist) {
                            // In good range, maybe reposition
                            if (timestamp - enemy.lastRepositionTime > repositionCD) {
                                const angle = Math.random() * Math.PI * 2;
                                const repositionDist = 50 + Math.random() * 50;
                                enemy.repositionTarget = {
                                    x: enemy.x + Math.cos(angle) * repositionDist,
                                    y: enemy.y + Math.sin(angle) * repositionDist
                                };
                                enemy.lastRepositionTime = timestamp;
                            }
                            
                            if (enemy.repositionTarget) {
                                const rdx = enemy.repositionTarget.x - enemy.x;
                                const rdy = enemy.repositionTarget.y - enemy.y;
                                const rDist = Math.hypot(rdx, rdy);
                                
                                if (rDist > enemy.speed * GAME_CONFIG.BASE_SPEED_MULTIPLIER * dt) {
                                    moveX = rdx / rDist * enemy.speed * GAME_CONFIG.BASE_SPEED_MULTIPLIER * dt * 0.6;
                                    moveY = rdy / rDist * enemy.speed * GAME_CONFIG.BASE_SPEED_MULTIPLIER * dt * 0.6;
                                } else {
                                    enemy.repositionTarget = null;
                                }
                            } else {
                                // Strafe to make a harder target
                                const perpX = -dy / distance;
                                const perpY = dx / distance;
                                const strafeDir = Math.sin(timestamp * 0.0005) > 0 ? 1 : -1;
                                
                                moveX = perpX * strafeDir * enemy.speed * GAME_CONFIG.BASE_SPEED_MULTIPLIER * dt * 0.5;
                                moveY = perpY * strafeDir * enemy.speed * GAME_CONFIG.BASE_SPEED_MULTIPLIER * dt * 0.5;
                            }
                        }
                    }
                } else {
                    // Standard enemy movement - move toward player
                    if (distance > 0) {
                        moveX = dx / distance * enemy.speed * GAME_CONFIG.BASE_SPEED_MULTIPLIER * dt;
                        moveY = dy / distance * enemy.speed * GAME_CONFIG.BASE_SPEED_MULTIPLIER * dt;
                    }
                }
            }
            
            // Apply movement
            enemy.x += moveX;
            enemy.y += moveY;
            
            // Keep enemy within canvas bounds
            enemy.x = Math.max(enemy.radius, Math.min(canvas.width - enemy.radius, enemy.x));
            enemy.y = Math.max(enemy.radius, Math.min(canvas.height - enemy.radius, enemy.y));
            
            // Handle shooting for standard shooters
            if (enemy.type.special === 'shoot') {
                if (timestamp - enemy.lastShot > enemy.type.fireRate) {
                    if (distance < (enemy.type.maxDistance || 250) * 1.2) {
                        enemyShoot(enemy);
                        enemy.lastShot = timestamp;
                    }
                }
            }
            
            // Handle hit animation timing
            if (enemy.wasHit && Date.now() - enemy.hitTime > GAME_CONFIG.ENEMY_HIT_ANIM_DURATION) {
                enemy.wasHit = false;
            }
        });
    }
    
    // Handle lunge special ability
    function handleLungeLogic(enemy, dx, dy, distance, dt, timestamp) {
        const lungeConfig = enemy.type;
        
        if (enemy.isLunging) {
            if (timestamp > enemy.lungeEndTime) {
                enemy.isLunging = false;
            } else {
                // Apply lunge movement
                const moveX = enemy.lungeDirection.x * enemy.speed * GAME_CONFIG.BASE_SPEED_MULTIPLIER * dt * lungeConfig.lungeSpeedMult;
                const moveY = enemy.lungeDirection.y * enemy.speed * GAME_CONFIG.BASE_SPEED_MULTIPLIER * dt * lungeConfig.lungeSpeedMult;
                
                enemy.x += moveX;
                enemy.y += moveY;
                return; // Skip normal movement
            }
        } else if (enemy.isTelegraphingLunge) {
            if (timestamp > enemy.lungeTelegraphEndTime) {
                // Telegraph finished, start lunge
                enemy.isLunging = true;
                enemy.lungeEndTime = timestamp + lungeConfig.lungeDuration;
                enemy.isTelegraphingLunge = false;
                
                // Calculate lunge direction
                const angleToPlayer = Math.atan2(dy, dx);
                enemy.lungeDirection = {
                    x: Math.cos(angleToPlayer),
                    y: Math.sin(angleToPlayer)
                };
                
                // Apply first lunge movement
                const moveX = enemy.lungeDirection.x * enemy.speed * GAME_CONFIG.BASE_SPEED_MULTIPLIER * dt * lungeConfig.lungeSpeedMult;
                const moveY = enemy.lungeDirection.y * enemy.speed * GAME_CONFIG.BASE_SPEED_MULTIPLIER * dt * lungeConfig.lungeSpeedMult;
                
                enemy.x += moveX;
                enemy.y += moveY;
                return; // Skip normal movement
            } else {
                return; // Skip normal movement during telegraph
            }
        } else if (distance < lungeConfig.lungeTriggerRange && timestamp - enemy.lastLungeTime > lungeConfig.lungeCooldown) {
            // Start telegraph animation
            enemy.isTelegraphingLunge = true;
            enemy.lungeTelegraphEndTime = timestamp + lungeConfig.lungeTelegraphDuration;
            enemy.lastLungeTime = timestamp;
            return; // Skip normal movement
        }
    }
    
    // Handle slow field special ability
    function handleSlowFieldLogic(enemy, distance, dt, timestamp) {
        const chargeDuration = enemy.type.slowChargeDuration || GAME_CONFIG.SLOW_CHARGE_DURATION;
        
        if (!enemy.isSlowing && !enemy.isChargingSlow && timestamp - enemy.lastSpecial > enemy.type.slowCooldown) {
            if (distance < enemy.type.activationRange) {
                // Start charging slow field
                enemy.isChargingSlow = true;
                enemy.slowChargeStartTime = timestamp;
                enemy.lastSpecial = timestamp;
                
                createParticles(enemy.x, enemy.y, enemy.color, 10, 1, 2);
            }
        } else if (enemy.isChargingSlow) {
            if (timestamp - enemy.slowChargeStartTime > chargeDuration) {
                // Charging complete, activate slow field
                enemy.isSlowing = true;
                enemy.slowEndTime = timestamp + enemy.type.slowDuration;
                enemy.isChargingSlow = false;
                
                createParticles(enemy.x, enemy.y, enemy.color, 25, 3, 5);
            }
        } else if (enemy.isSlowing) {
            if (timestamp > enemy.slowEndTime) {
                // Slow field expired
                enemy.isSlowing = false;
            } else {
                // Apply slow effect to player if in range
                if (distance < enemy.type.slowRadius) {
                    GameManager.playerSlowFactor = Math.min(GameManager.playerSlowFactor, enemy.type.slowAmount);
                }
                
                // Create slow field particles occasionally
                if (GameManager.frameCount % 10 === 0) {
                    createParticles(enemy.x, enemy.y, enemy.color, 1, 1, enemy.type.slowRadius * 0.1);
                }
            }
        }
    }
    
    // Handle multi-shoot special ability
    function handleMultishootLogic(enemy, dx, dy, dt, timestamp) {
        const fireRate = enemy.type.fireRate || 3000;
        const burstCount = enemy.type.burstCount || 8;
        const burstWaves = enemy.type.burstWaves || 3;
        const burstDelay = enemy.type.burstDelay || 150;
        
        // Start attack sequence
        if (!enemy.isAttacking && timestamp - enemy.lastShot > fireRate) {
            enemy.isAttacking = true;
            enemy.attackWave = 0;
            enemy.lastAttackWaveTime = timestamp - burstDelay; // Fire first wave immediately
            enemy.lastShot = timestamp;
        }
        
        // Handle attack waves
        if (enemy.isAttacking) {
            if (timestamp - enemy.lastAttackWaveTime >= burstDelay) {
                // Fire wave of projectiles
                const angleIncrement = (Math.PI * 2) / burstCount;
                const waveRotation = (enemy.attackWave * Math.PI / 8);
                const baseAngle = Math.atan2(dy, dx);
                
                for (let i = 0; i < burstCount; i++) {
                    const angle = baseAngle + waveRotation + angleIncrement * i;
                    const proj = PoolManager.get('enemyProjectiles');
                    
                    if (proj) {
                        proj.spawn(
                            enemy.x + Math.cos(angle) * enemy.radius,
                            enemy.y + Math.sin(angle) * enemy.radius,
                            5,
                            GAME_CONFIG.ENEMY_PROJECTILE_COLOR,
                            { x: Math.cos(angle), y: Math.sin(angle) },
                            enemy.type.projectileSpeed || 5.5,
                            enemy.damage,
                            false
                        );
                    } else {
                        console.warn(`Boss Wave ${enemy.attackWave + 1} Failed - Pool empty!`);
                        break;
                    }
                }
                
                // Visual effect
                createParticles(enemy.x, enemy.y, GAME_CONFIG.ENEMY_PROJECTILE_COLOR, 15, 3, 3);
                
                // Prepare for next wave
                enemy.attackWave++;
                enemy.lastAttackWaveTime = timestamp;
                
                // Check if all waves are done
                if (enemy.attackWave >= burstWaves) {
                    enemy.isAttacking = false;
                }
            }
        }
        
        // Boss can summon minions
        if (timestamp - enemy.lastSpecial > (enemy.type.summonCooldown || 5000) && window.enemies.length < GAME_CONFIG.MAX_TOTAL_ENEMIES * 0.8) {
            if (Math.random() < 0.5) {
                // Spawn a minion near the boss
                spawnEnemy(
                    enemy.x + (Math.random() * 80 - 40),
                    enemy.y + (Math.random() * 80 - 40),
                    ENEMY_TYPES.debtCollector
                );
                enemy.lastSpecial = timestamp;
            }
        }
    }
    
    // Handle nullify special ability
    function handleNullifyLogic(enemy, distance, timestamp) {
        if (timestamp - enemy.lastSpecial > (enemy.type.nullifyCooldown || 5000)) {
            if (distance < (enemy.type.nullifyRange || 120)) {
                const now = Date.now();
                
                // Find active powerups
                const activePowerUpKeys = Object.keys(window.player.powerUps).filter(key => 
                    window.player.powerUps[key].active && window.player.powerUps[key].endTime > now
                );
                
                if (activePowerUpKeys.length > 0) {
                    // Choose a random powerup to nullify
                    const randomIndex = Math.floor(Math.random() * activePowerUpKeys.length);
                    const chosenPowerUpKey = activePowerUpKeys[randomIndex];
                    const powerUp = window.player.powerUps[chosenPowerUpKey];
                    
                    // Reduce time remaining
                    const nullifyAmount = enemy.type.nullifyDuration || 3000;
                    powerUp.endTime = Math.max(now, powerUp.endTime - nullifyAmount);
                    
                    // Visual effect
                    const angleToEnemy = Math.atan2(enemy.y - window.player.y, enemy.x - window.player.x);
                    createParticles(
                        window.player.x + Math.cos(angleToEnemy) * window.player.radius,
                        window.player.y + Math.sin(angleToEnemy) * window.player.radius,
                        "#ffffff", 10, 4, 2
                    );
                    
                    enemy.lastSpecial = timestamp;
                    UIManager.updatePowerUpIndicators();
                }
            }
        }
    }
    
    // Handle ranged shoot special ability
    function handleRangedShootLogic(enemy, timestamp) {
        if (timestamp - enemy.lastShot > enemy.type.fireRate) {
            // Calculate the base angle from enemy to player
            const baseAngle = Math.atan2(window.player.y - enemy.y, window.player.x - enemy.x);
            
            // Define a spread offset (15 degrees in radians)
            const spread = Math.PI / 12;
            
            // Fire three projectiles with angles: baseAngle - spread, baseAngle, baseAngle + spread
            for (let i = -1; i <= 1; i++) {
                const angle = baseAngle + i * spread;
                const proj = PoolManager.get('enemyProjectiles');
                
                if (proj) {
                    proj.spawn(
                        enemy.x + Math.cos(angle) * enemy.radius,
                        enemy.y + Math.sin(angle) * enemy.radius,
                        4,
                        enemy.type.projectileColor || GAME_CONFIG.ENEMY_PROJECTILE_COLOR,
                        { x: Math.cos(angle), y: Math.sin(angle) },
                        enemy.type.projectileSpeed || 5,
                        enemy.damage,
                        false
                    );
                }
            }
            
            // Visual effect for shooting
            createParticles(enemy.x, enemy.y, enemy.type.projectileColor || GAME_CONFIG.ENEMY_PROJECTILE_COLOR, 8, 2, 2);
            
            enemy.lastShot = timestamp;
        }
    }
    
    // Standard enemy shooting
    function enemyShoot(enemy) {
        const angle = Math.atan2(window.player.y - enemy.y, window.player.x - enemy.x);
        
        // Add some inaccuracy
        const inaccuracy = enemy.type.special === "shoot" ? 0.05 : 0.2;
        const adjustedAngle = angle + (Math.random() * inaccuracy * 2) - inaccuracy;
        
        const proj = PoolManager.get('enemyProjectiles');
        if (proj) {
            proj.spawn(
                enemy.x + Math.cos(adjustedAngle) * enemy.radius,
                enemy.y + Math.sin(adjustedAngle) * enemy.radius,
                4,
                GAME_CONFIG.ENEMY_PROJECTILE_COLOR,
                { x: Math.cos(adjustedAngle), y: Math.sin(adjustedAngle) },
                enemy.type.projectileSpeed || 5,
                enemy.damage,
                false
            );
        }
        
        // Visual effect
        createParticles(
            enemy.x + Math.cos(adjustedAngle) * enemy.radius,
            enemy.y + Math.sin(adjustedAngle) * enemy.radius,
            GAME_CONFIG.ENEMY_PROJECTILE_COLOR, 3, 1, 2
        );
    }
    
    // Public API
    return {
        spawnEnemy,
        updateEnemies,
        enemyShoot
    };
})();