/**
 * Game Configuration
 * Contains all constants and configuration settings for the game
 */

const GAME_CONFIG = {
    // Game physics and timing
    MAX_DELTA_TIME: 0.1,
    BASE_SPEED_MULTIPLIER: 60,
    LEVEL_TRANSITION_DELAY: 1000,
    INVULNERABILITY_DURATION: 1000,
    ENEMY_HIT_ANIM_DURATION: 150,
    
    // Touch controls
    // JOYSTICK_MAX_RADIUS: 40,
    
    // Player settings
    SLOW_CHARGE_DURATION: 1000,
    MULTIPLIER_DECAY_DELAY: 2000,
    MULTIPLIER_DECAY_RATE: 0.5,
    MAX_MULTIPLIER: 10.0,
    STARTING_BOMBS: 3,  // Reduced for easier play
    BOMB_COOLDOWN: 500,
    DASH_DISTANCE: 100,         // Distance of dash in pixels
    DASH_DURATION: 150,         // Duration of dash animation in ms
    DASH_COOLDOWN: 2000,        // Cooldown between dashes in ms
    DASH_INVULNERABILITY: 500,  // Invulnerability duration after dash in ms
    
    // Items and powerups
    FRAGMENT_LIFETIME: 8000,
    POWERUP_LIFETIME: 7000,  // Reduced powerup lifetime
    ITEM_FADE_START_TIME: 1500,
    
    // Player abilities
    MAGNET_RADIUS: 80,
    MAGNET_STRENGTH: 150,
    
    // Homing missile settings
    HOMING_FIRE_RATE: 400,         // ms between homing missile shots
    HOMING_TURN_RATE: Math.PI * 2.5, // Radians per second turn rate
    HOMING_ACQUIRE_RANGE: 300,     // Max distance to look for target
    HOMING_MISSILE_SPEED: 6,
    HOMING_MISSILE_DAMAGE: 8,      // Slightly less than base
    
    // Object pools
    MAX_PROJECTILES: 150,     // Increased for homing missiles
    MAX_ENEMY_PROJECTILES: 150,
    MAX_PARTICLES: 500,
    MAX_FRAGMENTS: 150,
    MAX_TOTAL_ENEMIES: 20,
    
    // Enemy projectile colors
    ENEMY_PROJECTILE_COLOR: "#ff0000",  // Fixed red color for all enemy projectiles

    // Background settings
        BACKGROUND_TEXTURE_OPACITY: 0.3,
        USE_STARFIELD: true
};

// Enemy type definitions
const ENEMY_TYPES = {
    debtCollector: { 
        name: "Debt Collector", 
        radius: 15, 
        speed: 2.4, 
        health: 35, 
        damage: 1, 
        color: "#e74c3c", 
        value: 5, 
        special: "lunge", 
        aggressionFactor: 0.95, 
        lungeTriggerRange: 50, 
        lungeSpeedMult: 2.5, 
        lungeDuration: 200, 
        lungeCooldown: 4000, 
        lungeTelegraphDuration: 300, 
        fragmentCount: 2, 
        isBoss: false 
    },
    interestCompounder: { 
        name: "Interest Compounder", 
        radius: 12, 
        speed: 3.2, 
        health: 25, 
        damage: 1, 
        color: "#9b59b6", 
        value: 10, 
        special: "multiply", 
        aggressionFactor: 0.85, 
        multiplyCooldown: 3000, 
        multiplyChance: 0.05, 
        maxOffpsring: 2,
        fragmentCount: 3, 
        isBoss: false 
    },
    loanShark: { 
        name: "Loan Shark", 
        radius: 20, 
        speed: 2.0, 
        health: 60, 
        damage: 1, 
        color: "#2980b9", 
        value: 15, 
        special: "slowField", 
        aggressionFactor: 0.98, 
        slowRadius: 70, 
        slowAmount: 0.65, 
        slowDuration: 3000, 
        slowCooldown: 8000, 
        activationRange: 120, 
        slowChargeDuration: 1000, 
        fragmentCount: 4, 
        isBoss: false 
    },
    bossCreditor: { 
        name: "The Creditor", 
        radius: 40, 
        speed: 1.3, 
        health: 250, 
        damage: 2, 
        color: "#f39c12", 
        value: 50, 
        special: "multishoot", 
        fireRate: 3500, 
        burstCount: 8, 
        burstWaves: 3, 
        burstDelay: 200, 
        projectileSpeed: 5.5, 
        projectileColor: "#f39c12", 
        summonCooldown: 5000, 
        aggressionFactor: 0.9, 
        fragmentCount: 15, 
        isBoss: true 
    },
    assetSeizer: { 
        name: "Asset Seizer", 
        radius: 18, 
        speed: 2.2, 
        health: 45, 
        damage: 1, 
        color: "#d35400", 
        value: 15, 
        special: "nullify", 
        aggressionFactor: 0.85, 
        nullifyCooldown: 5000, 
        nullifyRange: 120, 
        nullifyDuration: 3000, 
        fragmentCount: 4, 
        isBoss: false 
    },
    debtSniper: { 
        name: "Debt Sniper", 
        radius: 14, 
        speed: 1.8, 
        health: 30, 
        damage: 1, 
        color: "#16a085", 
        value: 12, 
        special: "shoot", 
        fireRate: 2200, 
        projectileSpeed: 5, 
        projectileColor: "#1abc9c", 
        repositionCooldown: 3000, 
        fleeDistance: 100, 
        minDistance: 150, 
        maxDistance: 250, 
        avoidOthersDistance: 80, 
        aggressionFactor: 0.6, 
        fragmentCount: 3, 
        isBoss: false 
    },
    bankruptcyAgent: { 
        name: "Bankruptcy Agent", 
        radius: 16, 
        speed: 2.4, 
        health: 40, 
        damage: 1, 
        color: "#8e44ad", 
        value: 18, 
        special: "explodeBurst", 
        explosionBurstCount: 8,
        explosionBurstSpeed: 5,
        explosionBurstColor: "#e74c3c",
        explosionRadius: 70,
        explosionDamage: 2,
        aggressionFactor: 0.9, 
        fragmentCount: 5, 
        isBoss: false 
    },
    hedgeFund: { 
        name: "Hedge Fund", 
        radius: 20,
        speed: 2.0,
        health: 50,
        damage: 2,
        color: "#00ccff",
        value: 25, 
        special: "rangedShoot",
        fireRate: 2000,
        projectileSpeed: 6,
        projectileColor: "#ff0000",
        repositionCooldown: 3000,
        fleeDistance: 100,
        minDistance: 150,
        maxDistance: 250,
        avoidOthersDistance: 80,
        aggressionFactor: 0.6,
        fragmentCount: 4,
        isBoss: false 
    }
};

// Power-up type definitions
const POWERUP_TYPES = {
    healthPack: { 
        name: "Health Pack", 
        radius: 8, 
        color: "#e74c3c", 
        duration: 0, 
        rarity: 0.3
    },
    rapidFire: { 
        name: "Rapid Fire", 
        radius: 8, 
        color: "#f1c40f", 
        duration: 8000, 
        rarity: 0.25
    },
    doubleDamage: { 
        name: "Double Damage", 
        radius: 8, 
        color: "#9b59b6", 
        duration: 10000, 
        rarity: 0.25
    },
    speedBoost: { 
        name: "Speed Boost", 
        radius: 8, 
        color: "#2ecc71", 
        duration: 8000, 
        rarity: 0.25
    },
    spreadShot: { 
        name: "Spread Shot", 
        radius: 8, 
        color: "#3498db", 
        duration: 8000, 
        rarity: 0.2
    },
    piercingShot: { 
        name: "Piercing Shot", 
        radius: 8, 
        color: "#e67e22", 
        duration: 6000, 
        rarity: 0.15
    },
    homingMissile: { 
        name: "Homing Missile", 
        radius: 8, 
        color: "#1abc9c", 
        duration: 10000, 
        rarity: 0.18
    }
};

// Background star configuration
const STAR_LAYERS = [ 
    { speed: 10, radius: 0.6, count: 80, alpha: 0.3 }, 
    { speed: 18, radius: 0.8, count: 50, alpha: 0.4 }, 
    { speed: 28, radius: 1.1, count: 15, alpha: 0.6 } 
];