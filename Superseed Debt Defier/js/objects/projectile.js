/**
 * Projectile Class
 * Handles both player and enemy projectiles
 */
class Projectile {
    constructor() { 
        this.active = false; 
        this.x = 0; 
        this.y = 0; 
        this.radius = 5; 
        this.color = '#fff'; 
        this.speed = 8; 
        this.damage = 10; 
        this.direction = { x: 0, y: 0 }; 
        this.piercing = false; 
        this.hitEnemies = null; 
        this.isHoming = false; 
        this.targetEnemy = null; 
    } 

    spawn(x, y, radius, color, direction, speed, damage, piercing, isHoming = false) { 
        this.x = x; 
        this.y = y; 
        this.radius = radius; 
        this.color = color; 
        this.direction = direction; 
        this.speed = speed; 
        this.damage = damage; 
        this.piercing = piercing; 
        this.hitEnemies = piercing ? [] : null;
        this.isHoming = isHoming; 
        this.targetEnemy = null; 
        this.active = true;
    }

    update(dt) {
        if (!this.active) return;
        
        if (this.isHoming) {
            if (this.targetEnemy && (!this.targetEnemy.active || this.targetEnemy.health <= 0)) {
                this.targetEnemy = null;
            }
            
            if (!this.targetEnemy) {
                this.targetEnemy = findNearestEnemy(this.x, this.y, GAME_CONFIG.HOMING_ACQUIRE_RANGE);
            }
            
            if (this.targetEnemy) {
                const targetDx = this.targetEnemy.x - this.x;
                const targetDy = this.targetEnemy.y - this.y;
                const targetAngle = Math.atan2(targetDy, targetDx);
                const currentAngle = Math.atan2(this.direction.y, this.direction.x);
                
                let angleDiff = targetAngle - currentAngle;
                while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
                while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
                
                const maxTurn = GAME_CONFIG.HOMING_TURN_RATE * dt;
                const turnAmount = Math.max(-maxTurn, Math.min(maxTurn, angleDiff));
                const newAngle = currentAngle + turnAmount;
                
                this.direction.x = Math.cos(newAngle);
                this.direction.y = Math.sin(newAngle);
            }
        }
        
        const moveSpeed = this.speed * GAME_CONFIG.BASE_SPEED_MULTIPLIER * dt;
        this.x += this.direction.x * moveSpeed;
        this.y += this.direction.y * moveSpeed;
        
        // Access canvas through window
        const canvas = window.canvas;
        
        // Check if out of bounds
        if (this.x < -this.radius * 2 || 
            this.x > canvas.width + this.radius * 2 || 
            this.y < -this.radius * 2 || 
            this.y > canvas.height + this.radius * 2) {
            PoolManager.release(this);
        }
    }

    draw(ctx) {
        if (!this.active) return;
        
        ctx.save();
        
        if (this.isHoming) {
            ctx.fillStyle = this.color;
            ctx.beginPath();
            const angle = Math.atan2(this.direction.y, this.direction.x);
            ctx.translate(this.x, this.y);
            ctx.rotate(angle);
            ctx.moveTo(this.radius, 0);
            ctx.lineTo(-this.radius * 0.5, this.radius * 0.6);
            ctx.lineTo(-this.radius * 0.5, -this.radius * 0.6);
            ctx.closePath();
            ctx.fill();
            
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 1;
            ctx.globalAlpha = 0.5;
            ctx.beginPath();
            ctx.moveTo(-this.radius * 0.6, 0);
            ctx.lineTo(-this.radius * 2, 0);
            ctx.stroke();
        } else {
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.globalAlpha = 0.4;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius * 1.5, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
    }

    reset() { 
        this.active = false; 
        this.hitEnemies = null; 
        this.isHoming = false; 
        this.targetEnemy = null; 
    }
}