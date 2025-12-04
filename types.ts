

export interface SearchEngine {
  name: string;
  urlPattern: string;
  icon?: string;
}

export type BackgroundType = 'image' | 'video';

export type WallpaperFit = 'cover' | 'contain' | 'fill' | 'repeat' | 'center';

export interface PresetWallpaper {
  id?: string;
  name: string;
  type: BackgroundType;
  url: string;
  thumbnail?: string;
  isCustom?: boolean;
}

export type Language = 'en' | 'zh';

export interface UserSettings {
  use24HourFormat: boolean;
  showSeconds: boolean;
  backgroundBlur: number;
  searchEngines: SearchEngine[];
  selectedEngine: string;
  themeColor: string;
  searchOpacity: number;
  enableMaskBlur: boolean;
  backgroundUrl: string;
  backgroundType: BackgroundType;
  wallpaperFit: WallpaperFit;
  customWallpapers: PresetWallpaper[];
  enableSearchHistory: boolean;
  searchHistory: string[];
  language: Language;
}
