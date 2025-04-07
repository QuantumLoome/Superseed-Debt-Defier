/**
 * Render System
 * Handles rendering of all game entities
 */
const RenderSystem = (() => {
    // Main render function
    function render(ctx) {
        const canvas = window.canvas;
        
        // Clear canvas
        ctx.fillStyle = "#080810";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw background elements
        BackgroundSystem.draw(ctx);
        BackgroundSystem.drawBorder(ctx);
        
        // Draw game objects in the correct order
        drawFragments(ctx);
        drawPowerUps(ctx);
        drawProjectiles(ctx);
        drawEnemies(ctx);
        drawPlayer(ctx);
        drawParticles(ctx);
    }
    
    // Draw fragments
    function drawFragments(ctx) {
        PoolManager.drawPool('fragments', ctx);
    }
    
    // Draw powerups
    function drawPowerUps(ctx) {
        const powerUps = GameManager.getPowerUps();
        powerUps.forEach(powerUp => {
            powerUp.draw(ctx);
        });
    }
    
    // Draw projectiles
    function drawProjectiles(ctx) {
        PoolManager.drawPool('projectiles', ctx);
        PoolManager.drawPool('enemyProjectiles', ctx);
    }
    
// Draw enemies
function drawEnemies(ctx) {
    window.enemies.forEach(enemy => {
        if (!enemy.active) return;
        
        ctx.save();
        
        // Draw slow field effect
        if (enemy.special === 'slowField') {
            if (enemy.isSlowing) {
                const slowRadius = enemy.type.slowRadius;
                const pulse = (Math.sin(GameManager.frameCount * 0.05) + 1) / 2;
                
                ctx.globalAlpha = 0.1 + pulse * 0.15;
                ctx.fillStyle = enemy.color;
                ctx.beginPath();
                ctx.arc(enemy.x, enemy.y, slowRadius, 0, Math.PI * 2);
                ctx.fill();
            } else if (enemy.isChargingSlow) {
                const chargeProgress = (Date.now() - enemy.slowChargeStartTime) / (enemy.type.slowChargeDuration || GAME_CONFIG.SLOW_CHARGE_DURATION);
                const pulse = Math.sin(chargeProgress * Math.PI * 2) * 0.5 + 0.5;
                
                ctx.globalAlpha = 0.3 + pulse * 0.3;
                ctx.fillStyle = enemy.color;
                ctx.beginPath();
                ctx.arc(enemy.x, enemy.y, enemy.radius * (0.4 + pulse * 0.4), 0, Math.PI * 2);
                ctx.fill();
            }
        }
        
        // Draw shield if active
        if (enemy.shieldActive) {
            ctx.globalAlpha = 0.4 + Math.sin(GameManager.frameCount * 0.1) * 0.1;
            ctx.fillStyle = enemy.type.shieldColor || "#7f8c8d";
            ctx.beginPath();
            ctx.arc(enemy.x, enemy.y, enemy.radius * 1.2, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Set display alpha and scale based on hit effect
        ctx.globalAlpha = 1.0;
        let scale = 1.0;
        
        if (enemy.wasHit) {
            const timeSinceHit = Date.now() - enemy.hitTime;
            if (timeSinceHit < GAME_CONFIG.ENEMY_HIT_ANIM_DURATION) {
                const hitProgress = timeSinceHit / GAME_CONFIG.ENEMY_HIT_ANIM_DURATION;
                scale = 1.0 + Math.sin(hitProgress * Math.PI) * 0.1;
                
                // Flash white effect
                ctx.globalAlpha = 0.7;
            }
        }
        
        // Lunge telegraph effect
        if (enemy.isTelegraphingLunge) {
            ctx.globalAlpha = (Math.floor(Date.now() / 100) % 2 === 0) ? 0.7 : 1.0;
        }
        
        // Get enemy sprite based on type
        let spriteKey = '';
switch(enemy.type.name) {
  case 'Debt Collector': spriteKey = 'debtCollector'; break;
  case 'Interest Compounder': spriteKey = 'interestCompounder'; break;
  case 'Loan Shark': spriteKey = 'loanShark'; break;
  case 'The Creditor': spriteKey = 'bossCreditor'; break;
  case 'Asset Seizer': spriteKey = 'assetSeizer'; break;
  case 'Debt Sniper': spriteKey = 'debtSniper'; break;
  case 'Bankruptcy Agent': spriteKey = 'bankruptcyAgent'; break;
  case 'Hedge Fund': spriteKey = 'hedgeFund'; break;
  default: spriteKey = ''; break;
}
const enemySprite = GameAssets.getSprite(spriteKey);
        
        if (enemySprite) {
            // Calculate rotation angle - enemies generally face the player
            const angle = Math.atan2(window.player.y - enemy.y, window.player.x - enemy.x);
            
            // Draw enemy sprite
            ctx.translate(enemy.x, enemy.y);
            ctx.rotate(angle);
            
            // Scale the sprite to match the enemy radius (which may vary by enemy type)
            const spriteSize = enemy.radius * 2 * scale;
            ctx.drawImage(enemySprite, -spriteSize/2, -spriteSize/2, spriteSize, spriteSize);
        } else {
            // Fallback to circle if sprite not available
            ctx.fillStyle = enemy.color;
            ctx.beginPath();
            ctx.arc(enemy.x, enemy.y, enemy.radius * scale, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Reset context position for health bar
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        
        // Draw health bar for damaged enemies
        if (!enemy.shieldActive && enemy.health < enemy.maxHealth) {
            ctx.globalAlpha = 1.0; // Full opacity for health bar
            const barWidth = enemy.radius * 1.5 * scale;
            const barHeight = 5;
            const barX = enemy.x - barWidth / 2;
            const barY = enemy.y - (enemy.radius * scale) - 10;
            const healthPercent = enemy.health / enemy.maxHealth;
            
            // Background
            ctx.fillStyle = "#333";
            ctx.fillRect(barX, barY, barWidth, barHeight);
            
            // Health bar color changes based on health percentage
            ctx.fillStyle = healthPercent > 0.6 ? "#2ecc71" : healthPercent > 0.3 ? "#f39c12" : "#e74c3c";
            ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);
            
            // Border
            ctx.strokeStyle = "#111";
            ctx.lineWidth = 1;
            ctx.strokeRect(barX, barY, barWidth, barHeight);
        }
        
        ctx.restore();
    });
}
    
// Draw player
function drawPlayer(ctx) {
    if (!window.player) return;
    
    // Draw after-images first (if they exist)
    if (window.player.afterImages && window.player.afterImages.length > 0) {
        window.player.afterImages.forEach(afterImage => {
            ctx.save();
            
            // Draw player sprite/circle
            if (window.player.invulnerable && Math.floor(Date.now() / 100) % 2 === 0) {
                ctx.fillStyle = "#ffffff";
            } else {
                ctx.fillStyle = "#3498db";
            }
            
            // New damage pulse effect
            if (window.player.lastDamagedTime && 
                Date.now() - window.player.lastDamagedTime < 200) {
                // Create a pulsing red overlay
                ctx.save();
                const alphaPulse = Math.sin((Date.now() - window.player.lastDamagedTime) * 0.05) * 0.5 + 0.5;
                ctx.globalAlpha = 0.3 * alphaPulse;
                ctx.fillStyle = "#ff0000";
                ctx.beginPath();
                ctx.arc(window.player.x, window.player.y, window.player.radius * 1.2, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }
            
            ctx.beginPath();
            ctx.arc(window.player.x, window.player.y, window.player.radius, 0, Math.PI * 2);
            ctx.fill();

            // Get player sprite
            const playerSprite = GameAssets.getSprite('player');
            if (playerSprite) {
                // Set transparency for after-image
                ctx.globalAlpha = afterImage.alpha;
                
                // Draw the after-image at its stored position
                ctx.translate(afterImage.x, afterImage.y);
                ctx.rotate(afterImage.angle + Math.PI/2); // Same rotation adjustment as player
                
                // Draw slightly smaller than the player
                const afterImageSize = window.player.radius * 1.8;
                ctx.drawImage(playerSprite, 
                    -afterImageSize/2, -afterImageSize/2, 
                    afterImageSize, afterImageSize);
            }
            
            ctx.restore();
        });
    }
    
    ctx.save();
    
    // Draw powerup effects
    ctx.globalAlpha = 0.3;
    
    if (window.player.powerUps.speedBoost.active) {
        ctx.fillStyle = "#2ecc71";
        ctx.beginPath();
        ctx.arc(window.player.x, window.player.y, window.player.radius * 1.7, 0, Math.PI * 2);
        ctx.fill();
    }
    
    if (window.player.powerUps.doubleDamage.active) {
        ctx.fillStyle = "#9b59b6";
        ctx.beginPath();
        ctx.arc(window.player.x, window.player.y, window.player.radius * 1.5, 0, Math.PI * 2);
        ctx.fill();
    }
    
    if (window.player.powerUps.rapidFire.active) {
        ctx.fillStyle = "#f1c40f";
        ctx.beginPath();
        ctx.arc(window.player.x, window.player.y, window.player.radius * 1.3, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // New damage pulse effect for the main player rendering
    if (window.player.lastDamagedTime && 
        Date.now() - window.player.lastDamagedTime < 200) {
        // Create a pulsing red overlay
        ctx.save();
        const alphaPulse = Math.sin((Date.now() - window.player.lastDamagedTime) * 0.05) * 0.5 + 0.5;
        ctx.globalAlpha = 0.3 * alphaPulse;
        ctx.fillStyle = "#ff0000";
        ctx.beginPath();
        ctx.arc(window.player.x, window.player.y, window.player.radius * 1.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
    
    // Draw player sprite
    ctx.globalAlpha = 1.0;

    // New damage pulse effect - MOVED BEFORE sprite rendering
if (window.player.lastDamagedTime && 
    Date.now() - window.player.lastDamagedTime < 200) {
    // Create a pulsing red overlay
    ctx.save();
    const alphaPulse = Math.sin((Date.now() - window.player.lastDamagedTime) * 0.05) * 0.5 + 0.5;
    ctx.globalAlpha = 0.3 * alphaPulse;
    ctx.fillStyle = "#ff0000";
    ctx.beginPath();
    ctx.arc(window.player.x, window.player.y, window.player.radius * 1.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
}
    
    // Get player sprite
    const playerSprite = GameAssets.getSprite('player');
    
    if (playerSprite) {
        // Calculate rotation angle based on player direction
        const angle = Math.atan2(window.player.direction.y, window.player.direction.x);
        
        // Flash white when invulnerable by adjusting globalAlpha
        if (window.player.invulnerable && Math.floor(Date.now() / 100) % 2 === 0) {
            ctx.globalAlpha = 0.5;
        }
        
        // Save context, translate to player position, rotate, then draw
        ctx.translate(window.player.x, window.player.y);
        ctx.rotate(angle - Math.PI/2); // Subtract PI/2 (90 degrees) to align sprite
        
        // Draw sprite centered on player position
        // The 48 values are the sprite dimensions (48x48)
        ctx.drawImage(playerSprite, -window.player.radius, -window.player.radius, 
                    window.player.radius * 2, window.player.radius * 2);
        
        // No need for the direction indicator when using sprites
    }
    
    ctx.restore();
}
    
    // Draw particles
    function drawParticles(ctx) {
        PoolManager.drawPool('particles', ctx);
    }
    
    // Public API
    return {
        render
    };
})();