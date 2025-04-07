/**
 * Background System
 * Manages starfield background and visual effects
 */
const BackgroundSystem = (() => {
    // Array of star objects
    let stars = [];
    // Background texture
    let backgroundTexture = null;
    let textureLoaded = false;
    
    // Initialize background stars
    function initialize() {
        const canvas = window.canvas;
        stars = [];
        
        // Create stars for each layer defined in config
        STAR_LAYERS.forEach(layer => {
            for (let i = 0; i < layer.count; i++) {
                stars.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    radius: layer.radius,
                    speed: layer.speed,
                    alpha: layer.alpha
                });
            }
        });
        
        // Load background texture
        backgroundTexture = new Image();
        backgroundTexture.onload = function() {
            textureLoaded = true;
            console.log("Background texture loaded successfully");
        };
        backgroundTexture.onerror = function() {
            console.error("Failed to load background texture");
        };
        backgroundTexture.src = 'assets/images/background-tile.png';
        
        console.log(`Background initialized with ${stars.length} stars`);
    }
    
    // Update star positions
    function update(dt) {
        const canvas = window.canvas;
        
        stars.forEach(star => {
            // Move stars downward
            star.y += star.speed * dt;
            
            // Wrap stars at bottom of screen
            if (star.y > canvas.height + star.radius * 2) {
                star.y = -star.radius * 2;
                star.x = Math.random() * canvas.width;
            }
        });
    }
    
    // Draw background texture
    function drawBackground(ctx) {
        const canvas = window.canvas;
        
        if (textureLoaded) {
            // Draw tiled background
            const tileWidth = backgroundTexture.width;
            const tileHeight = backgroundTexture.height;
            
            const tilesX = Math.ceil(canvas.width / tileWidth);
            const tilesY = Math.ceil(canvas.height / tileHeight);
            
            ctx.globalAlpha = GAME_CONFIG.BACKGROUND_TEXTURE_OPACITY || 0.3;
            
            for (let y = 0; y < tilesY; y++) {
                for (let x = 0; x < tilesX; x++) {
                    ctx.drawImage(
                        backgroundTexture,
                        x * tileWidth,
                        y * tileHeight,
                        tileWidth,
                        tileHeight
                    );
                }
            }
            
            ctx.globalAlpha = 1.0;
        } else {
            // Fallback solid color background
            ctx.fillStyle = "#080810";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
    }
    
    // Draw stars
    function draw(ctx) {
        // Draw the background texture first
        drawBackground(ctx);
        
        // Then draw stars on top
        stars.forEach(star => {
            ctx.save();
            
            ctx.fillStyle = `rgba(255, 255, 255, ${star.alpha})`;
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.restore();
        });
    }
    
    // Draw border
    function drawBorder(ctx) {
        const borderPathPoints = GameManager.borderPathPoints;
        
        if (borderPathPoints && borderPathPoints.length > 1) {
            ctx.save();
            
            // Draw outer border shadow
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(borderPathPoints[0].x, borderPathPoints[0].y);
            
            for (let i = 1; i < borderPathPoints.length; i++) {
                ctx.lineTo(borderPathPoints[i].x, borderPathPoints[i].y);
            }
            
            ctx.closePath();
            ctx.stroke();
            
            // Draw inner border
            ctx.strokeStyle = 'rgba(20, 20, 20, 0.6)';
            ctx.lineWidth = 1.5;
            ctx.translate(0.5, 0.5); // Pixel perfect lines
            ctx.beginPath();
            ctx.moveTo(borderPathPoints[0].x, borderPathPoints[0].y);
            
            for (let i = 1; i < borderPathPoints.length; i++) {
                ctx.lineTo(borderPathPoints[i].x, borderPathPoints[i].y);
            }
            
            ctx.closePath();
            ctx.stroke();
            
            ctx.restore();
        }
    }
    
    // Public API
    return {
        initialize,
        update,
        draw,
        drawBorder
    };
})();