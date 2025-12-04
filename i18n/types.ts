export type Language = 'en' | 'zh';

export interface Translation {
  // Common
  settings: string;
  appearance: string;
  searchEngines: string;

  // Theme Settings
  themeColor: string;
  showSeconds: string;
  use24HourFormat: string;
  maskBlurEffect: string;
  searchHistory: string;
  backgroundBlur: string;
  searchBoxOpacity: string;

  // Wallpaper Settings
  wallpaperSettings: string;
  uploadImageVideo: string;
  enterImageVideoUrl: string;
  apply: string;
  cover: string;
  contain: string;
  fill: string;
  repeat: string;
  center: string;
  deleteWallpaper: string;

  // Search Engine Manager
  addCustomEngine: string;
  editSearchEngine: string;
  name: string;
  searchUrl: string;
  svgIconCode: string;
  optional: string;
  preview: string;
  cancel: string;
  save: string;
  add: string;
  current: string;
  setDefault: string;
  edit: string;
  delete: string;

  // Search Box
  search: string;
  searchOn: string;
  recentSearches: string;
  clearHistory: string;

  // Context Menu
  copy: string;
  cut: string;
  paste: string;

  // Error Boundary
  somethingWentWrong: string;
  errorMessage: string;
  retry: string;
  refreshPage: string;

  // Toast Messages
  searchEngineDeleted: string;
  searchEngineUpdated: string;
  newSearchEngineAdded: string;
  duplicateEngineName: string;
  customWallpaperApplied: string;
  wallpaperUploaded: string;
  wallpaperDeleted: string;
  fileSizeExceeded: string;
  unsupportedFileType: string;
  fileContentMismatch: string;
  storageFull: string;
  invalidUrlFormat: string;
  unsupportedProtocol: string;
  invalidSearchUrl: string;
  copyFailed: string;
  cutFailed: string;
  cannotReadClipboard: string;

  // Clock
  monday: string;
  tuesday: string;
  wednesday: string;
  thursday: string;
  friday: string;
  saturday: string;
  sunday: string;

  // Language
  language: string;
  english: string;
  chinese: string;
}
