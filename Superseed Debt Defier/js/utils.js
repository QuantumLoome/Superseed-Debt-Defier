/**
 * Utility Functions
 * Common helper functions used throughout the game
 */

// Check for collision between two circles
function circleCollision(circle1, circle2) {
    const dx = circle1.x - circle2.x;
    const dy = circle1.y - circle2.y;
    const distanceSq = dx * dx + dy * dy;
    const radiusSum = circle1.radius + circle2.radius;
    return distanceSq < radiusSum * radiusSum;
}

// Create particle effects
function createParticles(x, y, color, count, speed, size) {
    for (let i = 0; i < count; i++) {
        const p = PoolManager.get('particles');
        if (p) {
            const angle = Math.random() * Math.PI * 2;
            const velocity = Math.random() * speed;
            const pRadius = Math.random() * size + 1;
            const pAlpha = 0.7 + Math.random() * 0.3;
            const pDecay = 0.015 + Math.random() * 0.025;
            
            p.spawn(
                x, 
                y, 
                pRadius, 
                color, 
                Math.cos(angle) * velocity, 
                Math.sin(angle) * velocity, 
                pAlpha, 
                pDecay
            );
        } else {
            break; // Pool is exhausted
        }
    }
}

// Find the nearest enemy within range
function findNearestEnemy(x, y, range) {
    let nearestEnemy = null;
    let minDistanceSq = range * range;
    
    enemies.forEach(enemy => {
        if (!enemy.active || enemy.health <= 0) return;
        
        const dx = enemy.x - x;
        const dy = enemy.y - y;
        const distanceSq = dx * dx + dy * dy;
        
        if (distanceSq < minDistanceSq) {
            minDistanceSq = distanceSq;
            nearestEnemy = enemy;
        }
    });
    
    return nearestEnemy;
}

// Initialize border path for the game canvas
function initializeBorderPath(w, h, wobble = 3, segments = 20) {
    const borderPathPoints = [];
    const margin = 2;
    
    const x = margin;
    const y = margin;
    w -= margin * 2;
    h -= margin * 2;
    
    // Top border
    let currentX = x + Math.random() * wobble - wobble / 2;
    let currentY = y + Math.random() * wobble - wobble / 2;
    borderPathPoints.push({ x: currentX, y: currentY });
    
    for (let i = 1; i <= segments; i++) {
        currentX = x + (w * i / segments) + Math.random() * wobble - wobble / 2;
        currentY = y + Math.random() * wobble - wobble / 2;
        borderPathPoints.push({ x: currentX, y: currentY });
    }
    
    // Right border
    for (let i = 1; i <= segments; i++) {
        currentX = x + w + Math.random() * wobble - wobble / 2;
        currentY = y + (h * i / segments) + Math.random() * wobble - wobble / 2;
        borderPathPoints.push({ x: currentX, y: currentY });
    }
    
    // Bottom border (reverse direction)
    for (let i = segments - 1; i >= 0; i--) {
        currentX = x + (w * i / segments) + Math.random() * wobble - wobble / 2;
        currentY = y + h + Math.random() * wobble - wobble / 2;
        borderPathPoints.push({ x: currentX, y: currentY });
    }
    
    // Left border (reverse direction)
    for (let i = segments - 1; i >= 0; i--) {
        currentX = x + Math.random() * wobble - wobble / 2;
        currentY = y + (h * i / segments) + Math.random() * wobble - wobble / 2;
        borderPathPoints.push({ x: currentX, y: currentY });
    }
    
    return borderPathPoints;
}

// Share score to Twitter
function shareToTwitter(playerName, score) {
    const text = `I just scored ${score} points as Agent ${playerName} in Debt Hunter! Can you beat my score? #DebtHunterGame`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    
    const shareWindow = window.open(url, '_blank', 'width=550,height=420,noopener,noreferrer');
    
    if (shareWindow) {
        shareWindow.focus();
    } else {
        console.warn("Could not open share window. Pop-up blocker might be active.");
    }
}

// Add this to utils.js after the existing functions
const GameAssets = {
    sprites: {},
    loadImage: function(key, src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                this.sprites[key] = img;
                resolve(img);
            };
            img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
            img.src = src;
        });
    },
    getSprite: function(key) {
        return this.sprites[key];
    }
};

// Function to load all game sprites
async function loadGameSprites() {
    try {
        await Promise.all([
            GameAssets.loadImage('player', 'assets/images/player.png'),
            GameAssets.loadImage('debtCollector', 'assets/images/debtCollector.png'),
            GameAssets.loadImage('interestCompounder', 'assets/images/interestCompounder.png'),
            GameAssets.loadImage('loanShark', 'assets/images/loanShark.png'),
            GameAssets.loadImage('bossCreditor', 'assets/images/bossCreditor.png'),
            GameAssets.loadImage('assetSeizer', 'assets/images/assetSeizer.png'),
            GameAssets.loadImage('debtSniper', 'assets/images/debtSniper.png'),
            GameAssets.loadImage('bankruptcyAgent', 'assets/images/bankruptcyAgent.png'),
            GameAssets.loadImage('hedgeFund', 'assets/images/hedgeFund.png'),
            // Add the pause background image
            GameAssets.loadImage('pauseBackground', 'assets/images/pause-background.png'),
            GameAssets.loadImage('gameOverBackground', 'assets/images/end-game.png')
        ]);
        console.log('All game sprites loaded successfully');
        return true;
    } catch (error) {
        console.error('Error loading game sprites:', error);
        return false;
    }
}