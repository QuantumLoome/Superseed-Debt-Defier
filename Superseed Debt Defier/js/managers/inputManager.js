/**
 * Input Manager
 * Handles keyboard, mouse and touch input events
 */
const InputManager = (() => {
    // Input states
    const keys = {};
    const mouse = { x: 0, y: 0, pressed: false, isActive: false };
    const touchJoystick = { 
        active: false, 
        identifier: null, 
        startX: 0, 
        startY: 0, 
        currentX: 0, 
        currentY: 0, 
        dx: 0, 
        dy: 0, 
        angle: 0, 
        isActive: false 
    };
    const touchFire = { active: false, identifier: null };
    const touchBomb = { active: false, identifier: null };
    
    const doubleTapTracker = { 
        lastTap: 0,
        touchStartX: 0,
        touchStartY: 0
    };
    
    // Cached DOM elements
    let canvas;
    let joystickArea;
    let joystickKnob;
    let fireArea;
    let bombArea;
    
    // Cached callback functions
    let callbacks = {
        startGame: null,
        pauseGame: null,
        resumeGame: null,
        returnToMainMenu: null,
        triggerBomb: null,
        shareScore: null
    };
    
    // Initialize input event listeners
    function initialize(options) {
        console.log("Initializing input manager...");
        
        // Cache DOM elements
        canvas = options.canvas;
        joystickArea = document.getElementById('joystickArea');
        joystickKnob = document.getElementById('joystickKnob');
        fireArea = document.getElementById('fireArea');
        bombArea = document.getElementById('bombArea');
        
        // Cache callback functions
        callbacks = {
            startGame: options.startGame || (() => {}),
            pauseGame: options.pauseGame || (() => {}),
            resumeGame: options.resumeGame || (() => {}),
            returnToMainMenu: options.returnToMainMenu || (() => {}),
            triggerBomb: options.triggerBomb || (() => {}),
            triggerDash: options.triggerDash || (() => {}),
            shareScore: options.shareScore || (() => {})
        };
        
        // Detect if the device supports touch
        const isMobile = ('ontouchstart' in window || navigator.maxTouchPoints > 0);
        
        // Set up keyboard listeners
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        
        // Set up mouse listeners
        canvas.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mousedown', handleMouseDown);
        window.addEventListener('mouseup', handleMouseUp);
        
        // Set up button listeners
        const startButton = document.getElementById('startButton');
        const restartButton = document.getElementById('restartButton');
        const resumeButton = document.getElementById('resumeButton');
        const returnMenuButton = document.getElementById('returnMenuButton');
        const shareButton = document.getElementById('shareButton');
        
        if (startButton) startButton.addEventListener('click', callbacks.startGame);
        if (restartButton) restartButton.addEventListener('click', callbacks.startGame);
        if (resumeButton) resumeButton.addEventListener('click', callbacks.resumeGame);
        if (returnMenuButton) returnMenuButton.addEventListener('click', callbacks.returnToMainMenu);
        if (shareButton) shareButton.addEventListener('click', callbacks.shareScore);
        
        // Set up touch controls if applicable
        if (isMobile) {
            console.log("Mobile device detected, enabling touch controls.");
            document.body.classList.add('mobile-detected');
            
            // Set up touch event listeners
            joystickArea.addEventListener('touchstart', handleTouchStart, { passive: false });
            joystickArea.addEventListener('touchmove', handleTouchMove, { passive: false });
            joystickArea.addEventListener('touchend', handleTouchEnd, { passive: false });
            joystickArea.addEventListener('touchcancel', handleTouchEnd, { passive: false });
            
            fireArea.addEventListener('touchstart', handleTouchStart, { passive: false });
            fireArea.addEventListener('touchend', handleTouchEnd, { passive: false });
            fireArea.addEventListener('touchcancel', handleTouchEnd, { passive: false });
            
            bombArea.addEventListener('touchstart', handleTouchStart, { passive: false });
            bombArea.addEventListener('touchend', handleTouchEnd, { passive: false });
            bombArea.addEventListener('touchcancel', handleTouchEnd, { passive: false });
        } else {
            console.log("Desktop device detected, touch controls disabled.");
        }
        
        console.log("Input manager initialized.");
    }
    
    // Handle keyboard down events
    function handleKeyDown(e) {
        const key = e.key.toLowerCase();
        keys[key] = true;
        
        // Check for bomb trigger (now spacebar)
        if (!GameManager.isPaused && key === ' ' && 
            (GameManager.gameState === 'playing' || GameManager.gameState === 'levelComplete')) {
            callbacks.triggerBomb();
        }
        
        // Add dash trigger on shift key
        if (!GameManager.isPaused && (key === 'shift') && 
        (GameManager.gameState === 'playing' || GameManager.gameState === 'levelComplete')) {
        callbacks.triggerDash();
        
        }    
        // Check for pause toggle
        if (key === 'escape' || key === 'p') {
            if (GameManager.isPaused) {
                callbacks.resumeGame();
            } else if (GameManager.gameState === 'playing') {
                callbacks.pauseGame();
            }
        }
    }
    
    // Handle keyboard up events
    function handleKeyUp(e) {
        const key = e.key.toLowerCase();
        keys[key] = false;
    }
    
    // Handle mouse move events
    function handleMouseMove(e) {
        const rect = canvas.getBoundingClientRect();
        mouse.x = e.clientX - rect.left;
        mouse.y = e.clientY - rect.top;
        mouse.isActive = true;
        touchJoystick.isActive = false;
    }
    
    // Handle mouse down events
    function handleMouseDown(e) {
        mouse.pressed = true;
    }
    
    // Handle mouse up events
    function handleMouseUp(e) {
        mouse.pressed = false;
    }
    
    // Handle touch start events
    function handleTouchStart(e) {
        e.preventDefault();
        const touches = e.changedTouches;
        
        for (let i = 0; i < touches.length; i++) {
            const touch = touches[i];
            const touchX = touch.clientX;
            const touchY = touch.clientY;
            const targetElement = document.elementFromPoint(touchX, touchY);
            
            if (targetElement === joystickArea && !touchJoystick.active) {
                // Handle joystick activation
                touchJoystick.active = true;
                touchJoystick.identifier = touch.identifier;
                
                const rect = joystickArea.getBoundingClientRect();
                touchJoystick.startX = rect.left + rect.width / 2;
                touchJoystick.startY = rect.top + rect.height / 2;
                touchJoystick.currentX = touch.clientX;
                touchJoystick.currentY = touch.clientY;
                
                joystickArea.classList.add('active');
                if (joystickKnob) joystickKnob.style.display = 'block';
                updateJoystickVisuals();
                
            } else if (targetElement === fireArea && !touchFire.active) {
                // Handle fire button activation
                touchFire.active = true;
                touchFire.identifier = touch.identifier;
                fireArea.classList.add('active');
                
            } else if (targetElement === bombArea && !touchBomb.active) {
                // Handle bomb button activation
                if (!GameManager.isPaused && 
                    (GameManager.gameState === 'playing' || GameManager.gameState === 'levelComplete')) {
                    callbacks.triggerBomb();
                }
                
                touchBomb.active = true;
                touchBomb.identifier = touch.identifier;
                bombArea.classList.add('active');
            }
            const now = Date.now();
    if (now - doubleTapTracker.lastTap < 300) { // 300ms window for double-tap
        callbacks.triggerDash();
    }
    doubleTapTracker.lastTap = now;    
        }
    }
    
    // Handle touch move events
    function handleTouchMove(e) {
        e.preventDefault();
        const touches = e.changedTouches;
        
        for (let i = 0; i < touches.length; i++) {
            const touch = touches[i];
            
            if (touchJoystick.active && touch.identifier === touchJoystick.identifier) {
                // Update joystick position
                touchJoystick.currentX = touch.clientX;
                touchJoystick.currentY = touch.clientY;
                
                let dx = touchJoystick.currentX - touchJoystick.startX;
                let dy = touchJoystick.currentY - touchJoystick.startY;
                const distance = Math.hypot(dx, dy);
                
                // Limit joystick range
                if (distance > GAME_CONFIG.JOYSTICK_MAX_RADIUS) {
                    dx = (dx / distance) * GAME_CONFIG.JOYSTICK_MAX_RADIUS;
                    dy = (dy / distance) * GAME_CONFIG.JOYSTICK_MAX_RADIUS;
                }
                
                if (distance > 0) {
                    touchJoystick.dx = dx / GAME_CONFIG.JOYSTICK_MAX_RADIUS;
                    touchJoystick.dy = dy / GAME_CONFIG.JOYSTICK_MAX_RADIUS;
                    touchJoystick.angle = Math.atan2(dy, dx);
                } else {
                    touchJoystick.dx = 0;
                    touchJoystick.dy = 0;
                }
                
                updateJoystickVisuals(dx, dy);
            }
        }
    }
    
    // Handle touch end events
    function handleTouchEnd(e) {
        e.preventDefault();
        const touches = e.changedTouches;
        
        for (let i = 0; i < touches.length; i++) {
            const touch = touches[i];
            
            if (touchJoystick.active && touch.identifier === touchJoystick.identifier) {
                // Reset joystick
                touchJoystick.active = false;
                touchJoystick.identifier = null;
                touchJoystick.dx = 0;
                touchJoystick.dy = 0;
                
                joystickArea.classList.remove('active');
                if (joystickKnob) joystickKnob.style.display = 'none';
                
            } else if (touchFire.active && touch.identifier === touchFire.identifier) {
                // Reset fire button
                touchFire.active = false;
                touchFire.identifier = null;
                fireArea.classList.remove('active');
                
            } else if (touchBomb.active && touch.identifier === touchBomb.identifier) {
                // Reset bomb button
                touchBomb.active = false;
                touchBomb.identifier = null;
                bombArea.classList.remove('active');
            }
        }
    }
    
    // Update joystick visual position
    function updateJoystickVisuals(dx = 0, dy = 0) {
        if (joystickKnob) {
            joystickKnob.style.transform = `translate(-50%, -50%) translate(${dx}px, ${dy}px)`;
        }
    }
    
    // Public API
    return {
        initialize,
        get keys() { return keys; },
        get mouse() { return mouse; },
        get touchJoystick() { return touchJoystick; },
        get touchFire() { return touchFire; },
        get touchBomb() { return touchBomb; }
    };
})();