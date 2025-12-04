
import React from 'react';
import { XIcon } from './Icons';
import { UserSettings } from '../types';
import ThemeSettings from './ThemeSettings';
import WallpaperManager from './WallpaperManager';
import SearchEngineManager from './SearchEngineManager';
import { useTranslation } from '../i18n';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;
  onUpdateSettings: (newSettings: UserSettings) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, settings, onUpdateSettings }) => {
  const { t } = useTranslation();

  if (!isOpen) return null;

  // Handler to block right-click context menu within the settings modal
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onContextMenu={handleContextMenu}
    >
      {/* Background overlay */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal content */}
      <div className="
        relative w-full max-w-md rounded-3xl
        bg-[#1a1a1a]/90 backdrop-blur-xl
        border border-white/10
        shadow-[0_20px_50px_rgba(0,0,0,0.5)]
        text-white animate-in fade-in zoom-in-95 duration-200
        max-h-[85vh] flex flex-col overflow-hidden
      ">
        {/* Header - fixed */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 shrink-0 z-10">
          <h2 className="text-2xl font-light tracking-wide">{t.settings}</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 transition-colors text-white/70 hover:text-white"
          >
            <XIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Scrollable area */}
        <div className="flex-1 overflow-y-auto px-6 pb-6 custom-scrollbar">
          <div className="space-y-8">

            {/* Appearance settings section */}
            <div className="space-y-6">
              <h3 className="text-sm font-semibold text-white/40 uppercase tracking-wider">{t.appearance}</h3>

              {/* Theme settings component */}
              <ThemeSettings settings={settings} onUpdateSettings={onUpdateSettings} />

              {/* Wallpaper manager component */}
              <WallpaperManager settings={settings} onUpdateSettings={onUpdateSettings} />
            </div>

            <div className="h-[1px] bg-white/10 w-full" />

            {/* Search engine manager component */}
            <SearchEngineManager settings={settings} onUpdateSettings={onUpdateSettings} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
