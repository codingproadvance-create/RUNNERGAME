import React from 'react';
import { Pause, Zap, Shield, Magnet, Sparkles, ChevronLeft, ChevronRight, ArrowUp, ArrowDown } from 'lucide-react';
import { PowerUpType } from '../game/types';
import { GameEngine } from '../game/engine';

interface HUDProps {
  score: number;
  distance: number;
  coins: number;
  multiplier: number;
  activePowerUps: Map<PowerUpType, { duration: number; maxDuration: number }>;
  onPause: () => void;
  engine: GameEngine;
  showOnScreenControls: boolean;
}

export const HUD: React.FC<HUDProps> = ({
  score,
  distance,
  coins,
  multiplier,
  activePowerUps,
  onPause,
  engine,
  showOnScreenControls,
}) => {
  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 select-none">
      {/* TOP STATUS BAR */}
      <div className="flex items-start justify-between gap-2">
        {/* Left: Score & Distance */}
        <div className="flex flex-col gap-1">
          <div className="flex items-baseline gap-2">
            <span className="text-xs font-semibold tracking-wider text-slate-400">SCORE</span>
            <span className="font-tabular text-2xl sm:text-3xl font-black tracking-tight text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
              {Math.floor(score).toLocaleString()}
            </span>
            {multiplier > 1 && (
              <span className="px-1.5 py-0.5 rounded bg-emerald-500/90 text-black font-extrabold text-[11px] animate-pulse">
                {multiplier}X
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-300">
            <span className="text-slate-400">DIST</span>
            <span className="font-tabular font-bold text-cyan-400">
              {Math.floor(distance).toLocaleString()} m
            </span>
          </div>
        </div>

        {/* Right: Coins & Pause button */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Coin Counter */}
          <div className="flex items-center gap-1.5 bg-slate-900/85 backdrop-blur-md px-3 py-1.5 rounded-xl border border-amber-500/30 shadow-lg">
            <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center shadow-[0_0_8px_#F59E0B] text-slate-950 font-black text-xs">
              $
            </div>
            <span className="font-tabular font-extrabold text-amber-300 text-sm sm:text-base">
              {coins.toLocaleString()}
            </span>
          </div>

          {/* Pause Button */}
          <button
            onClick={onPause}
            className="w-11 h-11 rounded-xl bg-slate-900/85 backdrop-blur-md border border-slate-700/60 flex items-center justify-center text-slate-200 active:scale-95 hover:text-white hover:border-slate-500 transition-all shadow-lg focus:outline-none"
            title="Pause Game (P / Esc)"
            aria-label="Pause Game"
          >
            <Pause className="w-5 h-5 fill-current" />
          </button>
        </div>
      </div>

      {/* ACTIVE POWER-UPS BAR (CENTER LEFT) */}
      <div className="flex flex-col gap-1.5 w-44 max-w-full">
        {Array.from(activePowerUps.entries()).map(([type, data]) => {
          const progress = Math.max(0, Math.min(100, (data.duration / data.maxDuration) * 100));

          let title = 'Power';
          let icon = <Sparkles className="w-4 h-4 text-emerald-400" />;
          let barColor = 'bg-emerald-500';

          if (type === 'MAGNET') {
            title = 'Magnet';
            icon = <Magnet className="w-4 h-4 text-rose-400" />;
            barColor = 'bg-rose-500';
          } else if (type === 'SHIELD') {
            title = 'Shield';
            icon = <Shield className="w-4 h-4 text-cyan-400" />;
            barColor = 'bg-cyan-500';
          } else if (type === 'SPEED_BOOST') {
            title = 'Boost';
            icon = <Zap className="w-4 h-4 text-orange-400" />;
            barColor = 'bg-orange-500';
          } else if (type === 'COIN_MULTIPLIER') {
            title = '2X Coins';
            icon = <Sparkles className="w-4 h-4 text-emerald-400" />;
            barColor = 'bg-emerald-500';
          }

          return (
            <div
              key={type}
              className="bg-slate-900/80 backdrop-blur-md px-2.5 py-1.5 rounded-lg border border-slate-700/50 shadow-md flex flex-col gap-1"
            >
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="flex items-center gap-1.5 text-slate-200">
                  {icon}
                  {title}
                </span>
                <span className="font-tabular text-[10px] text-slate-400">
                  {data.duration.toFixed(1)}s
                </span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-1 overflow-hidden">
                <div
                  className={`h-full ${barColor} transition-all duration-100 ease-linear`}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* OPTIONAL ON-SCREEN ACCESSIBILITY TOUCH CONTROLS */}
      {showOnScreenControls && (
        <div className="pointer-events-auto flex items-end justify-between pb-2 px-1">
          {/* Left / Right Lane switch buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => engine.moveLeft()}
              className="w-14 h-14 rounded-2xl bg-slate-900/80 backdrop-blur-md border border-slate-700/60 flex items-center justify-center text-white active:scale-90 active:bg-cyan-600/40 transition-all shadow-xl"
              aria-label="Move Left"
            >
              <ChevronLeft className="w-8 h-8" />
            </button>
            <button
              onClick={() => engine.moveRight()}
              className="w-14 h-14 rounded-2xl bg-slate-900/80 backdrop-blur-md border border-slate-700/60 flex items-center justify-center text-white active:scale-90 active:bg-cyan-600/40 transition-all shadow-xl"
              aria-label="Move Right"
            >
              <ChevronRight className="w-8 h-8" />
            </button>
          </div>

          {/* Jump / Slide buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => engine.slide()}
              className="w-14 h-14 rounded-2xl bg-slate-900/80 backdrop-blur-md border border-slate-700/60 flex flex-col items-center justify-center text-amber-400 active:scale-90 active:bg-amber-600/40 transition-all shadow-xl"
              aria-label="Slide"
            >
              <ArrowDown className="w-5 h-5" />
              <span className="text-[9px] font-black tracking-wider">SLIDE</span>
            </button>
            <button
              onClick={() => engine.jump()}
              className="w-14 h-14 rounded-2xl bg-cyan-500/90 backdrop-blur-md border border-cyan-400 flex flex-col items-center justify-center text-slate-950 active:scale-90 active:bg-cyan-400 transition-all shadow-[0_0_15px_rgba(6,182,212,0.4)]"
              aria-label="Jump"
            >
              <ArrowUp className="w-5 h-5 stroke-[2.5]" />
              <span className="text-[9px] font-black tracking-wider">JUMP</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
