// js/managers/audioManager.js

const AudioManager = (() => {
    const sounds = {};
    let music = null;
  
    // Sound file mapping
    const soundFiles = {
      shoot: 'assets/sounds/pop.ogg',
    //  shootenemy: 'assets/sounds/shoot.ogg',
    //  explosion: 'assets/sounds/explosion.wav',
      powerup: 'assets/sounds/powerup.wav',
      hit: 'assets/sounds/hit.mp3',
    //  gameOver: 'assets/sounds/game-over.mp3',
      fragmentCollect: 'assets/sounds/Coin01.ogg',
    //  dash: 'assets/sounds/dash.wav',
      bgMusic: 'assets/sounds/battle.mp3', // background music
    };
  
    const loadSounds = () => {
      for (const [key, path] of Object.entries(soundFiles)) {
        const audio = new Audio(path);
        audio.preload = 'auto';
  
        if (key === 'bgMusic') {
          music = audio;
          music.loop = true;
          music.volume = 0.3; // set your desired music volume
        } else {
          sounds[key] = audio;
        }
      }
    };
  
    const playSound = (soundKey, volume = 0.5) => {
      const sound = sounds[soundKey];
      if (sound) {
        const clone = sound.cloneNode(); // Allows overlapping playback
        clone.volume = volume;
        clone.play().catch((e) => {
          console.warn(`Sound '${soundKey}' failed to play:`, e);
        });
      }
    };
  
    const playMusic = () => {
      if (music) {
        music.play().catch((e) => {
          console.warn("Music autoplay blocked by browser:", e);
        });
      }
    };
  
    const pauseMusic = () => {
      if (music) {
        music.pause();
      }
    };
  
    const toggleMusic = () => {
      if (!music) return;
      music.paused ? music.play() : music.pause();
    };
  
    return {
      loadSounds,
      playSound,
      playMusic,
      pauseMusic,
      toggleMusic
    };
  })();

  
  