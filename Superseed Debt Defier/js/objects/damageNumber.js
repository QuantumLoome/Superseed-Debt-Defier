/**
 * DamageNumber Class
 * Displays floating damage numbers when enemies are hit
 */
class DamageNumber {
    constructor() {
        this.active = false;
        this.x = 0;
        this.y = 0;
        this.value = 0;
        this.color = '#fff';
        this.size = 14;
        this.alpha = 1;
        this.velocity = { x: 0, y: 0 };
        this.lifetime = 0;
        this.maxLifetime = 1000; // 1 second
    }
    
    spawn(x, y, value, color = '#ff0') {
        this.active = true;
        this.x = x;
        this.y = y;
        this.value = value;
        this.color = color;
        this.alpha = 1;
        
        // Random spread
        const angle = (Math.random() * Math.PI / 4) - (Math.PI / 8);
        const speed = 1 + Math.random() * 1;
        this.velocity = {
            x: Math.cos(angle) * speed,
            y: -2 - Math.random() * 1 // Stronger negative velocity (upward movement)
        };
        
        // Size based on value
        this.size = Math.min(14 + Math.floor(value / 10), 24);
        
        // Reset lifetime
        this.lifetime = 0;
        this.maxLifetime = 800 + Math.random() * 200; // 0.8-1.0 seconds
    }
    
    update(dt) {
        if (!this.active) return;
        
        // Update lifetime first
        this.lifetime += dt * 1000;
        
        // Force release if lifetime is exceeded regardless of any other conditions
        if (this.lifetime >= this.maxLifetime) {
            this.active = false;
            PoolManager.release(this);
            return;
        }
        
        // Update position
        this.x += this.velocity.x * 60 * dt;
        this.y += this.velocity.y * 60 * dt;
        
        // Slow down vertical movement
        this.velocity.y += 0.1 * 60 * dt;
        
        // Update alpha based on lifetime
        if (this.lifetime > this.maxLifetime * 0.6) {
            this.alpha = 1 - ((this.lifetime - (this.maxLifetime * 0.6)) / (this.maxLifetime * 0.4));
        }
    }
    
    draw(ctx) {
        if (!this.active) return;
        
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = this.color;
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.lineWidth = 2;
        ctx.font = `bold ${this.size}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Create text stroke (outline)
        ctx.strokeText(this.value, this.x, this.y);
        ctx.fillText(this.value, this.x, this.y);
        
        ctx.restore();
    }
    
    reset() {
        this.active = false;
    }
}