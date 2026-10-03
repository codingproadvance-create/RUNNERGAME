import {
  ActivePowerUp,
  CharacterSkin,
  CoinObject,
  FloatingText,
  GameSettings,
  GameStats,
  GameStatus,
  Lane,
  ObstacleObject,
  ObstacleType,
  Particle,
  PlayerState,
  PowerUpObject,
  PowerUpType,
} from './types';
import {
  BOOST_SPEED_MULTIPLIER,
  DEFAULT_SKINS,
  GRAVITY,
  INITIAL_SPEED,
  JUMP_VELOCITY,
  LANE_WIDTH,
  LANE_X_POSITIONS,
  MAGNET_PULL_SPEED,
  MAGNET_RADIUS,
  MAX_SPEED,
  POWERUP_DURATION,
  SLIDE_DURATION,
  SPEED_ACCELERATION,
  TRACK_RENDER_DISTANCE,
} from '../utils/constants';
import { audioManager } from './audio';
import { loadSavedStats, saveGameRunStats, getSelectedSkinId } from '../utils/storage';

export class GameEngine {
  public status: GameStatus = 'SPLASH';
  public player: PlayerState = this.createInitialPlayer();
  public stats: GameStats = this.createInitialStats();
  public selectedSkin: CharacterSkin = DEFAULT_SKINS[0];

  public obstacles: ObstacleObject[] = [];
  public coins: CoinObject[] = [];
  public powerUps: PowerUpObject[] = [];
  public particles: Particle[] = [];
  public floatingTexts: FloatingText[] = [];
  public activePowerUps = new Map<PowerUpType, { duration: number; maxDuration: number }>();

  public shakeIntensity = 0;
  private nextSpawnZ = 20.0;
  private nextPowerUpZ = 65.0;
  private lastTime = 0;
  private animFrameId: number | null = null;
  private onUpdateCallback: ((engine: GameEngine) => void) | null = null;

  constructor() {
    this.refreshStoredStats();
    this.refreshSkin();
  }

  public setOnUpdate(cb: (engine: GameEngine) => void) {
    this.onUpdateCallback = cb;
  }

  public refreshStoredStats() {
    const saved = loadSavedStats();
    this.stats.highScore = saved.highScore;
    this.stats.bestDistance = saved.bestDistance;
    this.stats.totalCoins = saved.totalCoins;
    this.stats.gamesPlayed = saved.gamesPlayed;
  }

  public refreshSkin() {
    const skinId = getSelectedSkinId();
    const found = DEFAULT_SKINS.find((s) => s.id === skinId);
    if (found) this.selectedSkin = found;
  }

  private createInitialPlayer(): PlayerState {
    return {
      lane: 0,
      targetLane: 0,
      x: 0,
      y: 0,
      vy: 0,
      isJumping: false,
      isSliding: false,
      slideTimer: 0,
      slideDuration: SLIDE_DURATION,
      invincibleTimer: 0,
      runCycle: 0,
      tilt: 0,
      trailParticles: [],
    };
  }

  private createInitialStats(): GameStats {
    const saved = loadSavedStats();
    return {
      score: 0,
      distance: 0,
      coins: 0,
      speed: INITIAL_SPEED,
      multiplier: 1,
      highScore: saved.highScore,
      bestDistance: saved.bestDistance,
      totalCoins: saved.totalCoins,
      gamesPlayed: saved.gamesPlayed,
    };
  }

  public startNewGame() {
    this.player = this.createInitialPlayer();
    this.stats.score = 0;
    this.stats.distance = 0;
    this.stats.coins = 0;
    this.stats.speed = INITIAL_SPEED;
    this.stats.multiplier = 1;

    this.obstacles = [];
    this.coins = [];
    this.powerUps = [];
    this.particles = [];
    this.floatingTexts = [];
    this.activePowerUps.clear();
    this.shakeIntensity = 0;

    this.nextSpawnZ = 25.0;
    this.nextPowerUpZ = 75.0;
    this.status = 'PLAYING';

    audioManager.startMusic();
    this.lastTime = performance.now();
    this.startLoop();
  }

  public pauseGame() {
    if (this.status === 'PLAYING') {
      this.status = 'PAUSED';
      audioManager.stopMusic();
    }
  }

  public resumeGame() {
    if (this.status === 'PAUSED') {
      this.status = 'PLAYING';
      this.lastTime = performance.now();
      audioManager.startMusic();
      this.startLoop();
    }
  }

  public stopLoop() {
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }

  private startLoop() {
    this.stopLoop();
    const loop = (now: number) => {
      if (this.status !== 'PLAYING') return;

      const dt = Math.min((now - this.lastTime) / 1000, 0.08); // cap dt to prevent huge jumps
      this.lastTime = now;

      this.update(dt);
      if (this.onUpdateCallback) {
        this.onUpdateCallback(this);
      }

      this.animFrameId = requestAnimationFrame(loop);
    };
    this.animFrameId = requestAnimationFrame(loop);
  }

  // --- CONTROLS ---

  public moveLeft() {
    if (this.status !== 'PLAYING') return;
    if (this.player.targetLane > -1) {
      this.player.targetLane = (this.player.targetLane - 1) as Lane;
      audioManager.playLaneSwitch();
      audioManager.triggerHaptic(15);
    }
  }

  public moveRight() {
    if (this.status !== 'PLAYING') return;
    if (this.player.targetLane < 1) {
      this.player.targetLane = (this.player.targetLane + 1) as Lane;
      audioManager.playLaneSwitch();
      audioManager.triggerHaptic(15);
    }
  }

  public jump() {
    if (this.status !== 'PLAYING') return;
    if (!this.player.isJumping) {
      this.player.isJumping = true;
      this.player.vy = JUMP_VELOCITY;
      this.player.isSliding = false;
      this.player.slideTimer = 0;
      audioManager.playJump();
      audioManager.triggerHaptic(20);
    }
  }

  public slide() {
    if (this.status !== 'PLAYING') return;
    this.player.isSliding = true;
    this.player.slideTimer = this.player.slideDuration;

    // If mid-air, fast dive to ground
    if (this.player.isJumping) {
      this.player.vy = -28.0;
    }

    audioManager.playSlide();
    audioManager.triggerHaptic(20);

    // Spawn dust particles on slide
    for (let i = 0; i < 8; i++) {
      this.particles.push({
        x: this.player.x + (Math.random() - 0.5) * 0.4,
        y: 0.1,
        z: (Math.random() - 0.5) * 0.4,
        vx: (Math.random() - 0.5) * 2,
        vy: Math.random() * 2 + 1,
        vz: -this.stats.speed * 0.2,
        color: '#94A3B8',
        size: 3,
        alpha: 0.8,
        maxLife: 0.4,
        life: 0.4,
      });
    }
  }

  // --- UPDATE GAME LOOP ---

  public update(dt: number) {
    if (this.status !== 'PLAYING') return;

    // 1. UPDATE POWER-UPS & MULTIPLIERS
    let currentSpeed = this.stats.speed;
    const isBoostActive = this.activePowerUps.has('SPEED_BOOST');
    if (isBoostActive) {
      currentSpeed *= BOOST_SPEED_MULTIPLIER;
    }

    // Progress active power-ups
    for (const [type, data] of Array.from(this.activePowerUps.entries())) {
      data.duration -= dt;
      if (data.duration <= 0) {
        this.activePowerUps.delete(type);
      }
    }

    this.stats.multiplier = this.activePowerUps.has('COIN_MULTIPLIER') ? 2 : 1;

    // 2. SPEED & DISTANCE PROGRESSION
    const frameDistance = currentSpeed * dt;
    this.stats.distance += frameDistance;
    this.stats.score += frameDistance * 1.5 * this.stats.multiplier;

    // Difficulty ramp: speed smoothly increases as distance increases
    this.stats.speed = Math.min(MAX_SPEED, INITIAL_SPEED + (this.stats.distance / 100) * SPEED_ACCELERATION);

    // 3. PLAYER MOVEMENT & PHYSICS
    // Smooth lane interpolation
    const targetX = LANE_X_POSITIONS[this.player.targetLane];
    const dx = targetX - this.player.x;
    this.player.x += dx * Math.min(1.0, dt * 14); // snappy 14x lerp
    this.player.lane = Math.round(this.player.x / LANE_WIDTH) as Lane;

    // Bank tilt during lane transitions
    this.player.tilt = -dx * 0.25;

    // Jump physics
    if (this.player.isJumping) {
      this.player.y += this.player.vy * dt;
      this.player.vy += GRAVITY * dt;

      if (this.player.y <= 0) {
        this.player.y = 0;
        this.player.vy = 0;
        this.player.isJumping = false;

        // Landing dust particles
        for (let i = 0; i < 6; i++) {
          this.particles.push({
            x: this.player.x + (Math.random() - 0.5) * 0.6,
            y: 0.05,
            z: 0,
            vx: (Math.random() - 0.5) * 3,
            vy: Math.random() * 1.5,
            vz: -currentSpeed * 0.15,
            color: '#CBD5E1',
            size: 2.5,
            alpha: 0.6,
            maxLife: 0.3,
            life: 0.3,
          });
        }
      }
    }

    // Slide timer
    if (this.player.isSliding) {
      this.player.slideTimer -= dt;
      if (this.player.slideTimer <= 0) {
        this.player.isSliding = false;
        this.player.slideTimer = 0;
      }
    }

    // Invincible timer
    if (this.player.invincibleTimer > 0) {
      this.player.invincibleTimer -= dt;
    }

    // Running animation phase
    this.player.runCycle = (this.player.runCycle + dt * (currentSpeed * 0.25)) % 1;

    // Screen shake decay
    if (this.shakeIntensity > 0) {
      this.shakeIntensity = Math.max(0, this.shakeIntensity - dt * 4.5);
    }

    // 4. ENTITY TRACK TRANSLATION (Entities move towards player at currentSpeed)
    for (const obs of this.obstacles) {
      obs.z -= frameDistance;
    }
    for (const coin of this.coins) {
      coin.z -= frameDistance;
      coin.rotation += dt * 5.0;
    }
    for (const pow of this.powerUps) {
      pow.z -= frameDistance;
      pow.rotation += dt * 3.0;
    }

    // 5. MAGNET ATTRACTION
    const isMagnetActive = this.activePowerUps.has('MAGNET');
    if (isMagnetActive) {
      for (const coin of this.coins) {
        if (!coin.collected && coin.z > 0 && coin.z < MAGNET_RADIUS) {
          coin.magnetized = true;
          // Pull coin towards player position
          const pullZ = MAGNET_PULL_SPEED * dt;
          coin.z -= pullZ;
          const pullX = (this.player.x - coin.x) * dt * 9;
          coin.x += pullX;
          const pullY = (this.player.y + 0.4 - coin.y) * dt * 9;
          coin.y += pullY;
        }
      }
    }

    // 6. COLLISIONS & COLLECTIONS
    this.handleCollisions();

    // 7. CLEAN UP PASSED OBJECTS
    this.obstacles = this.obstacles.filter((o) => o.z > -6);
    this.coins = this.coins.filter((c) => !c.collected && c.z > -6);
    this.powerUps = this.powerUps.filter((p) => !p.collected && p.z > -6);

    // 8. PROCEDURAL SPAWNERS
    this.nextSpawnZ -= frameDistance;
    if (this.nextSpawnZ < TRACK_RENDER_DISTANCE) {
      this.spawnTrackSection();
    }

    this.nextPowerUpZ -= frameDistance;
    if (this.nextPowerUpZ < TRACK_RENDER_DISTANCE) {
      this.spawnPowerUp();
      this.nextPowerUpZ = TRACK_RENDER_DISTANCE + 80 + Math.random() * 50;
    }

    // 9. PARTICLES & FLOATING TEXTS UPDATE
    for (const p of this.particles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.z += p.vz * dt;
      p.life -= dt;
    }
    this.particles = this.particles.filter((p) => p.life > 0);

    for (const ft of this.floatingTexts) {
      ft.y += dt * 1.5;
      ft.life -= dt;
    }
    this.floatingTexts = this.floatingTexts.filter((ft) => ft.life > 0);
  }

  // --- COLLISION RESOLUTION ---
  private handleCollisions() {
    const isBoostActive = this.activePowerUps.has('SPEED_BOOST');
    const playerZMin = -0.5;
    const playerZMax = 1.0;
    const playerWidth = 0.85;

    // --- COINS ---
    for (const coin of this.coins) {
      if (coin.collected) continue;
      if (coin.z >= playerZMin && coin.z <= playerZMax) {
        const dx = Math.abs(this.player.x - coin.x);
        const dy = Math.abs(this.player.y - coin.y);

        if (dx < playerWidth * 0.9 && dy < 1.3) {
          // Collect coin!
          coin.collected = true;
          const coinVal = 1 * this.stats.multiplier;
          this.stats.coins += coinVal;
          this.stats.score += 25 * this.stats.multiplier;

          audioManager.playCoin();
          audioManager.triggerHaptic(10);

          // Coin spark particles
          for (let i = 0; i < 6; i++) {
            this.particles.push({
              x: coin.x,
              y: coin.y + 0.4,
              z: 0,
              vx: (Math.random() - 0.5) * 4,
              vy: Math.random() * 4 + 1,
              vz: (Math.random() - 0.5) * 4,
              color: '#FBBF24',
              size: 3,
              alpha: 0.9,
              maxLife: 0.4,
              life: 0.4,
            });
          }

          // Floating score text
          this.floatingTexts.push({
            id: Math.random().toString(),
            text: this.stats.multiplier > 1 ? `+${coinVal} (2X)` : `+${coinVal}`,
            x: coin.x,
            y: coin.y + 0.8,
            z: 0,
            color: '#FBBF24',
            alpha: 1.0,
            life: 0.5,
            maxLife: 0.5,
          });
        }
      }
    }

    // --- POWER-UPS ---
    for (const pow of this.powerUps) {
      if (pow.collected) continue;
      if (pow.z >= playerZMin && pow.z <= playerZMax) {
        const dx = Math.abs(this.player.x - pow.x);
        if (dx < playerWidth) {
          pow.collected = true;
          this.activePowerUps.set(pow.type, {
            duration: POWERUP_DURATION,
            maxDuration: POWERUP_DURATION,
          });

          audioManager.playPowerUp();
          audioManager.triggerHaptic(40);

          let label = 'POWER-UP!';
          let color = '#38BDF8';
          if (pow.type === 'MAGNET') {
            label = 'MAGNET!';
            color = '#EF4444';
          } else if (pow.type === 'SHIELD') {
            label = 'SHIELD ACTIVE!';
            color = '#06B6D4';
          } else if (pow.type === 'SPEED_BOOST') {
            label = 'SPEED BOOST!';
            color = '#F97316';
          } else if (pow.type === 'COIN_MULTIPLIER') {
            label = '2X COINS!';
            color = '#10B981';
          }

          this.floatingTexts.push({
            id: Math.random().toString(),
            text: label,
            x: this.player.x,
            y: this.player.y + 1.6,
            z: 0,
            color,
            alpha: 1.0,
            life: 1.0,
            maxLife: 1.0,
          });
        }
      }
    }

    // --- OBSTACLES ---
    for (const obs of this.obstacles) {
      if (obs.hit) continue;
      if (obs.z >= playerZMin && obs.z <= playerZMax) {
        const dx = Math.abs(this.player.x - obs.x);
        const hitWidth = (playerWidth + obs.width) * 0.42;

        if (dx < hitWidth) {
          // If Speed Boost is active, smash through obstacle safely!
          if (isBoostActive) {
            obs.hit = true;
            this.shakeIntensity = 0.3;
            audioManager.playShieldHit();
            this.spawnShatterParticles(obs.x, obs.y + 0.5);
            continue;
          }

          // Evaluate clearance based on obstacle type
          let collisionAvoided = false;

          if (obs.type === 'CONE' || obs.type === 'BARRIER_LOW' || obs.type === 'CRATE') {
            // Can jump over low obstacles!
            if (this.player.isJumping && this.player.y > 0.65) {
              collisionAvoided = true;
            }
          } else if (obs.type === 'BARRIER_HIGH') {
            // Must slide under high overhead obstacle!
            if (this.player.isSliding) {
              collisionAvoided = true;
            }
          }

          if (collisionAvoided) {
            obs.cleared = true;
            continue;
          }

          // Collision detected!
          if (this.player.invincibleTimer > 0) {
            // In grace period, ignore
            continue;
          }

          // Check if SHIELD is available
          if (this.activePowerUps.has('SHIELD')) {
            obs.hit = true;
            this.activePowerUps.delete('SHIELD');
            this.player.invincibleTimer = 1.4; // 1.4s grace period
            this.shakeIntensity = 0.55;
            audioManager.playShieldHit();
            audioManager.triggerHaptic(50);

            this.spawnShatterParticles(this.player.x, this.player.y + 1.0);

            this.floatingTexts.push({
              id: Math.random().toString(),
              text: 'SHIELD SAVED YOU!',
              x: this.player.x,
              y: this.player.y + 1.8,
              z: 0,
              color: '#06B6D4',
              alpha: 1.0,
              life: 1.2,
              maxLife: 1.2,
            });
            continue;
          }

          // FATAL CRASH -> GAME OVER!
          this.gameOver();
          return;
        }
      }
    }
  }

  private spawnShatterParticles(x: number, y: number) {
    for (let i = 0; i < 18; i++) {
      this.particles.push({
        x,
        y,
        z: 0,
        vx: (Math.random() - 0.5) * 8,
        vy: Math.random() * 6 + 1,
        vz: (Math.random() - 0.5) * 6,
        color: i % 2 === 0 ? '#38BDF8' : '#F59E0B',
        size: 3.5,
        alpha: 1.0,
        maxLife: 0.6,
        life: 0.6,
      });
    }
  }

  private gameOver() {
    this.status = 'GAME_OVER';
    this.stopLoop();
    audioManager.stopMusic();
    audioManager.playCrash();
    audioManager.triggerHaptic(80);
    this.shakeIntensity = 0.9;

    this.spawnShatterParticles(this.player.x, this.player.y + 1.0);

    // Save run stats to localStorage
    const saved = saveGameRunStats(this.stats.score, this.stats.distance, this.stats.coins);
    this.stats.highScore = saved.highScore;
    this.stats.bestDistance = saved.bestDistance;
    this.stats.totalCoins = saved.totalCoins;
    this.stats.gamesPlayed = saved.gamesPlayed;

    if (this.onUpdateCallback) {
      this.onUpdateCallback(this);
    }
  }

  // --- PROCEDURAL SPAWNER PATTERNS ---
  private spawnTrackSection() {
    const lanes: Lane[] = [-1, 0, 1];
    const spawnZ = this.nextSpawnZ;

    // Pick a fair pattern based on current distance/difficulty
    const dist = this.stats.distance;
    const patternType = Math.floor(Math.random() * 6);

    if (patternType === 0) {
      // Single obstacle + straight coin line
      const obsLane = lanes[Math.floor(Math.random() * lanes.length)];
      const coinLane = lanes.filter((l) => l !== obsLane)[Math.floor(Math.random() * 2)];

      this.addObstacle(obsLane, spawnZ, this.randomObstacleType(dist));
      this.addCoinLine(coinLane, spawnZ - 6, 6, 0);
    } else if (patternType === 1) {
      // Low barrier with JUMP ARC of coins! (Rewarding the jump!)
      const lane = lanes[Math.floor(Math.random() * lanes.length)];
      this.addObstacle(lane, spawnZ, 'BARRIER_LOW');
      this.addCoinJumpArc(lane, spawnZ - 4);
    } else if (patternType === 2) {
      // High barrier with SLIDE row of coins!
      const lane = lanes[Math.floor(Math.random() * lanes.length)];
      this.addObstacle(lane, spawnZ, 'BARRIER_HIGH');
      this.addCoinSlideRow(lane, spawnZ - 4);
    } else if (patternType === 3) {
      // 2 Obstacles blocking 2 lanes, leaving 1 safe lane or jumpable lane
      const safeLane = lanes[Math.floor(Math.random() * lanes.length)];
      const blockedLanes = lanes.filter((l) => l !== safeLane);

      this.addObstacle(blockedLanes[0], spawnZ, 'CAR');
      this.addObstacle(blockedLanes[1], spawnZ, Math.random() > 0.5 ? 'BARRIER_LOW' : 'CONE');

      // Coins in safe lane
      this.addCoinLine(safeLane, spawnZ - 4, 5, 0);
    } else if (patternType === 4) {
      // Zigzag coins across lanes
      this.addCoinZigZag(spawnZ - 5);
      // Put obstacle in one lane afterwards
      const obsLane = lanes[Math.floor(Math.random() * lanes.length)];
      this.addObstacle(obsLane, spawnZ + 8, 'CONE');
    } else {
      // Crate cluster with side coins
      const lane = lanes[Math.floor(Math.random() * lanes.length)];
      this.addObstacle(lane, spawnZ, 'CRATE');
      const sideLane = lane === 0 ? (Math.random() > 0.5 ? -1 : 1) : 0;
      this.addCoinLine(sideLane, spawnZ - 4, 6, 0);
    }

    // Minimum gap between obstacle groups smoothly decreases as player gets faster
    const minGap = Math.max(16.0, 26.0 - (dist / 1200) * 8.0);
    this.nextSpawnZ += minGap + Math.random() * 8.0;
  }

  private randomObstacleType(dist: number): ObstacleType {
    const roll = Math.random();
    if (dist < 150) {
      return roll < 0.6 ? 'CONE' : 'BARRIER_LOW';
    }
    if (dist < 400) {
      if (roll < 0.4) return 'CONE';
      if (roll < 0.7) return 'BARRIER_LOW';
      return 'BARRIER_HIGH';
    }
    // High distance: all types possible including cars and crates
    if (roll < 0.25) return 'CONE';
    if (roll < 0.5) return 'BARRIER_LOW';
    if (roll < 0.75) return 'BARRIER_HIGH';
    if (roll < 0.9) return 'CRATE';
    return 'CAR';
  }

  private addObstacle(lane: Lane, z: number, type: ObstacleType) {
    let width = 1.3;
    let height = 1.2;
    let depth = 1.0;
    let color: string | undefined;

    if (type === 'CONE') {
      width = 0.8;
      height = 0.9;
    } else if (type === 'BARRIER_LOW') {
      width = 1.4;
      height = 1.1;
    } else if (type === 'BARRIER_HIGH') {
      width = 1.6;
      height = 2.4;
    } else if (type === 'CRATE') {
      width = 1.2;
      height = 1.2;
    } else if (type === 'CAR') {
      width = 1.6;
      height = 1.4;
      depth = 2.4;
      const carColors = ['#DC2626', '#2563EB', '#D97706', '#9333EA'];
      color = carColors[Math.floor(Math.random() * carColors.length)];
    }

    this.obstacles.push({
      id: Math.random().toString(),
      type,
      lane,
      x: LANE_X_POSITIONS[lane],
      y: 0,
      z,
      width,
      height,
      depth,
      color,
      cleared: false,
      hit: false,
    });
  }

  private addCoinLine(lane: Lane, startZ: number, count: number, y = 0) {
    const step = 2.2;
    for (let i = 0; i < count; i++) {
      this.coins.push({
        id: Math.random().toString(),
        lane,
        x: LANE_X_POSITIONS[lane],
        y,
        z: startZ + i * step,
        collected: false,
        magnetized: false,
        rotation: Math.random() * Math.PI,
      });
    }
  }

  private addCoinJumpArc(lane: Lane, startZ: number) {
    const count = 5;
    const step = 2.2;
    for (let i = 0; i < count; i++) {
      // Parabolic jump arc height
      const t = (i / (count - 1)) * 2 - 1; // -1 to 1
      const y = Math.max(0, (1 - t * t) * 1.5 + 0.2);

      this.coins.push({
        id: Math.random().toString(),
        lane,
        x: LANE_X_POSITIONS[lane],
        y,
        z: startZ + i * step,
        collected: false,
        magnetized: false,
        rotation: i * 0.4,
      });
    }
  }

  private addCoinSlideRow(lane: Lane, startZ: number) {
    const count = 5;
    const step = 2.0;
    for (let i = 0; i < count; i++) {
      this.coins.push({
        id: Math.random().toString(),
        lane,
        x: LANE_X_POSITIONS[lane],
        y: 0,
        z: startZ + i * step,
        collected: false,
        magnetized: false,
        rotation: i * 0.3,
      });
    }
  }

  private addCoinZigZag(startZ: number) {
    const lanes: Lane[] = [-1, 0, 1, 0, -1, 0, 1];
    const step = 2.4;
    lanes.forEach((lane, i) => {
      this.coins.push({
        id: Math.random().toString(),
        lane,
        x: LANE_X_POSITIONS[lane],
        y: 0,
        z: startZ + i * step,
        collected: false,
        magnetized: false,
        rotation: i * 0.5,
      });
    });
  }

  private spawnPowerUp() {
    const lanes: Lane[] = [-1, 0, 1];
    const lane = lanes[Math.floor(Math.random() * lanes.length)];
    const types: PowerUpType[] = ['MAGNET', 'SHIELD', 'SPEED_BOOST', 'COIN_MULTIPLIER'];
    const type = types[Math.floor(Math.random() * types.length)];

    this.powerUps.push({
      id: Math.random().toString(),
      type,
      lane,
      x: LANE_X_POSITIONS[lane],
      y: 0.6,
      z: TRACK_RENDER_DISTANCE,
      collected: false,
      rotation: 0,
    });
  }
}
