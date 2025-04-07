/**
 * PowerUp Class
 * Manages powerup objects that give special abilities to the player
 */
class PowerUp {
    constructor(type, x, y) {
        this.type = type;
        this.x = x;
        this.y = y;
        this.radius = type.radius || 8;
        this.color = type.color;
        this.spawnTime = Date.now();
        this.isFading = false;
        this.vx = 0;
        this.vy = 0;
    }

    update(dt) {
        const now = Date.now();
        const age = now - this.spawnTime;
        
        if (age > GAME_CONFIG.POWERUP_LIFETIME) {
            return false; // Signals to remove this powerup
        }
        
        this.isFading = age > GAME_CONFIG.POWERUP_LIFETIME - GAME_CONFIG.ITEM_FADE_START_TIME;
        
        // Check for magnet effect
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const distSq = dx * dx + dy * dy;
        
        if (distSq < GAME_CONFIG.MAGNET_RADIUS * GAME_CONFIG.MAGNET_RADIUS) {
            const distance = Math.sqrt(distSq);
            if (distance > 1) {
                const pullStrength = GAME_CONFIG.MAGNET_STRENGTH * (1 - distance / GAME_CONFIG.MAGNET_RADIUS);
                this.vx += (dx / distance) * pullStrength * dt;
                this.vy += (dy / distance) * pullStrength * dt;
            }
        }
        
        const speedScale = GAME_CONFIG.BASE_SPEED_MULTIPLIER * dt;
        this.x += this.vx * speedScale;
        this.y += this.vy * speedScale;
        this.vx *= 0.98;
        this.vy *= 0.98;
        
        return true; // Still valid
    }

    draw(ctx) {
        ctx.save();
        
        let alphaMod = 1.0;
        if (this.isFading) {
            alphaMod = (Math.floor(Date.now() / 150) % 2 === 0) ? 1.0 : 0.3;
        }
        
        ctx.globalAlpha = alphaMod;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw pulsing glow
        const frameCount = GameManager.frameCount || 0;
        ctx.globalAlpha = (0.3 + Math.sin(frameCount * 0.1 + this.x) * 0.2) * alphaMod;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * 1.5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }

    activate() {
        // Apply the powerup effect to the player
        AudioManager.playSound('powerup');
        if (this.type.name === "Health Pack") {
            player.health = Math.min(player.maxHealth, player.health + 1);
            UIManager.updateHealthDisplay();
            
        } else {
            let key = this.type.name.replace(/\s+/g, '');
            // Lowercase the first letter to match the keys in player.powerUps
            key = key.charAt(0).toLowerCase() + key.slice(1);
            player.powerUps[key].active = true;
            player.powerUps[key].endTime = Date.now() + this.type.duration;
            UIManager.updatePowerUpIndicators();
        }
        
        // Create visual effect
        createParticles(this.x, this.y, this.color, 15, 2.5, 3.5);
    }

    // Static method to spawn a powerup with random type
    static spawn(x, y) {
        const availableTypes = Object.values(POWERUP_TYPES);
        const totalRarity = availableTypes.reduce((sum, type) => sum + (type.rarity || 0), 0);
        
        let randomValue = Math.random() * totalRarity;
        let selectedType = POWERUP_TYPES.healthPack; // Default
        
        for (const type of availableTypes) {
            randomValue -= (type.rarity || 0);
            if (randomValue <= 0) {
                selectedType = type;
                break;
            }
        }
        
        return new PowerUp(selectedType, x, y);
    }
}

// This will be loaded in GameManager
const powerUps = [];