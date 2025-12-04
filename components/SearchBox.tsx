
import React, { useState, KeyboardEvent, useRef, useEffect, useCallback, FocusEvent } from 'react';
import { SearchIcon, ChevronDownIcon, GlobeIcon, TrendingIcon, HistoryIcon, TrashIcon } from './Icons';
import { SearchEngine } from '../types';
import { fetchSuggestions } from '../utils/suggestions';
import { useToast } from '../context/ToastContext';
import { useTranslation } from '../i18n';

interface SearchBoxProps {
  engines: SearchEngine[];
  selectedEngineName: string;
  onSelectEngine: (name: string) => void;
  themeColor: string;
  opacity: number;
  onInteractionChange?: (isActive: boolean) => void;
  enableHistory: boolean;
  history: string[];
  onUpdateHistory: (history: string[]) => void;
}

const SearchBox: React.FC<SearchBoxProps> = ({
  engines,
  selectedEngineName,
  onSelectEngine,
  themeColor,
  opacity,
  onInteractionChange,
  enableHistory,
  history,
  onUpdateHistory
}) => {
  const [query, setQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { showToast } = useToast();
  const { t } = useTranslation();

  const selectedEngine = React.useMemo(() => {
    return engines.find(e => e.name === selectedEngineName) || engines[0];
  }, [engines, selectedEngineName]);

  // Determine if the search box should be in "Active/Expanded" mode
  const isActive = isFocused || query.length > 0 || isDropdownOpen;

  // Sync active state with parent
  useEffect(() => {
    onInteractionChange?.(isActive);
  }, [isActive, onInteractionChange]);

  // Handle outside clicks to close dropdowns and clear query
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      
      const isClickInButton = dropdownRef.current && dropdownRef.current.contains(target);
      const isClickInMenu = menuRef.current && menuRef.current.contains(target);

      if (!isClickInButton && !isClickInMenu) {
        setIsDropdownOpen(false);
      }
      
      if (containerRef.current && !containerRef.current.contains(target)) {
        setShowSuggestions(false);
        setQuery(''); // Clear query when clicking outside to restore unfocused state
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch suggestions with debounce
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.trim()) {
        const results = await fetchSuggestions(selectedEngine.name, query);
        setSuggestions(results.slice(0, 8));
        setShowSuggestions(true);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
      setSelectedIndex(-1);
    }, 200);

    return () => clearTimeout(timer);
  }, [query, selectedEngine.name]);

  const performSearch = useCallback((text: string) => {
    if (!text.trim()) return;

    // Record History
    if (enableHistory) {
      // Remove duplicate if exists, then add to front, limit to 20
      const newHistory = [text, ...history.filter(h => h !== text)].slice(0, 20);
      onUpdateHistory(newHistory);
    }

    let url = selectedEngine.urlPattern;
    if (url.includes('%s')) {
      url = url.replace('%s', encodeURIComponent(text));
    } else {
      url = `${url}${encodeURIComponent(text)}`;
    }

    // Security check: only allow http and https protocols
    try {
      const urlObj = new URL(url);
      if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') {
        console.error('Unsafe URL protocol:', urlObj.protocol);
        showToast(t.unsupportedProtocol, 'error');
        return;
      }
      window.location.href = url;
    } catch (error) {
      console.error('Invalid URL:', url, error);
      showToast(t.invalidSearchUrl, 'error');
    }
  }, [selectedEngine.urlPattern, showToast, enableHistory, history, onUpdateHistory, t]);

  const handleSearch = useCallback(() => performSearch(query), [performSearch, query]);

  const handleSuggestionClick = useCallback((suggestion: string) => {
    setQuery(suggestion);
    performSearch(suggestion);
    setShowSuggestions(false);
  }, [performSearch]);

  const handleClearHistory = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onUpdateHistory([]);
    // Keep focus
    inputRef.current?.focus();
  }, [onUpdateHistory]);

  const showHistoryDropdown = isFocused && !query && enableHistory && history.length > 0;
  // Calculate total items for keyboard navigation
  const visibleItems = showSuggestions && suggestions.length > 0 ? suggestions : (showHistoryDropdown ? history : []);

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (selectedIndex >= 0 && visibleItems[selectedIndex]) {
        handleSuggestionClick(visibleItems[selectedIndex]);
      } else {
        handleSearch();
      }
      (e.target as HTMLInputElement).blur();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev =>
        prev < visibleItems.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev =>
        prev > -1 ? prev - 1 : visibleItems.length - 1
      );
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      (e.target as HTMLInputElement).blur();
    }
  }, [selectedIndex, visibleItems, handleSuggestionClick, handleSearch]);

  const handleFocus = useCallback(() => {
    setIsFocused(true);
    if (suggestions.length > 0) setShowSuggestions(true);
  }, [suggestions.length]);

  const handleBlur = useCallback((e: FocusEvent<HTMLInputElement>) => {
    setIsFocused(false);
    // If focus moves outside the component (e.g. clicking background or tabbing out), clear the query
    if (containerRef.current && !containerRef.current.contains(e.relatedTarget as Node)) {
      setQuery('');
    }
  }, []);

  // IMPORTANT: This handler stops the context menu event from bubbling up to the App component.
  // This prevents the right-click from triggering the dashboard switch when interacting with the search box.
  const handleElementContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  return (
    <div 
      ref={containerRef}
      className="relative w-full max-w-xl z-30 group"
      style={{ opacity: opacity }}
      onContextMenu={handleElementContextMenu}
    >
      {/* 
        Enhanced Aperture/Glow Effect Layers 
        This provides the requested "increased Gaussian blur effect"
      */}
      
      {/* 1. Large ambient blur (The outer aura) */}
      <div 
        className="absolute inset-0 rounded-full pointer-events-none transition-all duration-700 ease-[cubic-bezier(0.25,0.4,0.25,1)]"
        style={{
          backgroundColor: isActive ? themeColor : 'transparent',
          filter: isActive ? 'blur(45px)' : 'blur(0px)', // High blur for aperture effect
          opacity: isActive ? 0.35 : 0,
          transform: isActive ? 'scale(1.15)' : 'scale(0.8)',
          zIndex: 10
        }}
      />
      
      {/* 2. Intense core glow (The ring) */}
      <div 
        className="absolute inset-0 rounded-full pointer-events-none transition-all duration-500 ease-out"
        style={{
          boxShadow: isActive ? `0 0 25px 5px ${themeColor}60` : 'none',
          opacity: isActive ? 0.8 : 0,
          zIndex: 10
        }}
      />

      {/* Search Input Container */}
      <div 
        className={`
          relative flex items-center w-full px-2 py-1 rounded-full
          backdrop-blur-xl transition-all duration-500 ease-out
        `}
        style={{
          backgroundColor: isActive ? 'rgba(10, 10, 10, 0.75)' : 'rgba(0, 0, 0, 0.25)',
          borderColor: isActive ? `rgba(255,255,255,0.2)` : 'rgba(255, 255, 255, 0.1)',
          borderWidth: '1px',
          borderStyle: 'solid',
          // Internal lighting
          boxShadow: isActive ? `inset 0 0 20px -5px ${themeColor}30` : 'none',
          zIndex: 50
        }}
      >
        {/* Engine Selector - Collapsible Area */}
        <div 
          className={`
            overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]
            flex items-center flex-shrink-0
          `}
          style={{
            maxWidth: isActive ? '200px' : '0px',
            opacity: isActive ? 1 : 0
          }}
        >
          <div className="relative pl-1 pr-2" ref={dropdownRef}>
            <button
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              onContextMenu={handleElementContextMenu}
              className={`
                flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-full transition-all duration-300
                ${isDropdownOpen ? 'bg-white/10 shadow-inner' : 'hover:bg-white/10'}
              `}
              style={{ color: isDropdownOpen ? themeColor : 'rgba(255,255,255,0.8)' }}
            >
              {selectedEngine.icon ? (
                <div
                  className="w-5 h-5 flex-shrink-0 [&_svg]:w-full [&_svg]:h-full"
                  dangerouslySetInnerHTML={{ __html: selectedEngine.icon }}
                />
              ) : (
                <GlobeIcon className="w-5 h-5 flex-shrink-0" />
              )}
              <span className="text-sm font-medium hidden sm:block tracking-wide whitespace-nowrap">{selectedEngine.name}</span>
              <ChevronDownIcon
                className={`w-3 h-3 opacity-60 transition-transform duration-300 flex-shrink-0 ${isDropdownOpen ? 'rotate-180' : ''}`}
              />
            </button>
          </div>
          
          {/* Vertical Separator */}
          <div className="h-5 w-[1px] bg-white/10 flex-shrink-0" />
        </div>
        
        {/* Engine Dropdown Menu */}
        {isDropdownOpen && (
          <div 
            ref={menuRef}
            className="
              absolute top-full left-4 mt-3 w-48 p-1.5 
              rounded-2xl bg-[#121212]/90 backdrop-blur-3xl
              border border-white/10 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.6)]
              animate-in fade-in slide-in-from-top-2 duration-200 
              z-[60]
            "
            onMouseDown={(e) => e.preventDefault()}
          >
            {engines.map((engine) => (
              <button
                key={engine.name}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onSelectEngine(engine.name);
                  setIsDropdownOpen(false);
                  setTimeout(() => inputRef.current?.focus(), 50);
                }}
                onContextMenu={handleElementContextMenu}
                className={`
                  w-full px-3 py-2.5 text-left text-sm rounded-xl transition-all flex items-center justify-between group
                  ${selectedEngineName === engine.name
                    ? 'bg-white/15 shadow-sm'
                    : 'text-white/60 hover:bg-white/10 hover:text-white'}
                `}
                style={{
                  color: selectedEngineName === engine.name ? themeColor : undefined
                }}
              >
                  <div className="flex items-center gap-2">
                    {engine.icon ? (
                      <div
                        className="w-4 h-4 flex-shrink-0 [&_svg]:w-full [&_svg]:h-full"
                        dangerouslySetInnerHTML={{ __html: engine.icon }}
                      />
                    ) : (
                      <GlobeIcon className="w-4 h-4 flex-shrink-0" />
                    )}
                    <span className="font-medium tracking-wide">{engine.name}</span>
                  </div>
                  {selectedEngineName === engine.name && (
                    <div
                      className="w-1.5 h-1.5 rounded-full shadow-[0_0_8px_rgba(255,255,255,0.5)]"
                      style={{ backgroundColor: themeColor, boxShadow: `0 0 8px ${themeColor}` }}
                    />
                  )}
              </button>
            ))}
          </div>
        )}
        
        {/* Input Field */}
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={isActive ? `${t.searchOn} ${selectedEngine.name}...` : t.search}
          className={`
            flex-1 w-full min-w-0 bg-transparent border-none outline-none text-base placeholder-white/40 font-light px-4
            transition-all duration-500 ease-out
            ${isActive ? 'text-left' : 'text-center placeholder-white/70'}
          `}
          style={{
            caretColor: themeColor
          }}
        />

        {/* Search Button / Icon */}
        <div 
          className={`
            transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] overflow-hidden flex items-center flex-shrink-0
          `}
          style={{
            maxWidth: isActive ? '60px' : '0px',
            opacity: isActive ? 1 : 0,
            transform: isActive ? 'translateX(0)' : 'translateX(10px)'
          }}
        >
          <button 
            onClick={handleSearch}
            onContextMenu={handleElementContextMenu}
            className="p-2 mr-1 rounded-full hover:bg-white/10 transition-colors"
          >
            <SearchIcon 
              className="w-6 h-6 transition-colors duration-300" 
              style={{ color: isActive ? themeColor : 'white' }} 
            />
          </button>
        </div>
      </div>

      {/* Suggestions / History Dropdown */}
      {((showSuggestions && suggestions.length > 0) || (showHistoryDropdown && history.length > 0)) && (
        <div className="
          absolute top-full left-0 right-0 mt-2
          bg-black/80 backdrop-blur-3xl
          border border-white/10
          rounded-2xl shadow-[0_30px_60px_-12px_rgba(0,0,0,0.8)]
          animate-in fade-in slide-in-from-top-2 duration-300
          overflow-hidden z-40
        ">
          {/* Suggestions List */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="flex flex-col gap-0.5 p-2">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  // Prevent input blur when clicking
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleSuggestionClick(suggestion)}
                  onContextMenu={handleElementContextMenu}
                  className={`
                    group relative w-full px-3 py-1 rounded-md text-left flex items-center gap-3 transition-all duration-200 ease-out
                    ${index === selectedIndex 
                      ? 'bg-white/10 text-white shadow-sm translate-x-1' 
                      : 'text-white/70 hover:bg-white/5 hover:text-white'}
                  `}
                >
                  <SearchIcon
                    className={`w-4 h-4 transition-all duration-300`}
                    style={{
                      color: index === selectedIndex ? themeColor : 'currentColor'
                    }}
                  />
                  <span className="truncate">{suggestion}</span>
                </button>
              ))}
            </div>
          )}

          {/* History List */}
          {!showSuggestions && showHistoryDropdown && (
            <div className="flex flex-col">
              <div className="px-4 py-2 text-[10px] font-semibold text-white/30 uppercase tracking-widest">
                 {t.recentSearches}
              </div>
              <div className="flex flex-col gap-0.5 px-2">
                {history.map((item, index) => (
                  <button
                    key={item + index}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleSuggestionClick(item)}
                    onContextMenu={handleElementContextMenu}
                    className={`
                      group relative w-full px-3 py-1.5 rounded-md text-left flex items-center gap-3 transition-all duration-200 ease-out
                      ${index === selectedIndex
                        ? 'bg-white/10 text-white shadow-sm translate-x-1'
                        : 'text-white/60 hover:bg-white/5 hover:text-white'}
                    `}
                  >
                    <HistoryIcon
                      className={`w-4 h-4 transition-all duration-300`}
                      style={{
                        color: index === selectedIndex ? themeColor : 'currentColor',
                        opacity: index === selectedIndex ? 1 : 0.6
                      }}
                    />
                    <span className="truncate font-light">{item}</span>
                  </button>
                ))}
              </div>
              <div className="h-[1px] bg-white/5 my-2 mx-2" />
              <div className="px-2 pb-2">
                 <button
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={handleClearHistory}
                    className="w-full flex items-center justify-center gap-2 py-1.5 rounded-md text-xs text-white/30 hover:text-red-400 hover:bg-white/5 transition-all duration-200"
                 >
                    <TrashIcon className="w-3 h-3" />
                    <span>{t.clearHistory}</span>
                 </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBox;
