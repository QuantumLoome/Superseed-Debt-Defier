/**
 * Fragment Class
 * Collectible fragments that increase player's score multiplier
 */
class Fragment { 
    constructor() { 
        this.active = false;
        this.x = 0;
        this.y = 0;
        this.radius = 4;
        this.color = '#2ecc71';
        this.value = 0.1;
        this.spawnTime = 0;
        this.vx = 0;
        this.vy = 0;
        this.rotation = 0; 
        this.rotationSpeed = (Math.random() - 0.5) * 0.1;
        this.isFading = false; 
    } 
    
    spawn(x, y) { 
        this.x = x;
        this.y = y;
        this.spawnTime = Date.now();
        this.active = true; 
        
        const angle = Math.random() * Math.PI * 2; 
        const speed = 1 + Math.random() * 1; 
        this.vx = Math.cos(angle) * speed; 
        this.vy = Math.sin(angle) * speed; 
        this.rotation = Math.random() * Math.PI * 2; 
        this.isFading = false; 
    } 
    
    update(dt) { 
        if (!this.active) return; 
        
        const now = Date.now(); 
        const age = now - this.spawnTime; 
        
        if (age > GAME_CONFIG.FRAGMENT_LIFETIME) { 
            PoolManager.release(this); 
            return; 
        } 
        
        this.isFading = age > GAME_CONFIG.FRAGMENT_LIFETIME - GAME_CONFIG.ITEM_FADE_START_TIME; 
        
        // Check for magnet effect when player is close
        const dx = window.player.x - this.x; 
        const dy = window.player.y - this.y; 
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
        this.vx *= 0.95; // Add some drag
        this.vy *= 0.95;
        this.rotation += this.rotationSpeed; 
    } 
    
    draw(ctx) { 
        if (!this.active) return; 
        
        ctx.save(); 
        ctx.translate(this.x, this.y); 
        ctx.rotate(this.rotation); 
        
        let alphaMod = 1.0; 
        if (this.isFading) { 
            alphaMod = (Math.floor(Date.now() / 150) % 2 === 0) ? 1.0 : 0.3; 
        } 
        
        ctx.globalAlpha = alphaMod; 
        ctx.fillStyle = this.color; 
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)'; 
        ctx.lineWidth = 1; 
        
        // Draw diamond shape
        ctx.beginPath(); 
        ctx.moveTo(0, -this.radius); 
        ctx.lineTo(this.radius * 0.7, 0); 
        ctx.lineTo(0, this.radius); 
        ctx.lineTo(-this.radius * 0.7, 0); 
        ctx.closePath(); 
        ctx.fill(); 
        ctx.stroke(); 
        
        // Draw glow effect
        ctx.globalAlpha = 0.5 * alphaMod; 
        ctx.fillStyle = this.color; 
        ctx.beginPath(); 
        ctx.arc(0, 0, this.radius * 1.2, 0, Math.PI * 2); 
        ctx.fill(); 
        
        ctx.restore(); 
    } 
    
    reset() { 
        this.active = false; 
        this.vx = 0; 
        this.vy = 0; 
        this.isFading = false; 
    }
}