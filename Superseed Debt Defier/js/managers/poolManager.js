/**
 * PoolManager
 * Handles object pools for efficient reuse of game objects
 */
const PoolManager = (() => {
    // Private object pools
    const pools = {
      projectiles: [],
      enemyProjectiles: [],
      particles: [],
      fragments: []
    };
  
    // A flag to ensure pool exhaustion warnings are only logged once per pool per occurrence
    const exhaustionLogged = {};
  
    // Initialize object pools
    function initialize() {
      console.log("Initializing object pools...");
  
      pools.projectiles = Array.from(
        { length: GAME_CONFIG.MAX_PROJECTILES },
        () => new Projectile()
      );
  
      pools.enemyProjectiles = Array.from(
        { length: GAME_CONFIG.MAX_ENEMY_PROJECTILES },
        () => new Projectile()
      );
  
      pools.particles = Array.from(
        { length: GAME_CONFIG.MAX_PARTICLES },
        () => new Particle()
      );
  
      pools.fragments = Array.from(
        { length: GAME_CONFIG.MAX_FRAGMENTS },
        () => new Fragment()
      );
  
      console.log(
        `Object pools initialized: Projectiles=${pools.projectiles.length}, EnemyProjectiles=${pools.enemyProjectiles.length}`
      );
  
      // Reset exhaustion flags
      for (let poolName in pools) {
        exhaustionLogged[poolName] = false;
      }
    }
  
    // Get an available object from a specific pool
    function get(poolName) {
      const pool = pools[poolName];
      if (!pool) {
        console.error(`Pool '${poolName}' does not exist!`);
        return null;
      }
  
      for (let i = 0; i < pool.length; i++) {
        if (!pool[i].active) {
          return pool[i];
        }
      }
  
      // Log exhaustion warning once per occurrence for the pool
      if (!exhaustionLogged[poolName]) {
        console.warn(`Pool exhausted: ${poolName}`);
        exhaustionLogged[poolName] = true;
      }
      return null;
    }
  
    // Release an object back to its pool
    function release(object) {
      if (object && typeof object.reset === 'function') {
        object.reset();
        // No repetitive log on release now
      } else {
        console.warn("Attempted to release invalid object", object);
      }
    }
  
    // Reset all objects in all pools
    function resetAll() {
      let totalReset = 0;
  
      for (const poolName in pools) {
        const pool = pools[poolName];
        let poolReset = 0;
  
        for (let i = 0; i < pool.length; i++) {
          if (pool[i].active) {
            pool[i].reset();
            poolReset++;
            totalReset++;
          }
        }
  
        console.log(`Reset ${poolReset} objects in ${poolName} pool`);
        // Reset exhaustion flag for each pool after a reset
        exhaustionLogged[poolName] = false;
      }
  
      console.log(`Total objects reset: ${totalReset}`);
    }
  
    // Get all active objects from a specific pool
    function getActive(poolName) {
      const pool = pools[poolName];
      if (!pool) {
        console.error(`Pool '${poolName}' does not exist!`);
        return [];
      }
  
      return pool.filter(obj => obj.active);
    }
  
    // Update all active objects in a specific pool
    function updatePool(poolName, dt) {
      const pool = pools[poolName];
      if (!pool) {
        console.error(`Pool '${poolName}' does not exist!`);
        return;
      }
  
      let activeCount = 0;
      for (let i = 0; i < pool.length; i++) {
        if (pool[i].active) {
          pool[i].update(dt);
          activeCount++;
        }
      }
      // Removed frequent logging of active count
    }
  
    // Draw all active objects in a specific pool
    function drawPool(poolName, ctx) {
      const pool = pools[poolName];
      if (!pool) {
        console.error(`Pool '${poolName}' does not exist!`);
        return;
      }
  
      for (let i = 0; i < pool.length; i++) {
        if (pool[i].active) {
          pool[i].draw(ctx);
        }
      }
    }
  
    // Public API
    return {
      initialize,
      get,
      release,
      resetAll,
      getActive,
      updatePool,
      drawPool
    };
  })();
  