import {
  CoinObject,
  FloatingText,
  ObstacleObject,
  Particle,
  PlayerState,
  PowerUpObject,
  PowerUpType,
  CharacterSkin,
} from './types';
import { LANE_WIDTH, TRACK_RENDER_DISTANCE } from '../utils/constants';

export class GameRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private width = 0;
  private height = 0;
  private horizonY = 0;
  private focalLength = 320;
  private camHeight = 2.4;
  private camZ = -3.8;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const context = canvas.getContext('2d', { alpha: false });
    if (!context) throw new Error('Could not get 2D context');
    this.ctx = context;
    this.resize();
  }

  public resize() {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2); // Cap at 2 for mobile battery & high FPS
    this.width = Math.floor(rect.width * dpr);
    this.height = Math.floor(rect.height * dpr);

    if (this.canvas.width !== this.width || this.canvas.height !== this.height) {
      this.canvas.width = this.width;
      this.canvas.height = this.height;
    }

    this.horizonY = this.height * 0.38;
    this.focalLength = this.width * 0.72;
  }

  // 3D Perspective Projection to 2D Screen
  private project(x: number, y: number, z: number, camX: number): { x: number; y: number; scale: number; visible: boolean } {
    const relZ = z - this.camZ;
    if (relZ <= 0.2) {
      return { x: 0, y: 0, scale: 0, visible: false };
    }

    const scale = this.focalLength / relZ;
    const projX = this.width / 2 + (x - camX) * scale;
    const projY = this.horizonY + (this.camHeight - y) * scale;

    const visible =
      relZ < TRACK_RENDER_DISTANCE &&
      projX > -this.width * 0.5 &&
      projX < this.width * 1.5 &&
      projY > -this.height * 0.2 &&
      projY < this.height * 1.5;

    return { x: projX, y: projY, scale, visible };
  }

  public render(
    player: PlayerState,
    skin: CharacterSkin,
    obstacles: ObstacleObject[],
    coins: CoinObject[],
    powerUps: PowerUpObject[],
    particles: Particle[],
    floatingTexts: FloatingText[],
    activePowerUps: Map<PowerUpType, { duration: number; maxDuration: number }>,
    distance: number,
    shakeIntensity: number
  ) {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    // Apply Screen Shake if any
    ctx.save();
    if (shakeIntensity > 0) {
      const sx = (Math.random() - 0.5) * shakeIntensity * 14;
      const sy = (Math.random() - 0.5) * shakeIntensity * 14;
      ctx.translate(sx, sy);
    }

    const camX = player.x * 0.35;

    // 1. SKY & DISTANT HORIZON
    this.drawSky(w, h, camX, distance);

    // 2. ROAD, SIDEWALKS & LANE LINES
    this.drawGroundAndRoad(w, h, camX, distance);

    // 3. SCENERY OBJECTS (Streetlights, side buildings, trees)
    this.drawSideScenery(camX, distance);

    // 4. ENTITIES SORTED BY DISTANCE (Z-sorting: far to near)
    type Drawable =
      | { type: 'obstacle'; obj: ObstacleObject }
      | { type: 'coin'; obj: CoinObject }
      | { type: 'powerup'; obj: PowerUpObject }
      | { type: 'player' };

    const drawables: Drawable[] = [
      ...obstacles.filter((o) => o.z > -2 && o.z < TRACK_RENDER_DISTANCE).map((o) => ({ type: 'obstacle' as const, obj: o })),
      ...coins.filter((c) => !c.collected && c.z > -2 && c.z < TRACK_RENDER_DISTANCE).map((c) => ({ type: 'coin' as const, obj: c })),
      ...powerUps.filter((p) => !p.collected && p.z > -2 && p.z < TRACK_RENDER_DISTANCE).map((p) => ({ type: 'powerup' as const, obj: p })),
      { type: 'player' as const },
    ];

    drawables.sort((a, b) => {
      const zA = a.type === 'player' ? 0 : a.obj.z;
      const zB = b.type === 'player' ? 0 : b.obj.z;
      return zB - zA; // furthest first
    });

    for (const item of drawables) {
      if (item.type === 'obstacle') {
        this.drawObstacle(item.obj, camX);
      } else if (item.type === 'coin') {
        this.drawCoin(item.obj, camX);
      } else if (item.type === 'powerup') {
        this.drawPowerUp(item.obj, camX);
      } else if (item.type === 'player') {
        this.drawPlayer(player, skin, camX, activePowerUps);
      }
    }

    // 5. PARTICLES (Sparks, dust, trails)
    this.drawParticles(particles, camX);

    // 6. SPEED BOOST VIGNETTE & SPEED LINES
    if (activePowerUps.has('SPEED_BOOST')) {
      this.drawSpeedLines(w, h);
    }

    // 7. FLOATING TEXTS (+10, 2X, etc.)
    this.drawFloatingTexts(floatingTexts, camX);

    ctx.restore();
  }

  private drawSky(w: number, h: number, camX: number, distance: number) {
    const ctx = this.ctx;
    const horizon = this.horizonY;

    // Atmospheric twilight gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, horizon);
    skyGrad.addColorStop(0, '#060B18'); // Deep space
    skyGrad.addColorStop(0.45, '#1E1B4B'); // Indigo night
    skyGrad.addColorStop(0.8, '#4C1D95'); // Violet dusk
    skyGrad.addColorStop(1, '#BE185D'); // Neon magenta glow at horizon

    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, w, horizon + 2);

    // Distant Stars / Grid dust
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    const starOffset = (distance * 0.05) % 100;
    for (let i = 0; i < 24; i++) {
      const sx = ((i * 137.5 + starOffset) % w);
      const sy = ((i * 47) % (horizon * 0.7));
      ctx.fillRect(sx, sy, 1.5, 1.5);
    }

    // Distant Parallax City Skyline
    const buildingWidth = w * 0.09;
    const baseOffset = -camX * 20 - distance * 0.2;
    ctx.fillStyle = '#0B0F19';

    for (let i = -2; i < 16; i++) {
      const bx = ((i * buildingWidth + baseOffset) % (w * 1.5)) - w * 0.25;
      const bHeight = 35 + ((i * 37) % 75);
      const by = horizon - bHeight;

      // Building silhouette
      ctx.fillRect(bx, by, buildingWidth * 0.88, bHeight + 4);

      // Window lights
      ctx.fillStyle = (i % 3 === 0) ? 'rgba(56, 189, 248, 0.5)' : 'rgba(251, 191, 36, 0.4)';
      const winCols = 3;
      const winRows = Math.floor(bHeight / 14);
      for (let r = 0; r < winRows; r++) {
        for (let c = 0; c < winCols; c++) {
          if ((r + c + i) % 2 === 0) {
            ctx.fillRect(bx + 4 + c * 8, by + 6 + r * 12, 4, 6);
          }
        }
      }
      ctx.fillStyle = '#0B0F19';

      // Red antenna warning beacon
      if (i % 2 === 0) {
        ctx.fillStyle = '#EF4444';
        ctx.fillRect(bx + buildingWidth * 0.44 - 1, by - 6, 2, 6);
        ctx.fillStyle = '#0B0F19';
      }
    }

    // Horizon neon warm haze
    const hazeGrad = ctx.createLinearGradient(0, horizon - 15, 0, horizon + 5);
    hazeGrad.addColorStop(0, 'rgba(236, 72, 153, 0)');
    hazeGrad.addColorStop(1, 'rgba(236, 72, 153, 0.35)');
    ctx.fillStyle = hazeGrad;
    ctx.fillRect(0, horizon - 15, w, 20);
  }

  private drawGroundAndRoad(w: number, h: number, camX: number, distance: number) {
    const ctx = this.ctx;
    const horizon = this.horizonY;

    // Ground terrain outside road
    const groundGrad = ctx.createLinearGradient(0, horizon, 0, h);
    groundGrad.addColorStop(0, '#040711');
    groundGrad.addColorStop(1, '#020408');
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, horizon, w, h - horizon);

    // Side Cyber Grid Ground lines
    ctx.strokeStyle = 'rgba(30, 41, 59, 0.6)';
    ctx.lineWidth = 1;
    const gridCount = 8;
    for (let i = 0; i < gridCount; i++) {
      const pLeft = this.project(-8 - i * 3, 0, 0, camX);
      const pFarLeft = this.project(-8 - i * 3, 0, 100, camX);
      if (pLeft.visible && pFarLeft.visible) {
        ctx.beginPath();
        ctx.moveTo(pLeft.x, pLeft.y);
        ctx.lineTo(pFarLeft.x, pFarLeft.y);
        ctx.stroke();
      }

      const pRight = this.project(8 + i * 3, 0, 0, camX);
      const pFarRight = this.project(8 + i * 3, 0, 100, camX);
      if (pRight.visible && pFarRight.visible) {
        ctx.beginPath();
        ctx.moveTo(pRight.x, pRight.y);
        ctx.lineTo(pFarRight.x, pFarRight.y);
        ctx.stroke();
      }
    }

    // 3-Lane Road surface
    const roadHalfWidth = LANE_WIDTH * 1.7; // Generous road width
    const nearZ = 0.5;
    const farZ = 120;

    const pNearL = this.project(-roadHalfWidth, 0, nearZ, camX);
    const pNearR = this.project(roadHalfWidth, 0, nearZ, camX);
    const pFarL = this.project(-roadHalfWidth, 0, farZ, camX);
    const pFarR = this.project(roadHalfWidth, 0, farZ, camX);

    // Road asphalt
    ctx.beginPath();
    ctx.moveTo(pNearL.x, pNearL.y);
    ctx.lineTo(pFarL.x, pFarL.y);
    ctx.lineTo(pFarR.x, pFarR.y);
    ctx.lineTo(pNearR.x, pNearR.y);
    ctx.closePath();

    const roadGrad = ctx.createLinearGradient(0, horizon, 0, h);
    roadGrad.addColorStop(0, '#111827');
    roadGrad.addColorStop(1, '#0B0F17');
    ctx.fillStyle = roadGrad;
    ctx.fill();

    // Road Edge Curbs with alternating neon markings
    this.drawRoadEdgeCurbs(camX, distance, -roadHalfWidth, -1);
    this.drawRoadEdgeCurbs(camX, distance, roadHalfWidth, 1);

    // Glowing Lane Divider Stripes
    this.drawLaneDividers(camX, distance, -LANE_WIDTH * 0.5);
    this.drawLaneDividers(camX, distance, LANE_WIDTH * 0.5);
  }

  private drawRoadEdgeCurbs(camX: number, distance: number, roadX: number, side: number) {
    const ctx = this.ctx;
    const segmentLength = 4.0;
    const totalSegments = 25;

    for (let i = 0; i < totalSegments; i++) {
      const zNear = i * segmentLength - (distance % segmentLength);
      const zFar = zNear + segmentLength;
      if (zNear < 0.2 || zFar > 110) continue;

      const p1 = this.project(roadX, 0, zNear, camX);
      const p2 = this.project(roadX, 0, zFar, camX);
      const p3 = this.project(roadX + side * 0.35, 0.15, zFar, camX);
      const p4 = this.project(roadX + side * 0.35, 0.15, zNear, camX);

      if (p1.visible && p2.visible) {
        const isCyan = (Math.floor((zNear + distance) / segmentLength) % 2 === 0);
        ctx.fillStyle = isCyan ? '#06B6D4' : '#1E293B';
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.lineTo(p3.x, p3.y);
        ctx.lineTo(p4.x, p4.y);
        ctx.closePath();
        ctx.fill();
      }
    }
  }

  private drawLaneDividers(camX: number, distance: number, dividerX: number) {
    const ctx = this.ctx;
    const stripeLength = 3.5;
    const stripeGap = 3.5;
    const cycle = stripeLength + stripeGap;
    const numStripes = 18;

    ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';

    for (let i = 0; i < numStripes; i++) {
      const zStart = i * cycle - (distance % cycle);
      const zEnd = zStart + stripeLength;
      if (zStart < 0.3 || zEnd > 110) continue;

      const p1 = this.project(dividerX - 0.04, 0, zStart, camX);
      const p2 = this.project(dividerX + 0.04, 0, zStart, camX);
      const p3 = this.project(dividerX + 0.04, 0, zEnd, camX);
      const p4 = this.project(dividerX - 0.04, 0, zEnd, camX);

      if (p1.visible && p3.visible) {
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.lineTo(p3.x, p3.y);
        ctx.lineTo(p4.x, p4.y);
        ctx.closePath();
        ctx.fill();
      }
    }
  }

  private drawSideScenery(camX: number, distance: number) {
    const ctx = this.ctx;
    const spacing = 16.0;
    const count = 7;

    for (let i = 0; i < count; i++) {
      const z = i * spacing - (distance % spacing);
      if (z < 1.0 || z > 105) continue;

      // Left and Right Streetlights
      this.drawStreetLamp(-4.2, z, camX, -1);
      this.drawStreetLamp(4.2, z, camX, 1);

      // Cyber Palms / Trees
      if (i % 2 === 1) {
        this.drawCyberTree(-5.8, z + 6, camX);
        this.drawCyberTree(5.8, z + 6, camX);
      }
    }
  }

  private drawStreetLamp(x: number, z: number, camX: number, armDir: number) {
    const ctx = this.ctx;
    const base = this.project(x, 0, z, camX);
    const top = this.project(x, 4.2, z, camX);
    const arm = this.project(x + armDir * 1.0, 4.0, z, camX);

    if (!base.visible || !top.visible) return;

    // Pole
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = Math.max(1.5, base.scale * 0.06);
    ctx.beginPath();
    ctx.moveTo(base.x, base.y);
    ctx.lineTo(top.x, top.y);
    ctx.lineTo(arm.x, arm.y);
    ctx.stroke();

    // Glowing light fixture
    const lampRadius = Math.max(2, base.scale * 0.12);
    ctx.fillStyle = '#38BDF8';
    ctx.beginPath();
    ctx.arc(arm.x, arm.y, lampRadius, 0, Math.PI * 2);
    ctx.fill();

    // Soft light cone pool on ground
    const lightGround = this.project(x + armDir * 0.8, 0, z, camX);
    if (lightGround.visible) {
      ctx.fillStyle = 'rgba(56, 189, 248, 0.08)';
      ctx.beginPath();
      ctx.ellipse(lightGround.x, lightGround.y, base.scale * 0.7, base.scale * 0.25, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private drawCyberTree(x: number, z: number, camX: number) {
    const ctx = this.ctx;
    const base = this.project(x, 0, z, camX);
    const trunkTop = this.project(x, 3.2, z, camX);
    const foliageTop = this.project(x, 5.0, z, camX);

    if (!base.visible || !foliageTop.visible) return;

    // Trunk
    ctx.strokeStyle = '#1E293B';
    ctx.lineWidth = Math.max(2, base.scale * 0.1);
    ctx.beginPath();
    ctx.moveTo(base.x, base.y);
    ctx.lineTo(trunkTop.x, trunkTop.y);
    ctx.stroke();

    // Stylized geometric foliage
    const foliageWidth = base.scale * 0.6;
    ctx.fillStyle = '#065F46'; // Emerald
    ctx.beginPath();
    ctx.moveTo(trunkTop.x - foliageWidth, trunkTop.y);
    ctx.lineTo(foliageTop.x, foliageTop.y);
    ctx.lineTo(trunkTop.x + foliageWidth, trunkTop.y);
    ctx.closePath();
    ctx.fill();

    // Neon highlight
    ctx.strokeStyle = '#10B981';
    ctx.lineWidth = Math.max(1, base.scale * 0.02);
    ctx.stroke();
  }

  // --- DRAW OBSTACLES ---
  private drawObstacle(obs: ObstacleObject, camX: number) {
    const ctx = this.ctx;
    const { x, y, z, width, height, type } = obs;

    const projBase = this.project(x, y, z, camX);
    if (!projBase.visible) return;

    const s = projBase.scale;

    switch (type) {
      case 'CONE': {
        // Traffic Cone (Jumpable)
        const coneHeight = 1.1 * s;
        const coneBaseW = 0.7 * s;

        // Base plate
        ctx.fillStyle = '#C2410C';
        ctx.fillRect(projBase.x - coneBaseW * 0.6, projBase.y - 4, coneBaseW * 1.2, 5 * (s / 10));

        // Cone body
        ctx.fillStyle = '#EA580C'; // Bright safety orange
        ctx.beginPath();
        ctx.moveTo(projBase.x - coneBaseW * 0.45, projBase.y - 2);
        ctx.lineTo(projBase.x, projBase.y - coneHeight);
        ctx.lineTo(projBase.x + coneBaseW * 0.45, projBase.y - 2);
        ctx.closePath();
        ctx.fill();

        // White reflective band
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        const band1Y = projBase.y - coneHeight * 0.38;
        const band2Y = projBase.y - coneHeight * 0.58;
        ctx.moveTo(projBase.x - coneBaseW * 0.28, band1Y);
        ctx.lineTo(projBase.x - coneBaseW * 0.18, band2Y);
        ctx.lineTo(projBase.x + coneBaseW * 0.18, band2Y);
        ctx.lineTo(projBase.x + coneBaseW * 0.28, band1Y);
        ctx.closePath();
        ctx.fill();

        // Jump hint badge
        if (z < 28 && z > 6) {
          this.drawActionHint(projBase.x, projBase.y - coneHeight - 16, 'JUMP', '#F59E0B', s);
        }
        break;
      }

      case 'BARRIER_LOW': {
        // Road Hurdle / Barricade (Jumpable)
        const barW = width * s;
        const barH = height * s;

        // Support legs
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = Math.max(2, s * 0.05);
        ctx.beginPath();
        ctx.moveTo(projBase.x - barW * 0.42, projBase.y);
        ctx.lineTo(projBase.x - barW * 0.42, projBase.y - barH);
        ctx.moveTo(projBase.x + barW * 0.42, projBase.y);
        ctx.lineTo(projBase.x + barW * 0.42, projBase.y - barH);
        ctx.stroke();

        // Hazard striped crossbeam
        const beamY = projBase.y - barH * 0.85;
        const beamH = barH * 0.45;
        ctx.fillStyle = '#FBBF24'; // Yellow
        ctx.fillRect(projBase.x - barW * 0.5, beamY, barW, beamH);

        // Black hazard diagonal stripes
        ctx.fillStyle = '#18181B';
        const numStripes = 5;
        const stripeStep = barW / numStripes;
        for (let i = 0; i < numStripes; i += 2) {
          ctx.beginPath();
          ctx.moveTo(projBase.x - barW * 0.5 + i * stripeStep, beamY);
          ctx.lineTo(projBase.x - barW * 0.5 + (i + 1) * stripeStep, beamY);
          ctx.lineTo(projBase.x - barW * 0.5 + (i + 1.4) * stripeStep, beamY + beamH);
          ctx.lineTo(projBase.x - barW * 0.5 + (i + 0.4) * stripeStep, beamY + beamH);
          ctx.closePath();
          ctx.fill();
        }

        // Jump hint badge
        if (z < 28 && z > 6) {
          this.drawActionHint(projBase.x, projBase.y - barH - 16, 'JUMP', '#F59E0B', s);
        }
        break;
      }

      case 'BARRIER_HIGH': {
        // Overhead Gantry Sign (Must SLIDE under or change lane)
        const signW = width * s;
        const signH = height * s;
        const postH = signH * 1.5;

        // Tall steel side pillars
        ctx.strokeStyle = '#64748B';
        ctx.lineWidth = Math.max(3, s * 0.07);
        ctx.beginPath();
        ctx.moveTo(projBase.x - signW * 0.5, projBase.y);
        ctx.lineTo(projBase.x - signW * 0.5, projBase.y - postH);
        ctx.moveTo(projBase.x + signW * 0.5, projBase.y);
        ctx.lineTo(projBase.x + signW * 0.5, projBase.y - postH);
        ctx.stroke();

        // Overhead horizontal sign box (elevated high off ground)
        const boxTop = projBase.y - postH;
        const boxH = postH * 0.45;

        // Glowing red / neon sign container
        ctx.fillStyle = '#991B1B';
        ctx.fillRect(projBase.x - signW * 0.52, boxTop, signW * 1.04, boxH);
        ctx.strokeStyle = '#EF4444';
        ctx.lineWidth = Math.max(1.5, s * 0.03);
        ctx.strokeRect(projBase.x - signW * 0.52, boxTop, signW * 1.04, boxH);

        // Slide warning text with down arrow
        ctx.fillStyle = '#FFFFFF';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const fontSize = Math.max(9, s * 0.28);
        ctx.font = `800 ${fontSize}px 'Outfit', sans-serif`;
        ctx.fillText('▼ SLIDE ▼', projBase.x, boxTop + boxH * 0.5);

        // Bottom clearance warning bar
        ctx.fillStyle = '#FBBF24';
        ctx.fillRect(projBase.x - signW * 0.5, boxTop + boxH, signW, Math.max(2, s * 0.04));

        if (z < 30 && z > 6) {
          this.drawActionHint(projBase.x, projBase.y - 12, 'SLIDE ⬇', '#EF4444', s);
        }
        break;
      }

      case 'CRATE': {
        // Industrial Wood Crate
        const crateW = width * s;
        const crateH = height * s;

        // Drop shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.beginPath();
        ctx.ellipse(projBase.x, projBase.y, crateW * 0.55, crateW * 0.2, 0, 0, Math.PI * 2);
        ctx.fill();

        // Front Face
        ctx.fillStyle = '#92400E';
        ctx.fillRect(projBase.x - crateW * 0.5, projBase.y - crateH, crateW, crateH);

        // Inner wood planks
        ctx.fillStyle = '#B45309';
        ctx.fillRect(projBase.x - crateW * 0.44, projBase.y - crateH * 0.9, crateW * 0.88, crateH * 0.8);

        // Cross braces
        ctx.strokeStyle = '#78350F';
        ctx.lineWidth = Math.max(2, s * 0.04);
        ctx.beginPath();
        ctx.moveTo(projBase.x - crateW * 0.44, projBase.y - crateH * 0.9);
        ctx.lineTo(projBase.x + crateW * 0.44, projBase.y - crateH * 0.1);
        ctx.moveTo(projBase.x + crateW * 0.44, projBase.y - crateH * 0.9);
        ctx.lineTo(projBase.x - crateW * 0.44, projBase.y - crateH * 0.1);
        ctx.stroke();

        // Corner metal brackets
        ctx.fillStyle = '#475569';
        const bracket = Math.max(3, crateW * 0.14);
        ctx.fillRect(projBase.x - crateW * 0.5, projBase.y - crateH, bracket, bracket);
        ctx.fillRect(projBase.x + crateW * 0.5 - bracket, projBase.y - crateH, bracket, bracket);
        ctx.fillRect(projBase.x - crateW * 0.5, projBase.y - bracket, bracket, bracket);
        ctx.fillRect(projBase.x + crateW * 0.5 - bracket, projBase.y - bracket, bracket, bracket);
        break;
      }

      case 'CAR': {
        // Cyber Sedan / Road Car (Solid: Must dodge/switch lane)
        const carW = width * s;
        const carH = height * s;

        // Ground shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.beginPath();
        ctx.ellipse(projBase.x, projBase.y, carW * 0.6, carW * 0.25, 0, 0, Math.PI * 2);
        ctx.fill();

        // Wheels
        ctx.fillStyle = '#18181B';
        const wheelW = carW * 0.18;
        const wheelH = carH * 0.35;
        ctx.fillRect(projBase.x - carW * 0.48, projBase.y - wheelH * 0.8, wheelW, wheelH);
        ctx.fillRect(projBase.x + carW * 0.3, projBase.y - wheelH * 0.8, wheelW, wheelH);

        // Lower Chassis
        ctx.fillStyle = '#1E293B';
        ctx.fillRect(projBase.x - carW * 0.5, projBase.y - carH * 0.6, carW, carH * 0.45);

        // Metallic Body
        ctx.fillStyle = obs.color || '#DC2626'; // Sport Red
        ctx.beginPath();
        ctx.roundRect(projBase.x - carW * 0.48, projBase.y - carH * 0.7, carW * 0.96, carH * 0.45, 4);
        ctx.fill();

        // Cabin / Roof
        ctx.fillStyle = '#0F172A';
        ctx.beginPath();
        ctx.moveTo(projBase.x - carW * 0.38, projBase.y - carH * 0.7);
        ctx.lineTo(projBase.x - carW * 0.28, projBase.y - carH);
        ctx.lineTo(projBase.x + carW * 0.28, projBase.y - carH);
        ctx.lineTo(projBase.x + carW * 0.38, projBase.y - carH * 0.7);
        ctx.closePath();
        ctx.fill();

        // Rear tinted window
        ctx.fillStyle = '#38BDF8';
        ctx.beginPath();
        ctx.moveTo(projBase.x - carW * 0.32, projBase.y - carH * 0.72);
        ctx.lineTo(projBase.x - carW * 0.24, projBase.y - carH * 0.94);
        ctx.lineTo(projBase.x + carW * 0.24, projBase.y - carH * 0.94);
        ctx.lineTo(projBase.x + carW * 0.32, projBase.y - carH * 0.72);
        ctx.closePath();
        ctx.fill();

        // Glowing red taillights
        ctx.fillStyle = '#EF4444';
        const lightW = carW * 0.22;
        const lightH = carH * 0.12;
        const lightY = projBase.y - carH * 0.55;
        ctx.fillRect(projBase.x - carW * 0.44, lightY, lightW, lightH);
        ctx.fillRect(projBase.x + carW * 0.22, lightY, lightW, lightH);

        // Glowing light flare
        ctx.fillStyle = 'rgba(239, 68, 68, 0.4)';
        ctx.beginPath();
        ctx.arc(projBase.x - carW * 0.33, lightY + lightH * 0.5, lightW * 0.8, 0, Math.PI * 2);
        ctx.arc(projBase.x + carW * 0.33, lightY + lightH * 0.5, lightW * 0.8, 0, Math.PI * 2);
        ctx.fill();

        // Dodge / Switch Lane badge
        if (z < 28 && z > 7) {
          this.drawActionHint(projBase.x, projBase.y - carH - 18, 'DODGE ◄ ►', '#EC4899', s);
        }
        break;
      }
    }
  }

  private drawActionHint(x: number, y: number, text: string, color: string, scale: number) {
    const ctx = this.ctx;
    const fontSize = Math.max(9, Math.min(14, scale * 0.22));
    ctx.font = `800 ${fontSize}px 'Outfit', sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const textWidth = ctx.measureText(text).width;
    const pad = 6;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.beginPath();
    ctx.roundRect(x - textWidth / 2 - pad, y - fontSize / 2 - pad / 2, textWidth + pad * 2, fontSize + pad, 4);
    ctx.fill();

    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = color;
    ctx.fillText(text, x, y);
  }

  // --- DRAW COIN ---
  private drawCoin(coin: CoinObject, camX: number) {
    const ctx = this.ctx;
    const p = this.project(coin.x, coin.y + 0.4, coin.z, camX);
    if (!p.visible) return;

    const s = p.scale;
    const radius = Math.max(3, s * 0.24);

    // Dynamic 3D spinning ellipse
    const spin = Math.cos(coin.rotation);
    const spinWidth = Math.max(1, Math.abs(spin) * radius);

    // Ground shadow
    const groundP = this.project(coin.x, 0, coin.z, camX);
    if (groundP.visible) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.beginPath();
      ctx.ellipse(groundP.x, groundP.y, radius * 0.8, radius * 0.3, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Magnetized attraction beam/trail
    if (coin.magnetized) {
      ctx.strokeStyle = 'rgba(251, 191, 36, 0.6)';
      ctx.lineWidth = Math.max(1, s * 0.05);
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(this.width / 2, this.height * 0.75);
      ctx.stroke();
    }

    // Outer Golden Rim
    ctx.fillStyle = spin > 0 ? '#F59E0B' : '#D97706';
    ctx.beginPath();
    ctx.ellipse(p.x, p.y, spinWidth, radius, 0, 0, Math.PI * 2);
    ctx.fill();

    // Inner bright gold face
    ctx.fillStyle = '#FCD34D';
    ctx.beginPath();
    ctx.ellipse(p.x, p.y, spinWidth * 0.78, radius * 0.78, 0, 0, Math.PI * 2);
    ctx.fill();

    // Star / Core Sparkle
    if (spinWidth > radius * 0.4) {
      ctx.fillStyle = '#B45309';
      ctx.beginPath();
      ctx.ellipse(p.x, p.y, spinWidth * 0.35, radius * 0.35, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // --- DRAW POWER-UP ---
  private drawPowerUp(pow: PowerUpObject, camX: number) {
    const ctx = this.ctx;
    const hoverY = pow.y + 0.6 + Math.sin(pow.rotation * 2) * 0.15;
    const p = this.project(pow.x, hoverY, pow.z, camX);
    if (!p.visible) return;

    const s = p.scale;
    const radius = Math.max(6, s * 0.35);

    // Glowing ground projection
    const groundP = this.project(pow.x, 0, pow.z, camX);
    if (groundP.visible) {
      ctx.fillStyle = 'rgba(56, 189, 248, 0.25)';
      ctx.beginPath();
      ctx.ellipse(groundP.x, groundP.y, radius * 1.2, radius * 0.4, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    let mainColor = '#38BDF8';
    let label = '⚡';

    switch (pow.type) {
      case 'MAGNET':
        mainColor = '#EF4444';
        label = '🧲';
        break;
      case 'SHIELD':
        mainColor = '#06B6D4';
        label = '🛡️';
        break;
      case 'SPEED_BOOST':
        mainColor = '#F97316';
        label = '⚡';
        break;
      case 'COIN_MULTIPLIER':
        mainColor = '#10B981';
        label = '2X';
        break;
    }

    // Outer Aura Ring
    ctx.strokeStyle = mainColor;
    ctx.lineWidth = Math.max(1.5, s * 0.05);
    ctx.beginPath();
    ctx.arc(p.x, p.y, radius * 1.25, 0, Math.PI * 2);
    ctx.stroke();

    // Orb Sphere
    const sphereGrad = ctx.createRadialGradient(p.x - radius * 0.3, p.y - radius * 0.3, radius * 0.1, p.x, p.y, radius);
    sphereGrad.addColorStop(0, '#FFFFFF');
    sphereGrad.addColorStop(0.5, mainColor);
    sphereGrad.addColorStop(1, '#0F172A');

    ctx.fillStyle = sphereGrad;
    ctx.beginPath();
    ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
    ctx.fill();

    // Center icon
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#FFFFFF';
    const fontSize = Math.max(8, radius * 0.9);
    ctx.font = `800 ${fontSize}px sans-serif`;
    ctx.fillText(label, p.x, p.y);
  }

  // --- DRAW PLAYER ---
  private drawPlayer(
    player: PlayerState,
    skin: CharacterSkin,
    camX: number,
    activePowerUps: Map<PowerUpType, { duration: number; maxDuration: number }>
  ) {
    const ctx = this.ctx;
    const p = this.project(player.x, player.y, 0, camX);
    if (!p.visible) return;

    const s = p.scale;
    const { isJumping, isSliding, runCycle, tilt } = player;

    ctx.save();
    ctx.translate(p.x, p.y);

    // 1. Dynamic Ground Shadow (Shrinks as player leaps into air)
    const groundP = this.project(player.x, 0, 0, camX);
    const shadowScale = Math.max(0.2, 1.0 - player.y * 0.35);
    const shadowAlpha = Math.max(0.15, 0.5 - player.y * 0.15);

    ctx.restore();
    ctx.save();
    ctx.fillStyle = `rgba(0, 0, 0, ${shadowAlpha})`;
    ctx.beginPath();
    ctx.ellipse(groundP.x, groundP.y, s * 0.45 * shadowScale, s * 0.18 * shadowScale, 0, 0, Math.PI * 2);
    ctx.fill();

    // Return to player coordinates
    ctx.translate(p.x, p.y);
    // Apply banking roll
    ctx.rotate(tilt * 0.25);

    // Character Dimensions in screen pixels
    const charH = 1.7 * s;
    const charW = 0.8 * s;

    if (isSliding) {
      // --- SLIDING POSE (Ducking low under obstacles) ---
      const slideH = charH * 0.42;

      // Sliding friction sparks
      ctx.fillStyle = '#F59E0B';
      for (let i = 0; i < 3; i++) {
        ctx.fillRect(-charW * 0.5 - Math.random() * 8, -Math.random() * 6, 3, 3);
      }

      // Slanted sliding body
      ctx.fillStyle = skin.pantsColor;
      ctx.fillRect(-charW * 0.4, -slideH * 0.6, charW * 0.8, slideH * 0.5);

      ctx.fillStyle = skin.jacketColor;
      ctx.beginPath();
      ctx.roundRect(-charW * 0.45, -slideH, charW * 0.9, slideH * 0.65, 4);
      ctx.fill();

      // Head ducked low
      ctx.fillStyle = skin.skinTone;
      ctx.beginPath();
      ctx.arc(charW * 0.15, -slideH * 0.9, s * 0.18, 0, Math.PI * 2);
      ctx.fill();

      // Hair
      ctx.fillStyle = skin.hairColor;
      ctx.beginPath();
      ctx.arc(charW * 0.15, -slideH * 0.95, s * 0.19, Math.PI, 0);
      ctx.fill();
    } else {
      // --- RUNNING / JUMPING POSE ---
      const stride = Math.sin(runCycle * Math.PI * 2);
      const bob = Math.abs(Math.cos(runCycle * Math.PI * 2)) * (s * 0.08);
      const yOffset = isJumping ? 0 : -bob;

      // Legs / Pants
      const legW = charW * 0.28;
      const legH = charH * 0.42;
      const leftLegOffset = isJumping ? -s * 0.1 : stride * (s * 0.2);
      const rightLegOffset = isJumping ? s * 0.05 : -stride * (s * 0.2);

      // Left leg
      ctx.fillStyle = skin.pantsColor;
      ctx.fillRect(-charW * 0.35, yOffset - legH + leftLegOffset * 0.5, legW, legH);
      // Left shoe
      ctx.fillStyle = skin.shoesColor;
      ctx.fillRect(-charW * 0.38, yOffset + leftLegOffset * 0.5 - 3, legW * 1.2, 6);

      // Right leg
      ctx.fillStyle = skin.pantsColor;
      ctx.fillRect(charW * 0.08, yOffset - legH + rightLegOffset * 0.5, legW, legH);
      // Right shoe
      ctx.fillStyle = skin.shoesColor;
      ctx.fillRect(charW * 0.05, yOffset + rightLegOffset * 0.5 - 3, legW * 1.2, 6);

      // Torso / Jacket
      const torsoH = charH * 0.42;
      const torsoW = charW * 0.75;
      const torsoY = yOffset - legH - torsoH;

      ctx.fillStyle = skin.jacketColor;
      ctx.beginPath();
      ctx.roundRect(-torsoW * 0.5, torsoY, torsoW, torsoH, 6);
      ctx.fill();

      // Jacket Neon Center Stripe / Logo
      ctx.fillStyle = skin.glowColor;
      ctx.fillRect(-torsoW * 0.08, torsoY + 4, torsoW * 0.16, torsoH - 8);

      // Arms pumping
      const armW = charW * 0.2;
      const armH = torsoH * 0.85;
      const leftArmSwing = -stride * (s * 0.22);
      const rightArmSwing = stride * (s * 0.22);

      // Left Arm
      ctx.fillStyle = skin.jacketColor;
      ctx.fillRect(-torsoW * 0.5 - armW * 0.8, torsoY + 4 + leftArmSwing, armW, armH);
      // Right Arm
      ctx.fillRect(torsoW * 0.5 - armW * 0.2, torsoY + 4 + rightArmSwing, armW, armH);

      // Head
      const headRadius = s * 0.22;
      const headY = torsoY - headRadius;

      ctx.fillStyle = skin.skinTone;
      ctx.beginPath();
      ctx.arc(0, headY, headRadius, 0, Math.PI * 2);
      ctx.fill();

      // Hair
      ctx.fillStyle = skin.hairColor;
      ctx.beginPath();
      ctx.arc(0, headY - 2, headRadius * 1.05, Math.PI * 0.8, Math.PI * 2.2);
      ctx.fill();

      // Cyber Visor / Glasses
      ctx.fillStyle = skin.glowColor;
      ctx.fillRect(-headRadius * 0.7, headY - 4, headRadius * 1.4, 5);
    }

    // --- ACTIVE POWER-UP OVERLAYS ON RUNNER ---

    // 1. SHIELD ENERGY BUBBLE
    if (activePowerUps.has('SHIELD')) {
      const shieldR = charH * 0.65;
      const shieldY = -charH * 0.5;

      ctx.strokeStyle = 'rgba(6, 182, 212, 0.85)';
      ctx.lineWidth = Math.max(2, s * 0.05);
      ctx.fillStyle = 'rgba(6, 182, 212, 0.15)';

      ctx.beginPath();
      ctx.arc(0, shieldY, shieldR, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Hexagonal Shield Grid Lines
      ctx.strokeStyle = 'rgba(34, 211, 238, 0.4)';
      ctx.lineWidth = 1;
      for (let i = 0; i < 6; i++) {
        const ang = (i * Math.PI) / 3;
        ctx.beginPath();
        ctx.moveTo(Math.cos(ang) * shieldR * 0.3, shieldY + Math.sin(ang) * shieldR * 0.3);
        ctx.lineTo(Math.cos(ang) * shieldR * 0.9, shieldY + Math.sin(ang) * shieldR * 0.9);
        ctx.stroke();
      }
    }

    // 2. MAGNET AURA
    if (activePowerUps.has('MAGNET')) {
      const magnetTime = Date.now() * 0.005;
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.7)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(0, -charH * 0.5, charW * 1.2, charH * 0.7, magnetTime, 0, Math.PI * 2);
      ctx.stroke();
    }

    // 3. COIN MULTIPLIER (2X) SPARKLE
    if (activePowerUps.has('COIN_MULTIPLIER')) {
      ctx.fillStyle = '#10B981';
      ctx.font = `800 ${Math.max(10, s * 0.28)}px 'Outfit', sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText('2X', 0, -charH * 1.15);
    }

    ctx.restore();
  }

  // --- DRAW PARTICLES ---
  private drawParticles(particles: Particle[], camX: number) {
    const ctx = this.ctx;

    for (const p of particles) {
      const proj = this.project(p.x, p.y, p.z, camX);
      if (!proj.visible) continue;

      const pSize = Math.max(1, p.size * proj.scale * 0.1);
      const alpha = (p.life / p.maxLife) * p.alpha;

      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
      ctx.beginPath();
      ctx.arc(proj.x, proj.y, pSize, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1.0;
  }

  // --- DRAW SPEED LINES ON EDGES ---
  private drawSpeedLines(w: number, h: number) {
    const ctx = this.ctx;
    ctx.strokeStyle = 'rgba(249, 115, 22, 0.35)';
    ctx.lineWidth = 2;

    const lineCount = 14;
    for (let i = 0; i < lineCount; i++) {
      const isLeft = i % 2 === 0;
      const startX = isLeft ? Math.random() * (w * 0.15) : w - Math.random() * (w * 0.15);
      const startY = Math.random() * h;
      const len = 40 + Math.random() * 80;

      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(isLeft ? startX + len * 0.4 : startX - len * 0.4, startY + len);
      ctx.stroke();
    }
  }

  // --- DRAW FLOATING TEXTS ---
  private drawFloatingTexts(floatingTexts: FloatingText[], camX: number) {
    const ctx = this.ctx;

    for (const ft of floatingTexts) {
      const p = this.project(ft.x, ft.y, ft.z, camX);
      if (!p.visible) continue;

      const alpha = (ft.life / ft.maxLife) * ft.alpha;
      const fontSize = Math.max(10, p.scale * 0.35);

      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
      ctx.font = `800 ${fontSize}px 'Outfit', sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillStyle = ft.color;
      ctx.shadowColor = ft.color;
      ctx.shadowBlur = 8;
      ctx.fillText(ft.text, p.x, p.y);
      ctx.restore();
    }
  }
}
