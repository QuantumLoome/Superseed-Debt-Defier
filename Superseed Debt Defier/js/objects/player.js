/**
 * Player System
 * Manages the player entity and its functionality
 */
const PlayerSystem = (() => {
    // Create a new player entity
    function createPlayer() {
        const canvas = window.canvas;
        
        return {
            x: canvas.width / 2,
            y: canvas.height / 2,
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
            bombsRemaining: GAME_CONFIG.STARTING_BOMBS,
            lastBombTime: 0,
            lastHomingFired: 0,
            dashActive: false,
            dashTime: 0,
            lastDashTime: 0,
            dashDirection: { x: 0, y: 0 },
            debuffActive: false,
            debuffEndTime: 0,
            originalDamage: 10,
            originalSpeed: 4,
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
    
// Update player position and state
function updatePlayer(dt) {
    const canvas = window.canvas;
    
    const now = Date.now();
    if (player.debuffActive && now > player.debuffEndTime) {
        player.debuffActive = false;
        player.damage = player.originalDamage;
        player.speed = player.originalSpeed;
    }   

    const baseSpeed = player.speed * GAME_CONFIG.BASE_SPEED_MULTIPLIER;
    const boostedSpeed = (player.powerUps.speedBoost.active ? baseSpeed * 1.5 : baseSpeed);
    const currentSpeed = boostedSpeed * GameManager.playerSlowFactor;
    
    let moveX = 0;
    let moveY = 0;
    let aimAngle = Math.atan2(player.direction.y, player.direction.x);
    
    // Handle dash movement
if (player.dashActive) {
    // Store player position for after-image
    if (!player.afterImages) player.afterImages = [];
    
    if (player.afterImages.length < 5 && now % 50 < 16) { // Create after-image every 50ms
        player.afterImages.push({
            x: player.x,
            y: player.y,
            angle: aimAngle,
            alpha: 0.7,
            time: now
        });
    }
    
    if (now > player.dashTime) {
        player.dashActive = false;
        // Create afterimage particles at end of dash
        createParticles(player.x, player.y, "#3498db", 10, 2, 2);
    } else {
        // During dash, move faster in dash direction
        const dashProgress = (player.dashTime - now) / GAME_CONFIG.DASH_DURATION;
        const dashSpeed = GAME_CONFIG.DASH_DISTANCE / (GAME_CONFIG.DASH_DURATION / 1000) * dt;
        
        player.x += player.dashDirection.x * dashSpeed;
        player.y += player.dashDirection.y * dashSpeed;
    }
}
    
    // Only apply regular movement if not dashing
    if (!player.dashActive) {
        // Process joystick control
        if (InputManager.touchJoystick.active) {
            moveX = InputManager.touchJoystick.dx;
            moveY = InputManager.touchJoystick.dy;
            
            if (Math.hypot(InputManager.touchJoystick.dx, InputManager.touchJoystick.dy) > 0.1) {
                aimAngle = InputManager.touchJoystick.angle;
            }
            
            InputManager.touchJoystick.isActive = true;
            InputManager.mouse.isActive = false;
        }
        
        // Process keyboard control
        if (InputManager.keys['w'] || InputManager.keys['arrowup']) moveY = -1;
        if (InputManager.keys['s'] || InputManager.keys['arrowdown']) moveY = 1;
        if (InputManager.keys['a'] || InputManager.keys['arrowleft']) moveX = -1;
        if (InputManager.keys['d'] || InputManager.keys['arrowright']) moveX = 1;
        
        // Normalize diagonal movement
        const magnitude = Math.hypot(moveX, moveY);
        if (magnitude > 0) {
            player.x += (moveX / magnitude) * currentSpeed * dt;
            player.y += (moveY / magnitude) * currentSpeed * dt;
        }
    }
    
    // Process mouse aim - always update aim direction even when dashing
    if (InputManager.mouse.isActive) {
        aimAngle = Math.atan2(
            InputManager.mouse.y - player.y, 
            InputManager.mouse.x - player.x
        );
    }

    // Update after-images if they exist (fade them out)
if (player.afterImages && player.afterImages.length > 0) {
    for (let i = player.afterImages.length - 1; i >= 0; i--) {
        player.afterImages[i].alpha -= 0.02;
        if (player.afterImages[i].alpha <= 0 || now - player.afterImages[i].time > 300) {
            player.afterImages.splice(i, 1);
        }
    }
}
    
    // Keep player within canvas bounds
    player.x = Math.max(player.radius, Math.min(canvas.width - player.radius, player.x));
    player.y = Math.max(player.radius, Math.min(canvas.height - player.radius, player.y));
    
    // Update player aim direction
    player.direction.x = Math.cos(aimAngle);
    player.direction.y = Math.sin(aimAngle);
    
    // Reset input flags
    InputManager.mouse.isActive = false;
    InputManager.touchJoystick.isActive = false;
    
    // Check invulnerability state
    if (player.invulnerable && Date.now() > player.invulnerableTime) {
        player.invulnerable = false;
    }
}
// Add after updatePlayer but before fireIfNeeded
function triggerDash(timestamp) {
    if (player.dashActive || timestamp - player.lastDashTime < GAME_CONFIG.DASH_COOLDOWN) {
        return false; // Dash is already active or on cooldown
    }

    // Get current movement direction from input
    let dashX = 0;
    let dashY = 0;
    
    // Check keyboard inputs
    if (InputManager.keys['w'] || InputManager.keys['arrowup']) dashY = -1;
    if (InputManager.keys['s'] || InputManager.keys['arrowdown']) dashY = 1;
    if (InputManager.keys['a'] || InputManager.keys['arrowleft']) dashX = -1;
    if (InputManager.keys['d'] || InputManager.keys['arrowright']) dashX = 1;
    
    // Check joystick input if available
    if (InputManager.touchJoystick.active) {
        dashX = InputManager.touchJoystick.dx;
        dashY = InputManager.touchJoystick.dy;
    }
    
    // Normalize the dash direction
    const magnitude = Math.hypot(dashX, dashY);
    if (magnitude <= 0.1) {
        // If no movement input, use the aim direction as fallback
        dashX = player.direction.x;
        dashY = player.direction.y;
    } else {
        // Normalize to unit vector
        dashX = dashX / magnitude;
        dashY = dashY / magnitude;
    }
    
    // Set dash properties
    player.dashActive = true;
    player.dashTime = timestamp + GAME_CONFIG.DASH_DURATION;
    player.lastDashTime = timestamp;
    
    // Set dash direction based on movement
    player.dashDirection = {
        x: dashX,
        y: dashY
    };

    // Create after-images collection if it doesn't exist
    if (!player.afterImages) {
        player.afterImages = [];
    } else {
        // Clear existing after-images
        player.afterImages = [];
    }
    
    // Set player invulnerable during and shortly after dash
    player.invulnerable = true;
    player.invulnerableTime = timestamp + GAME_CONFIG.DASH_INVULNERABILITY;
    
    // Visual feedback - create particles behind player
    const particleCount = 15;
    createParticles(
        player.x - dashX * player.radius, 
        player.y - dashY * player.radius, 
        "#7BD0CF", particleCount, 3, 2
    );
    
    console.log("Player dashed in direction:", dashX, dashY);
    return true;
}
    
// Create projectiles
function fireProjectile(timestamp) {
    const angle = Math.atan2(player.direction.y, player.direction.x);
    const projectileX = player.x + player.direction.x * player.radius;
    const projectileY = player.y + player.direction.y * player.radius;
    const currentDamage = player.powerUps.doubleDamage.active ? player.damage * 2 : player.damage;
    const isPiercing = player.powerUps.piercingShot.active;
    const isSpread = player.powerUps.spreadShot.active;
    const isHomingActive = player.powerUps.homingMissile.active;
    AudioManager.playSound('shoot');
    
    // console.log("Firing projectile");
    
    if (isSpread) {
        // Create spread of 5 projectiles
        const spreadAngle = Math.PI / 8;
        const numShots = 5;
        
        for (let i = -(numShots - 1) / 2; i <= (numShots - 1) / 2; i++) {
            const shotAngle = angle + (spreadAngle * i);
            const proj = PoolManager.get('projectiles');
            
            if (proj) {
                proj.spawn(
                    projectileX, 
                    projectileY, 
                    5, 
                    player.powerUps.doubleDamage.active ? "#9b59b6" : "#7BD0CF", 
                    { x: Math.cos(shotAngle), y: Math.sin(shotAngle) }, 
                    player.projectileSpeed, 
                    currentDamage * 0.6, // Reduce damage for spread
                    isPiercing
                );
        //        console.log(`Spread projectile spawned, damage: ${currentDamage * 0.6}, active: ${proj.active}`);
            }
        }
        
        createParticles(projectileX, projectileY, "#7BD0CF", 5, 2, 2.5);
    } else {
        // Create single projectile
        const proj = PoolManager.get('projectiles');
        
        if (proj) {
            proj.spawn(
                projectileX, 
                projectileY, 
                isPiercing ? 6 : 5, 
                isPiercing ? "#e67e22" : (player.powerUps.doubleDamage.active ? "#9b59b6" : "#7BD0CF"), 
                { x: Math.cos(angle), y: Math.sin(angle) }, 
                player.projectileSpeed, 
                currentDamage, 
                isPiercing
            );
        //    console.log(`Projectile spawned, damage: ${currentDamage}, active: ${proj.active}`);
        }
        
        createParticles(projectileX, projectileY, isPiercing ? "#e67e22" : "#f1c40f", 3, 1.5, 2);
    }
    
    player.lastFired = timestamp;
    
    // Fire homing missile on a separate cooldown
    if (isHomingActive && timestamp - player.lastHomingFired > GAME_CONFIG.HOMING_FIRE_RATE) {
        const homingProj = PoolManager.get('projectiles');
        
        if (homingProj) {
            homingProj.spawn(
                projectileX, 
                projectileY, 
                8, 
                POWERUP_TYPES.homingMissile.color, 
                { x: Math.cos(angle), y: Math.sin(angle) }, 
                GAME_CONFIG.HOMING_MISSILE_SPEED, 
                GAME_CONFIG.HOMING_MISSILE_DAMAGE, 
                false, 
                true // isHoming
            );
            console.log(`Homing missile spawned, damage: ${GAME_CONFIG.HOMING_MISSILE_DAMAGE}`);
        }
        
        player.lastHomingFired = timestamp;
        createParticles(projectileX, projectileY, POWERUP_TYPES.homingMissile.color, 4, 2, 1.5);
    }
}

function fireIfNeeded(timestamp) {
    if (InputManager.mouse.pressed || InputManager.touchFire.active) {
        const currentFireRate = player.powerUps.rapidFire.active ? player.fireRate / 2 : player.fireRate;
        
        if (timestamp - player.lastFired > currentFireRate) {
            fireProjectile(timestamp);
        }
    }
}

/**
 * Make sure the updatePowerUps function also works correctly:
 */
function updatePowerUps(timestamp) {
    let indicatorsNeedUpdate = false;
    
    if (!player || !player.powerUps) {
        console.warn("Player powerUps not properly initialized");
        return false;
    }
    
    Object.keys(player.powerUps).forEach(key => {
        const powerUp = player.powerUps[key];
        if (powerUp && powerUp.active && timestamp > powerUp.endTime) {
            powerUp.active = false;
            indicatorsNeedUpdate = true;
            console.log(`Power-up expired: ${key}`);
        }
    });
    
    return indicatorsNeedUpdate;
}
    
    // Update player's score multiplier
    function updateMultiplier(dt, now) {
        if (player.multiplier > 1.0) {
            if (now - player.lastFragmentCollectionTime > GAME_CONFIG.MULTIPLIER_DECAY_DELAY) {
                player.multiplier = Math.max(
                    1.0, 
                    player.multiplier - GAME_CONFIG.MULTIPLIER_DECAY_RATE * dt
                );
                UIManager.updateMultiplierDisplay();
            }
        }
    }
    
    // Public API
    return {
        createPlayer,
        updatePlayer,
        fireIfNeeded,
        fireProjectile,
        updatePowerUps,
        updateMultiplier,
        triggerDash
    };
})();