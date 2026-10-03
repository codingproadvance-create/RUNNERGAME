import React from 'react';
import { User, Check, Lock, X } from 'lucide-react';
import { CharacterSkin } from '../game/types';
import { DEFAULT_SKINS } from '../utils/constants';
import { audioManager } from '../game/audio';
import {
  setSelectedSkinId,
  unlockSkin,
  spendCoins,
  loadSavedStats,
} from '../utils/storage';

interface CharacterSelectModalProps {
  currentSkinId: string;
  unlockedSkinIds: string[];
  totalCoins: number;
  onSkinSelected: (skin: CharacterSkin) => void;
  onRefreshStats: () => void;
  onClose: () => void;
}

export const CharacterSelectModal: React.FC<CharacterSelectModalProps> = ({
  currentSkinId,
  unlockedSkinIds,
  totalCoins,
  onSkinSelected,
  onRefreshStats,
  onClose,
}) => {
  const handleSelect = (skin: CharacterSkin) => {
    audioManager.playClick();
    setSelectedSkinId(skin.id);
    onSkinSelected(skin);
  };

  const handleUnlock = (skin: CharacterSkin) => {
    if (totalCoins >= skin.requiredCoins) {
      if (spendCoins(skin.requiredCoins)) {
        unlockSkin(skin.id);
        setSelectedSkinId(skin.id);
        audioManager.playPowerUp();
        onRefreshStats();
        onSkinSelected(skin);
      }
    }
  };

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md select-none">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h2 className="font-display font-black text-2xl tracking-tight text-white flex items-center gap-2">
              <User className="w-6 h-6 text-cyan-400" />
              RUNNER SKINS
            </h2>
            <p className="text-xs text-slate-400 font-medium">Select your cyber runner outfit</p>
          </div>
          <button
            onClick={() => {
              audioManager.playClick();
              onClose();
            }}
            className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Coins indicator */}
        <div className="flex items-center justify-between py-2 text-xs text-slate-400 border-b border-slate-800/60 mb-2">
          <span>Available Coins:</span>
          <span className="font-tabular font-extrabold text-amber-300 text-sm">
            {totalCoins.toLocaleString()}
          </span>
        </div>

        {/* Skins list */}
        <div className="flex flex-col gap-3 py-2 overflow-y-auto max-h-[60vh]">
          {DEFAULT_SKINS.map((skin) => {
            const isUnlocked = unlockedSkinIds.includes(skin.id) || skin.requiredCoins === 0;
            const isEquipped = skin.id === currentSkinId;
            const canAfford = totalCoins >= skin.requiredCoins;

            return (
              <div
                key={skin.id}
                className={`p-3 rounded-2xl border transition-all flex items-center justify-between ${
                  isEquipped
                    ? 'bg-slate-800 border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.2)]'
                    : 'bg-slate-800/50 border-slate-700/60 hover:border-slate-600'
                }`}
              >
                {/* Character preview swatch */}
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-md relative"
                    style={{ backgroundColor: skin.jacketColor }}
                  >
                    <User className="w-6 h-6" />
                    {/* Glowing dot indicator */}
                    <div
                      className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-slate-900"
                      style={{ backgroundColor: skin.glowColor }}
                    />
                  </div>

                  <div>
                    <div className="text-sm font-bold text-white flex items-center gap-1.5">
                      {skin.name}
                      {isEquipped && (
                        <span className="text-[10px] font-extrabold text-cyan-400 bg-cyan-950/80 px-1.5 py-0.5 rounded border border-cyan-800">
                          EQUIPPED
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400">{skin.tagline}</div>
                  </div>
                </div>

                {/* Action button: Equip or Unlock */}
                <div>
                  {isUnlocked ? (
                    <button
                      onClick={() => handleSelect(skin)}
                      disabled={isEquipped}
                      className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1 transition-all ${
                        isEquipped
                          ? 'bg-cyan-500/20 text-cyan-400 cursor-default'
                          : 'bg-slate-700 hover:bg-cyan-500 hover:text-slate-950 text-white active:scale-95'
                      }`}
                    >
                      {isEquipped ? <Check className="w-4 h-4" /> : 'Select'}
                    </button>
                  ) : (
                    <button
                      onClick={() => handleUnlock(skin)}
                      disabled={!canAfford}
                      className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all ${
                        canAfford
                          ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 active:scale-95'
                          : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      }`}
                    >
                      <Lock className="w-3.5 h-3.5" />
                      {skin.requiredCoins}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Close Button */}
        <button
          onClick={() => {
            audioManager.playClick();
            onClose();
          }}
          className="mt-3 w-full h-11 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-98 text-slate-200 font-bold text-sm transition-colors"
        >
          CONFIRM
        </button>
      </div>
    </div>
  );
};
