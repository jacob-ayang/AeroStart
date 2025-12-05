import React, { useRef, useEffect } from 'react';
import { SettingsIcon, ImageIcon, SearchIcon } from './Icons';
import { SettingsSection } from '../types';
import { useTranslation } from '../i18n';

interface SettingsMenuProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectSection: (section: SettingsSection) => void;
}

const SettingsMenu: React.FC<SettingsMenuProps> = ({ isOpen, onClose, onSelectSection }) => {
    const { t } = useTranslation();
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const menuItems: { id: SettingsSection; label: string; icon: React.ReactNode }[] = [
        { id: 'general', label: t.appearance, icon: <SettingsIcon className="w-3.5 h-3.5" /> },
        { id: 'wallpaper', label: t.wallpaperSettings, icon: <ImageIcon className="w-3.5 h-3.5" /> },
        { id: 'search', label: t.searchEngines, icon: <SearchIcon className="w-3.5 h-3.5" /> },
    ];

    return (
        <div
            ref={menuRef}
            className="absolute top-full right-0 mt-2 w-48 rounded-xl bg-[#1a1a1a]/90 backdrop-blur-xl border border-white/10 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top-right z-50"
        >
            <div className="p-1">
                {menuItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={(e) => {
                            e.stopPropagation();
                            onSelectSection(item.id);
                        }}
                        className="w-full flex items-center gap-2.5 px-2.5 py-2 text-xs text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors group whitespace-nowrap"
                    >
                        <span className="text-white/60 group-hover:text-white transition-colors">
                            {item.icon}
                        </span>
                        {item.label}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default SettingsMenu;
