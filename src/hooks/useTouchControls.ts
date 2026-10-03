import { useEffect, useRef } from 'react';
import { GameEngine } from '../game/engine';

interface TouchControlsOptions {
  engine: GameEngine;
  enabled: boolean;
}

export function useTouchControls({ engine, enabled }: TouchControlsOptions) {
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);

  useEffect(() => {
    if (!enabled) return;

    // --- KEYBOARD CONTROLS (DESKTOP) ---
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if typing in an input
      if ((e.target as HTMLElement)?.tagName === 'INPUT') return;

      switch (e.key) {
        case 'ArrowLeft':
        case 'a':
        case 'A':
          e.preventDefault();
          engine.moveLeft();
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          e.preventDefault();
          engine.moveRight();
          break;
        case 'ArrowUp':
        case 'w':
        case 'W':
        case ' ':
          e.preventDefault();
          engine.jump();
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          e.preventDefault();
          engine.slide();
          break;
        case 'p':
        case 'P':
        case 'Escape':
          e.preventDefault();
          if (engine.status === 'PLAYING') {
            engine.pauseGame();
          } else if (engine.status === 'PAUSED') {
            engine.resumeGame();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    // --- TOUCH CONTROLS (MOBILE SWIPES) ---
    const SWIPE_THRESHOLD = 26; // Min pixels for gesture
    const MAX_GESTURE_TIME = 450; // Max ms

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        touchStartRef.current = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
          time: Date.now(),
        };
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      // Prevent browser pull-to-refresh & screen drag
      if (e.cancelable) {
        e.preventDefault();
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchStartRef.current || e.changedTouches.length === 0) return;

      const start = touchStartRef.current;
      const end = {
        x: e.changedTouches[0].clientX,
        y: e.changedTouches[0].clientY,
      };

      const dx = end.x - start.x;
      const dy = end.y - start.y;
      const dt = Date.now() - start.time;

      touchStartRef.current = null;

      if (dt > MAX_GESTURE_TIME) return;

      const absX = Math.abs(dx);
      const absY = Math.abs(dy);

      if (absX < SWIPE_THRESHOLD && absY < SWIPE_THRESHOLD) {
        // Simple tap -> Jump or lane shift depending on screen half
        return;
      }

      if (absX > absY) {
        // Horizontal Swipe
        if (dx < 0) {
          engine.moveLeft();
        } else {
          engine.moveRight();
        }
      } else {
        // Vertical Swipe
        if (dy < 0) {
          engine.jump();
        } else {
          engine.slide();
        }
      }
    };

    const targetElement = window;
    targetElement.addEventListener('touchstart', handleTouchStart, { passive: true });
    targetElement.addEventListener('touchmove', handleTouchMove, { passive: false });
    targetElement.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      targetElement.removeEventListener('touchstart', handleTouchStart);
      targetElement.removeEventListener('touchmove', handleTouchMove);
      targetElement.removeEventListener('touchend', handleTouchEnd);
    };
  }, [engine, enabled]);
}
