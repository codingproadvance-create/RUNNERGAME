import React from 'react';
import { ArrowLeftRight, ArrowUp, ArrowDown, Magnet, Shield, Zap, Sparkles, X, Play } from 'lucide-react';
import { audioManager } from '../game/audio';

interface TutorialModalProps {
  onClose: () => void;
  isFirstLaunch?: boolean;
}

export const TutorialModal: React.FC<TutorialModalProps> = ({ onClose, isFirstLaunch }) => {
  const handleConfirm = () => {
    audioManager.playClick();
    onClose();
  };

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md select-none overflow-y-auto">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl flex flex-col my-auto max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h2 className="font-display font-black text-2xl tracking-tight text-white">
              HOW TO PLAY
            </h2>
            <p className="text-xs text-slate-400 font-medium">Master the 3-lane rush</p>
          </div>
          {!isFirstLaunch && (
            <button
              onClick={handleConfirm}
              className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Content list */}
        <div className="flex flex-col gap-3 py-3 overflow-y-auto">
          {/* Controls Section */}
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-3 flex flex-col gap-2.5">
            <span className="text-[11px] font-bold text-cyan-400 tracking-wider uppercase">
              CONTROLS (SWIPE OR ARROW KEYS)
            </span>

            {/* Gesture 1: Left / Right */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shrink-0">
                <ArrowLeftRight className="w-5 h-5" />
              </div>
              <div className="text-left">
                <div className="text-xs font-bold text-white">SWIPE LEFT / RIGHT</div>
                <div className="text-[11px] text-slate-400">Switch between the 3 road lanes</div>
              </div>
            </div>

            {/* Gesture 2: Up */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                <ArrowUp className="w-5 h-5" />
              </div>
              <div className="text-left">
                <div className="text-xs font-bold text-white">SWIPE UP (OR SPACE)</div>
                <div className="text-[11px] text-slate-400">Jump over traffic cones, barriers & crates</div>
              </div>
            </div>

            {/* Gesture 3: Down */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shrink-0">
                <ArrowDown className="w-5 h-5" />
              </div>
              <div className="text-left">
                <div className="text-xs font-bold text-white">SWIPE DOWN</div>
                <div className="text-[11px] text-slate-400">Slide under high overhead signs</div>
              </div>
            </div>
          </div>

          {/* Obstacle Rules */}
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-3 flex flex-col gap-2">
            <span className="text-[11px] font-bold text-amber-400 tracking-wider uppercase">
              OBSTACLE TACTICS
            </span>
            <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
              <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-700">
                <div className="font-extrabold text-amber-400 mb-0.5">CONE / BARRIER</div>
                <div className="text-slate-300">Jump or change lane</div>
              </div>
              <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-700">
                <div className="font-extrabold text-rose-400 mb-0.5">OVERHEAD SIGN</div>
                <div className="text-slate-300">Slide underneath!</div>
              </div>
              <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-700">
                <div className="font-extrabold text-cyan-400 mb-0.5">CARS</div>
                <div className="text-slate-300">Solid - must switch lane</div>
              </div>
            </div>
          </div>

          {/* Power-ups Section */}
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-3 flex flex-col gap-2">
            <span className="text-[11px] font-bold text-emerald-400 tracking-wider uppercase">
              POWER-UPS
            </span>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="flex items-center gap-2">
                <Magnet className="w-4 h-4 text-rose-400 shrink-0" />
                <span className="text-slate-300"><strong className="text-white">Magnet:</strong> Attracts coins</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-cyan-400 shrink-0" />
                <span className="text-slate-300"><strong className="text-white">Shield:</strong> Absorbs 1 hit</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-orange-400 shrink-0" />
                <span className="text-slate-300"><strong className="text-white">Boost:</strong> Sprints fast</span>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-slate-300"><strong className="text-white">2X Multiplier:</strong> Double score</span>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <button
          onClick={handleConfirm}
          className="mt-2 w-full h-12 rounded-2xl bg-cyan-500 hover:bg-cyan-400 active:scale-98 text-slate-950 font-display font-black text-base tracking-wider uppercase flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-all shrink-0"
        >
          <Play className="w-5 h-5 fill-current" />
          {isFirstLaunch ? 'TAP TO START' : 'GOT IT!'}
        </button>
      </div>
    </div>
  );
};
