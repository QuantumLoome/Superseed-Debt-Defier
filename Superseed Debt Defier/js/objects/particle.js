/**
 * Particle Class
 * Manages visual particle effects like explosions and impacts
 */
class Particle { 
    constructor() { 
        this.active = false;
        this.x = 0;
        this.y = 0;
        this.radius = 2;
        this.color = '#fff';
        this.vx = 0;
        this.vy = 0;
        this.alpha = 1;
        this.decay = 0.02; 
    } 
    
    spawn(x, y, radius, color, vx, vy, alpha, decay) { 
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.vx = vx;
        this.vy = vy;
        this.alpha = alpha;
        this.decay = decay;
        this.active = true; 
    } 
    
    update(dt) { 
        if (!this.active) return; 
        
        const speedScale = GAME_CONFIG.BASE_SPEED_MULTIPLIER * dt; 
        const decayRate = this.decay * GAME_CONFIG.BASE_SPEED_MULTIPLIER * dt; 
        
        this.x += this.vx * speedScale; 
        this.y += this.vy * speedScale; 
        this.vy += 0.02 * speedScale; // Add a little gravity
        this.alpha -= decayRate; 
        
        if (this.alpha <= 0) { 
            PoolManager.release(this); 
        } 
    } 
    
    draw(ctx) { 
        if (!this.active || this.alpha <= 0) return; 
        
        ctx.save(); 
        ctx.globalAlpha = this.alpha; 
        ctx.fillStyle = this.color; 
        ctx.beginPath(); 
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2); 
        ctx.fill(); 
        ctx.restore(); 
    } 
    
    reset() { 
        this.active = false; 
        this.alpha = 0; 
    }
}