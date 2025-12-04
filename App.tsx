
import React, { useState, useEffect, useMemo, useRef } from 'react';
import Clock from './components/Clock';
import SearchBox from './components/SearchBox';
import SettingsModal from './components/SettingsModal';
import ErrorBoundary from './components/ErrorBoundary';
import GlobalContextMenu from './components/GlobalContextMenu';
import { SettingsIcon } from './components/Icons';
import { UserSettings, WallpaperFit } from './types';
import { PRESET_WALLPAPERS, SEARCH_ENGINES, THEMES } from './constants';
import { loadSettings, saveSettings } from './utils/storage';
import { I18nProvider } from './i18n';

// Default settings - moved outside component to avoid recreation on each render
const DEFAULT_SETTINGS: UserSettings = {
  use24HourFormat: true,
  showSeconds: true,
  backgroundBlur: 8,
  searchEngines: [...SEARCH_ENGINES],
  selectedEngine: SEARCH_ENGINES[0].name,
  themeColor: THEMES[0].hex,
  searchOpacity: 0.8,
  enableMaskBlur: false,
  backgroundUrl: PRESET_WALLPAPERS[0].url,
  backgroundType: PRESET_WALLPAPERS[0].type,
  wallpaperFit: 'cover',
  customWallpapers: [],
  enableSearchHistory: true,
  searchHistory: [],
  language: 'en'
};

type ViewMode = 'search' | 'dashboard';

const App: React.FC = () => {
  // State for settings visibility
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // State for view mode (Search Panel vs Dashboard Panel)
  const [viewMode, setViewMode] = useState<ViewMode>('search');

  // State for wallpaper loaded (prevent flash)
  const [bgLoaded, setBgLoaded] = useState(false);

  // State for search box interaction (controls background blur)
  const [isSearchActive, setIsSearchActive] = useState(false);

  // Application Settings - loaded from Local Storage
  const [settings, setSettings] = useState<UserSettings>(() => loadSettings(DEFAULT_SETTINGS));

  // Flag to track if this is the initial mount
  const isInitialMount = useRef(true);

  // Save settings to Local Storage (skip initial mount)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    saveSettings(settings);
  }, [settings]);

  // Preload background when URL changes
  useEffect(() => {
    setBgLoaded(false);
    let isMounted = true;

    if (settings.backgroundType === 'image') {
      const img = new Image();
      img.src = settings.backgroundUrl;
      img.onload = () => {
        if (isMounted) {
          setBgLoaded(true);
        }
      };
      // Handle error case to avoid stuck loading state
      img.onerror = () => {
        if (isMounted) {
          setBgLoaded(true);
        }
      };

      // Cleanup function
      return () => {
        isMounted = false;
        // Clean up Image object event handlers
        img.onload = null;
        img.onerror = null;
        // Cancel image loading
        img.src = '';
      };
    } else {
      // For video, we can consider it "loaded" once it starts playing or immediately
      // depending on desired UX. Here we'll set it true immediately to show the video element
      // which handles its own buffering.
      setBgLoaded(true);
    }
  }, [settings.backgroundUrl, settings.backgroundType]);

  const handleSelectEngine = (name: string) => {
    setSettings(prev => ({ ...prev, selectedEngine: name }));
  };
  
  const handleUpdateHistory = (newHistory: string[]) => {
    setSettings(prev => ({ ...prev, searchHistory: newHistory }));
  };

  const getBackgroundStyle = (fit: WallpaperFit): React.CSSProperties => {
    const baseStyle = { backgroundImage: `url(${settings.backgroundUrl})` };
    switch (fit) {
      case 'contain':
        return { ...baseStyle, backgroundSize: 'contain', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' };
      case 'fill':
        return { ...baseStyle, backgroundSize: '100% 100%', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' };
      case 'repeat':
        return { ...baseStyle, backgroundSize: 'auto', backgroundPosition: 'top left', backgroundRepeat: 'repeat' };
      case 'center':
        return { ...baseStyle, backgroundSize: 'auto', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' };
      case 'cover':
      default:
        return { ...baseStyle, backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' };
    }
  };

  const getVideoClass = (fit: WallpaperFit) => {
    switch (fit) {
      case 'contain': return 'object-contain';
      case 'fill': return 'object-fill';
      case 'center': return 'object-none';
      case 'repeat': return 'object-cover'; // Video tile not supported natively in same way, fallback to cover
      case 'cover':
      default: return 'object-cover';
    }
  };

  // Handle right-click on the background to switch to Dashboard
  const handleBackgroundContextMenu = (e: React.MouseEvent) => {
    // If settings modal is open, let standard behavior apply (or it's covered by modal backdrop)
    if (isSettingsOpen) return;

    // We only want to capture clicks on the "background" or general containers.
    // Specific interactive elements (like SearchBox) should stop propagation.
    e.preventDefault();
    if (viewMode === 'search') {
      setViewMode('dashboard');
    }
  };

  // Handle left-click on the dashboard to return to Search
  const handleDashboardClick = (e: React.MouseEvent) => {
    if (viewMode === 'dashboard' && !isSettingsOpen) {
      setViewMode('search');
    }
  };

  const handleLanguageChange = (lang: 'en' | 'zh') => {
    setSettings(prev => ({ ...prev, language: lang }));
  };

  return (
    <ErrorBoundary>
      <I18nProvider language={settings.language} onLanguageChange={handleLanguageChange}>
        <div
          className="relative w-screen h-screen overflow-hidden bg-black text-white"
          onContextMenu={handleBackgroundContextMenu}
          onClick={handleDashboardClick}
        >
          {/* Context Menu Global Listener */}
          <GlobalContextMenu />

        {/* Background Layer */}
        <div
          className={`absolute inset-0 transition-all duration-700 ease-[cubic-bezier(0.25,0.4,0.25,1)] overflow-hidden ${bgLoaded ? 'opacity-100' : 'opacity-0'}`}
          style={{
            filter: `blur(${isSearchActive ? settings.backgroundBlur : 0}px)`,
            transform: isSearchActive ? 'scale(1.05)' : 'scale(1)',
          }}
        >
          {settings.backgroundType === 'video' ? (
             <video
               key={settings.backgroundUrl}
               className={`absolute inset-0 w-full h-full ${getVideoClass(settings.wallpaperFit)}`}
               src={settings.backgroundUrl}
               autoPlay
               loop
               muted
               playsInline
             />
          ) : (
            <div
              className="absolute inset-0 w-full h-full"
              style={getBackgroundStyle(settings.wallpaperFit)}
            />
          )}
        </div>

        {/* Overlay to ensure text readability */}
        <div className={`
          absolute inset-0 bg-black/40
          ${settings.enableMaskBlur ? 'backdrop-blur-sm' : ''}
        `} />

        {/* 
          Main Content Area (Search View) 
          Pointer events are disabled when not visible to prevent interaction with hidden elements
        */}
        <div 
          className={`
            absolute inset-0 z-10 flex flex-col items-center pt-[18vh] w-full px-4 space-y-8
            transition-all duration-500 ease-in-out
            ${viewMode === 'search' ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'}
          `}
        >
          {/* Clock Component */}
          <ErrorBoundary>
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-150">
              <Clock 
                showSeconds={settings.showSeconds} 
                use24HourFormat={settings.use24HourFormat} 
              />
            </div>
          </ErrorBoundary>

          {/* Search Input Component */}
          <ErrorBoundary>
            <div className="w-full max-w-xl animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
              <SearchBox
                engines={settings.searchEngines}
                selectedEngineName={settings.selectedEngine}
                onSelectEngine={handleSelectEngine}
                themeColor={settings.themeColor}
                opacity={settings.searchOpacity}
                onInteractionChange={setIsSearchActive}
                enableHistory={settings.enableSearchHistory}
                history={settings.searchHistory}
                onUpdateHistory={handleUpdateHistory}
              />
            </div>
          </ErrorBoundary>
        </div>

        {/* 
          Dashboard Panel (Under Development) 
          Visible only in dashboard mode
        */}
        <div 
          className={`
            absolute inset-0 z-10 flex flex-col items-center justify-center
            transition-all duration-500 ease-in-out
            ${viewMode === 'dashboard' ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-105 pointer-events-none'}
          `}
        >
          <div className="relative group cursor-default">
            <h1 className="text-4xl md:text-5xl font-extralight tracking-[0.2em] text-white/30 group-hover:text-white/50 transition-colors duration-500 select-none">
              DASHBOARD
            </h1>
            <div className="absolute -bottom-4 left-0 w-full flex justify-center">
              <span className="text-xs font-mono text-white/20 tracking-widest uppercase bg-white/5 px-2 py-0.5 rounded">
                Under Construction
              </span>
            </div>
          </div>

          {/* Top Right Settings Button - Only visible in Dashboard */}
          <div className="absolute top-6 right-6">
            <button
              onClick={(e) => {
                e.stopPropagation(); // Prevent clicking dashboard background
                setIsSettingsOpen(true);
              }}
              className="group p-3 rounded-full bg-black/20 hover:bg-white/20 backdrop-blur-md border border-white/5 hover:border-white/30 transition-all duration-300 shadow-lg"
              aria-label="Settings"
            >
              <SettingsIcon className="w-6 h-6 text-white/70 group-hover:text-white group-hover:rotate-90 transition-all duration-500" />
            </button>
          </div>
        </div>

        {/* Settings Modal */}
        <ErrorBoundary>
          <SettingsModal
            isOpen={isSettingsOpen}
            onClose={() => setIsSettingsOpen(false)}
            settings={settings}
            onUpdateSettings={setSettings}
          />
        </ErrorBoundary>
        </div>
      </I18nProvider>
    </ErrorBoundary>
  );
};

export default App;
