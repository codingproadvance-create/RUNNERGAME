import React, { useEffect, useRef } from 'react';
import { GameEngine } from '../game/engine';
import { GameRenderer } from '../game/renderer';

interface GameCanvasProps {
  engine: GameEngine;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({ engine }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rendererRef = useRef<GameRenderer | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const renderer = new GameRenderer(canvas);
    rendererRef.current = renderer;

    const handleResize = () => {
      renderer.resize();
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    // Initial resize
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  // Update render frame whenever engine ticks
  useEffect(() => {
    let animId: number;

    const renderFrame = () => {
      const renderer = rendererRef.current;
      if (renderer) {
        renderer.render(
          engine.player,
          engine.selectedSkin,
          engine.obstacles,
          engine.coins,
          engine.powerUps,
          engine.particles,
          engine.floatingTexts,
          engine.activePowerUps,
          engine.stats.distance,
          engine.shakeIntensity
        );
      }
      animId = requestAnimationFrame(renderFrame);
    };

    animId = requestAnimationFrame(renderFrame);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [engine]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full block touch-none select-none bg-slate-950"
    />
  );
};
