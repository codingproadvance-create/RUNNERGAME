import React from 'react';
import { Volume2, VolumeX, Music, Smartphone, X, Vibrate, Check } from 'lucide-react';
import { GameSettings } from '../game/types';
import { audioManager } from '../game/audio';

interface SettingsModalProps {
  settings: GameSettings;
  onUpdateSettings: (newSettings: GameSettings) => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onUpdateSettings,
  onClose,
}) => {
  const handleToggle = (key: keyof GameSettings) => {
    audioManager.playClick();
    const updated = { ...settings, [key]: !settings[key] };
    onUpdateSettings(updated);
  };

  const handleSlider = (key: 'soundVolume' | 'musicVolume', val: number) => {
    const updated = { ...settings, [key]: val };
    onUpdateSettings(updated);
  };

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md select-none">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h2 className="font-display font-black text-2xl tracking-tight text-white">
              SETTINGS
            </h2>
            <p className="text-xs text-slate-400 font-medium">Audio and controls preferences</p>
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

        {/* Options List */}
        <div className="flex flex-col gap-4 py-4">
          {/* Sound FX Toggle & Volume */}
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-3 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                {settings.soundEnabled ? (
                  <Volume2 className="w-5 h-5 text-cyan-400" />
                ) : (
                  <VolumeX className="w-5 h-5 text-slate-500" />
                )}
                <div>
                  <div className="text-sm font-bold text-white">Sound Effects</div>
                  <div className="text-[11px] text-slate-400">Jumps, slides, coin chimes</div>
                </div>
              </div>

              <button
                onClick={() => handleToggle('soundEnabled')}
                className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
                  settings.soundEnabled ? 'bg-cyan-500' : 'bg-slate-700'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    settings.soundEnabled ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {settings.soundEnabled && (
              <div className="pt-2">
                <input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.05"
                  value={settings.soundVolume}
                  onChange={(e) => handleSlider('soundVolume', parseFloat(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>
            )}
          </div>

          {/* Music Toggle & Volume */}
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-3 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Music className={`w-5 h-5 ${settings.musicEnabled ? 'text-cyan-400' : 'text-slate-500'}`} />
                <div>
                  <div className="text-sm font-bold text-white">Synthwave Music</div>
                  <div className="text-[11px] text-slate-400">Upbeat arcade synth soundtrack</div>
                </div>
              </div>

              <button
                onClick={() => handleToggle('musicEnabled')}
                className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
                  settings.musicEnabled ? 'bg-cyan-500' : 'bg-slate-700'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    settings.musicEnabled ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {settings.musicEnabled && (
              <div className="pt-2">
                <input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.05"
                  value={settings.musicVolume}
                  onChange={(e) => handleSlider('musicVolume', parseFloat(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>
            )}
          </div>

          {/* Haptic Vibration */}
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Vibrate className={`w-5 h-5 ${settings.hapticsEnabled ? 'text-amber-400' : 'text-slate-500'}`} />
              <div>
                <div className="text-sm font-bold text-white">Haptic Vibration</div>
                <div className="text-[11px] text-slate-400">Tactile rumble on mobile devices</div>
              </div>
            </div>

            <button
              onClick={() => handleToggle('hapticsEnabled')}
              className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
                settings.hapticsEnabled ? 'bg-cyan-500' : 'bg-slate-700'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  settings.hapticsEnabled ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* On-Screen Touch Buttons */}
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Smartphone className={`w-5 h-5 ${settings.showOnScreenControls ? 'text-cyan-400' : 'text-slate-500'}`} />
              <div>
                <div className="text-sm font-bold text-white">On-Screen Action Buttons</div>
                <div className="text-[11px] text-slate-400">Display tap buttons in addition to swipe</div>
              </div>
            </div>

            <button
              onClick={() => handleToggle('showOnScreenControls')}
              className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
                settings.showOnScreenControls ? 'bg-cyan-500' : 'bg-slate-700'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  settings.showOnScreenControls ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={() => {
            audioManager.playClick();
            onClose();
          }}
          className="mt-2 w-full h-11 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-98 text-slate-200 font-bold text-sm flex items-center justify-center gap-2 transition-colors"
        >
          <Check className="w-4 h-4 text-cyan-400" />
          SAVE & CLOSE
        </button>
      </div>
    </div>
  );
};
