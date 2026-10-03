export type Lane = -1 | 0 | 1;

export type GameStatus =
  | 'SPLASH'
  | 'MENU'
  | 'PLAYING'
  | 'PAUSED'
  | 'GAME_OVER'
  | 'HOW_TO_PLAY'
  | 'SETTINGS'
  | 'HIGH_SCORES'
  | 'CHARACTERS';

export type ObstacleType =
  | 'CONE'           // Low: jumpable or switch lane
  | 'BARRIER_LOW'    // Low: road hurdle, jumpable or switch lane
  | 'BARRIER_HIGH'   // High: overhead beam/sign, must slide under or switch lane
  | 'CRATE'          // Low/medium: jumpable or switch lane
  | 'CAR';           // Solid vehicle: must switch lane

export type PowerUpType =
  | 'MAGNET'         // Attracts nearby coins
  | 'SHIELD'         // Absorbs 1 hit
  | 'SPEED_BOOST'    // Fast sprint + invincibility
  | 'COIN_MULTIPLIER'; // 2x coins collected

export interface ActivePowerUp {
  type: PowerUpType;
  duration: number;
  maxDuration: number;
}

export interface PlayerState {
  lane: Lane;
  targetLane: Lane;
  x: number;            // Current lane position interpolated (-1 to 1)
  y: number;            // Height above ground (jump)
  vy: number;           // Vertical velocity
  isJumping: boolean;
  isSliding: boolean;
  slideTimer: number;
  slideDuration: number;
  invincibleTimer: number;
  runCycle: number;     // Running animation frame progress (0..1)
  tilt: number;         // Banking roll angle during lane shifts
  trailParticles: { x: number; y: number; z: number; color: string; life: number }[];
}

export interface CoinObject {
  id: string;
  lane: Lane;
  x: number;
  y: number;            // 0 is ground level, higher for jump arcs
  z: number;            // Distance down the track
  collected: boolean;
  magnetized: boolean;
  rotation: number;
}

export interface ObstacleObject {
  id: string;
  type: ObstacleType;
  lane: Lane;
  x: number;
  y: number;
  z: number;
  width: number;
  height: number;
  depth: number;
  color?: string;
  cleared: boolean;
  hit: boolean;
}

export interface PowerUpObject {
  id: string;
  type: PowerUpType;
  lane: Lane;
  x: number;
  y: number;
  z: number;
  collected: boolean;
  rotation: number;
}

export interface Particle {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  color: string;
  size: number;
  alpha: number;
  maxLife: number;
  life: number;
}

export interface FloatingText {
  id: string;
  text: string;
  x: number;
  y: number;
  z: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
}

export interface CharacterSkin {
  id: string;
  name: string;
  tagline: string;
  jacketColor: string;
  pantsColor: string;
  shoesColor: string;
  glowColor: string;
  hairColor: string;
  skinTone: string;
  requiredCoins: number;
}

export interface GameSettings {
  soundEnabled: boolean;
  musicEnabled: boolean;
  soundVolume: number;
  musicVolume: number;
  hapticsEnabled: boolean;
  showOnScreenControls: boolean;
  quality: 'high' | 'medium';
}

export interface GameStats {
  score: number;
  distance: number;
  coins: number;
  speed: number;
  multiplier: number;
  highScore: number;
  bestDistance: number;
  totalCoins: number;
  gamesPlayed: number;
}
