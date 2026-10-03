import { CharacterSkin } from '../game/types';

export const LANE_WIDTH = 2.0; // Distance between lanes in world units
export const LANE_X_POSITIONS = {
  '-1': -LANE_WIDTH,
  '0': 0,
  '1': LANE_WIDTH,
} as const;

export const INITIAL_SPEED = 24.0;
export const MAX_SPEED = 56.0;
export const SPEED_ACCELERATION = 0.22; // Speed increase per 100 meters
export const JUMP_VELOCITY = 13.5;
export const GRAVITY = -34.0;
export const SLIDE_DURATION = 0.85; // Seconds

export const MAGNET_RADIUS = 28.0;
export const MAGNET_PULL_SPEED = 32.0;

export const POWERUP_DURATION = 10.0; // 10 seconds for magnet, speed boost, multiplier
export const BOOST_SPEED_MULTIPLIER = 1.6;

export const TRACK_RENDER_DISTANCE = 140.0; // World units ahead visible

export const DEFAULT_SKINS: CharacterSkin[] = [
  {
    id: 'cyber_dash',
    name: 'Cyber Dash',
    tagline: 'High-tech neon speedster',
    jacketColor: '#06B6D4', // Cyan
    pantsColor: '#0F172A',  // Dark navy
    shoesColor: '#38BDF8',  // Light cyan
    glowColor: '#22D3EE',
    hairColor: '#F43F5E',   // Neon magenta
    skinTone: '#E2E8F0',
    requiredCoins: 0,
  },
  {
    id: 'blaze_runner',
    name: 'Blaze Runner',
    tagline: 'Street urban racer',
    jacketColor: '#EA580C', // Orange
    pantsColor: '#18181B',  // Slate black
    shoesColor: '#F97316',  // Bright orange
    glowColor: '#FB923C',
    hairColor: '#FBBF24',   // Gold blonde
    skinTone: '#FCD34D',
    requiredCoins: 100,
  },
  {
    id: 'shadow_ninja',
    name: 'Shadow Phantom',
    tagline: 'Sleek stealth night runner',
    jacketColor: '#8B5CF6', // Purple
    pantsColor: '#09090B',  // Pure black
    shoesColor: '#A78BFA',  // Lavender glow
    glowColor: '#C084FC',
    hairColor: '#E2E8F0',   // Silver
    skinTone: '#CBD5E1',
    requiredCoins: 250,
  },
];
