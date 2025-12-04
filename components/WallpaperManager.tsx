import React, { useRef, useMemo, useCallback } from 'react';
import { TrashIcon, UploadIcon, ImageIcon, CheckIcon } from './Icons';
import { UserSettings, PresetWallpaper, BackgroundType, WallpaperFit } from '../types';
import { PRESET_WALLPAPERS } from '../constants';
import { useToast } from '../context/ToastContext';
import { useTranslation } from '../i18n';

interface WallpaperManagerProps {
  settings: UserSettings;
  onUpdateSettings: (newSettings: UserSettings) => void;
}

const WallpaperManager: React.FC<WallpaperManagerProps> = ({ settings, onUpdateSettings }) => {
  const [customUrl, setCustomUrl] = React.useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();
  const { t } = useTranslation();

  const WALLPAPER_FITS: { value: WallpaperFit; label: string }[] = [
    { value: 'cover', label: t.cover },
    { value: 'contain', label: t.contain },
    { value: 'fill', label: t.fill },
    { value: 'repeat', label: t.repeat },
    { value: 'center', label: t.center },
  ];

  const handlePresetWallpaper = useCallback((preset: PresetWallpaper) => {
    onUpdateSettings({
      ...settings,
      backgroundUrl: preset.url,
      backgroundType: preset.type
    });
    // Optional: showToast(`已应用壁纸: ${preset.name}`, 'success');
  }, [settings, onUpdateSettings]);

  const handleCustomUrlApply = useCallback(() => {
    if (!customUrl.trim()) return;

    // Validate URL protocol, only allow https and http
    const trimmedUrl = customUrl.trim();
    try {
      const url = new URL(trimmedUrl);
      if (!['https:', 'http:'].includes(url.protocol)) {
        showToast(t.unsupportedProtocol, 'error');
        return;
      }
    } catch {
      showToast(t.invalidUrlFormat, 'error');
      return;
    }

    const isVideo = trimmedUrl.match(/\.(mp4|webm|ogg)$/i);
    const type: BackgroundType = isVideo ? 'video' : 'image';

    const newWallpaper: PresetWallpaper = {
      id: Date.now().toString(),
      name: 'Custom URL',
      type: type,
      url: trimmedUrl,
      isCustom: true
    };

    onUpdateSettings({
      ...settings,
      backgroundUrl: newWallpaper.url,
      backgroundType: newWallpaper.type,
      customWallpapers: [...settings.customWallpapers, newWallpaper]
    });

    setCustomUrl('');
    showToast(t.customWallpaperApplied, 'success');
  }, [customUrl, settings, onUpdateSettings, showToast, t]);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // File size limit: 3.5MB (approximately 4.7MB after Base64 encoding, leaving space for other settings data)
    const MAX_FILE_SIZE = 3.5 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      showToast(t.fileSizeExceeded, 'error', 5000);
      e.target.value = '';
      return;
    }

    // Strict MIME type validation
    const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/ogg'];
    const ALLOWED_TYPES = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES];

    if (!ALLOWED_TYPES.includes(file.type)) {
      showToast(t.unsupportedFileType, 'error', 4000);
      e.target.value = '';
      return;
    }

    const type: BackgroundType = ALLOWED_VIDEO_TYPES.includes(file.type) ? 'video' : 'image';

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Url = event.target?.result as string;

      // Validate that file content matches the declared MIME type
      if (type === 'image' && !base64Url.startsWith('data:image/')) {
        showToast(t.fileContentMismatch, 'error');
        return;
      }
      if (type === 'video' && !base64Url.startsWith('data:video/')) {
        showToast(t.fileContentMismatch, 'error');
        return;
      }

      // Check Base64 encoded size
      const base64Size = new Blob([base64Url]).size;
      const estimatedTotalSize = base64Size + JSON.stringify(settings).length;

      // localStorage limit is 5MB, we set a strict 5MB limit
      if (estimatedTotalSize > 5 * 1024 * 1024) {
        showToast(t.storageFull, 'error', 5000);
        return;
      }

      const newWallpaper: PresetWallpaper = {
        id: Date.now().toString(),
        name: file.name,
        type: type,
        url: base64Url,
        isCustom: true
      };

      try {
        onUpdateSettings({
          ...settings,
          backgroundUrl: base64Url,
          backgroundType: type,
          customWallpapers: [...settings.customWallpapers, newWallpaper]
        });
        showToast(t.wallpaperUploaded, 'success');
      } catch (error) {
        showToast(t.storageFull, 'error', 5000);
        console.error('Failed to save wallpaper:', error);
      }
    };

    reader.onerror = () => {
      showToast(t.fileContentMismatch, 'error');
    };

    reader.readAsDataURL(file);
    e.target.value = '';
  }, [settings, onUpdateSettings, showToast, t]);

  const handleDeleteWallpaper = useCallback((e: React.MouseEvent, wallpaperToDelete: PresetWallpaper) => {
    e.stopPropagation();
    if (!wallpaperToDelete.isCustom) return;

    const newCustomWallpapers = settings.customWallpapers.filter(
      w => w.id !== wallpaperToDelete.id && w.url !== wallpaperToDelete.url
    );

    let newBgUrl = settings.backgroundUrl;
    let newBgType = settings.backgroundType;

    if (settings.backgroundUrl === wallpaperToDelete.url) {
      newBgUrl = PRESET_WALLPAPERS[0].url;
      newBgType = PRESET_WALLPAPERS[0].type;
    }

    onUpdateSettings({
      ...settings,
      customWallpapers: newCustomWallpapers,
      backgroundUrl: newBgUrl,
      backgroundType: newBgType
    });
    showToast(t.wallpaperDeleted, 'info');
  }, [settings, onUpdateSettings, showToast, t]);

  const allWallpapers = useMemo(() => {
    return [...PRESET_WALLPAPERS, ...settings.customWallpapers];
  }, [settings.customWallpapers]);

  return (
    <div className="space-y-3">
      <span className="text-white/80 font-light block">{t.wallpaperSettings}</span>

      {/* Wallpaper grid */}
      <div className="grid grid-cols-3 gap-2">
        {allWallpapers.map((preset) => (
          <button
            key={preset.id || preset.url}
            onClick={() => handlePresetWallpaper(preset)}
            className={`
              relative aspect-video rounded-lg overflow-hidden border transition-all duration-200 group
              ${settings.backgroundUrl === preset.url ? 'border-white ring-1 ring-white' : 'border-white/10 hover:border-white/40'}
            `}
          >
            <img
              src={preset.thumbnail || preset.url}
              alt={preset.name}
              className="w-full h-full object-cover"
            />
            {preset.type === 'video' && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                <div className="w-6 h-6 rounded-full border border-white/50 flex items-center justify-center bg-black/30">
                  <div className="w-0 h-0 border-t-[4px] border-t-transparent border-l-[6px] border-l-white border-b-[4px] border-b-transparent ml-0.5" />
                </div>
              </div>
            )}
            {settings.backgroundUrl === preset.url && (
              <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                <CheckIcon className="w-6 h-6 text-white drop-shadow-md" />
              </div>
            )}

            {preset.isCustom && (
              <div
                className="absolute top-1 right-1 p-1 rounded-full bg-black/50 text-white/60 hover:text-white hover:bg-red-500/80 transition-colors opacity-0 group-hover:opacity-100"
                onClick={(e) => handleDeleteWallpaper(e, preset)}
                title={t.deleteWallpaper}
              >
                <TrashIcon className="w-3 h-3" />
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Custom wallpaper controls */}
      <div className="space-y-2 pt-1">
        {/* Local upload */}
        <div className="flex gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-colors text-sm text-white/80 hover:text-white"
          >
            <UploadIcon className="w-4 h-4" />
            <span>{t.uploadImageVideo}</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>

        {/* URL input */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40">
              <ImageIcon className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={customUrl}
              onChange={(e) => setCustomUrl(e.target.value)}
              placeholder={t.enterImageVideoUrl}
              className="w-full bg-black/20 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-sm text-white focus:border-white/30 focus:outline-none transition-colors"
              onKeyDown={(e) => e.key === 'Enter' && handleCustomUrlApply()}
            />
          </div>
          <button
            onClick={handleCustomUrlApply}
            disabled={!customUrl.trim()}
            className="px-3 py-2 bg-white text-black text-xs font-bold rounded-xl hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {t.apply}
          </button>
        </div>
      </div>

      {/* Wallpaper fit mode */}
      <div className="space-y-1 pt-1">
        <div className="flex gap-2 p-1 bg-white/5 rounded-xl overflow-x-auto custom-scrollbar">
          {WALLPAPER_FITS.map((fit) => (
            <button
              key={fit.value}
              onClick={() => onUpdateSettings({ ...settings, wallpaperFit: fit.value })}
              className={`
                flex-1 px-3 py-1.5 text-xs rounded-lg whitespace-nowrap transition-colors border
                ${settings.wallpaperFit === fit.value || (!settings.wallpaperFit && fit.value === 'cover')
                  ? 'bg-white text-black font-medium border-white'
                  : 'bg-transparent text-white/60 border-transparent hover:text-white hover:bg-white/10'}
              `}
            >
              {fit.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WallpaperManager;
