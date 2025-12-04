import React, { useState, useCallback } from 'react';
import { TrashIcon, PlusIcon, GripVerticalIcon, EditIcon } from './Icons';
import { UserSettings, SearchEngine } from '../types';
import { useToast } from '../context/ToastContext';
import { useTranslation } from '../i18n';

interface SearchEngineManagerProps {
  settings: UserSettings;
  onUpdateSettings: (newSettings: UserSettings) => void;
}

const SearchEngineManager: React.FC<SearchEngineManagerProps> = ({ settings, onUpdateSettings }) => {
  const [newEngineName, setNewEngineName] = useState('');
  const [newEngineUrl, setNewEngineUrl] = useState('');
  const [newEngineIcon, setNewEngineIcon] = useState('');
  const [isAddingEngine, setIsAddingEngine] = useState(false);
  const [editingOriginalName, setEditingOriginalName] = useState<string | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const { showToast } = useToast();
  const { t } = useTranslation();

  const handleDeleteEngine = useCallback((nameToDelete: string) => {
    if (settings.searchEngines.length <= 1) return;

    const newEngines = settings.searchEngines.filter(e => e.name !== nameToDelete);
    let newSelected = settings.selectedEngine;

    if (settings.selectedEngine === nameToDelete) {
      newSelected = newEngines[0].name;
    }

    onUpdateSettings({
      ...settings,
      searchEngines: newEngines,
      selectedEngine: newSelected
    });
    showToast(t.searchEngineDeleted, 'success');
  }, [settings, onUpdateSettings, showToast, t]);

  const handleSetDefault = useCallback((name: string) => {
    onUpdateSettings({ ...settings, selectedEngine: name });
    // Optional: showToast(`已设置 ${name} 为默认搜索引擎`, 'success');
  }, [settings, onUpdateSettings]);

  const handleDragStart = useCallback((e: React.DragEvent<HTMLDivElement>, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", index.toString());
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newEngines = [...settings.searchEngines];
    const draggedItem = newEngines[draggedIndex];
    newEngines.splice(draggedIndex, 1);
    newEngines.splice(index, 0, draggedItem);

    onUpdateSettings({ ...settings, searchEngines: newEngines });
    setDraggedIndex(index);
  }, [draggedIndex, settings, onUpdateSettings]);

  const handleDragEnd = useCallback(() => {
    setDraggedIndex(null);
  }, []);

  const handleEditEngine = useCallback((engine: SearchEngine) => {
    setNewEngineName(engine.name);
    setNewEngineUrl(engine.urlPattern);
    setNewEngineIcon(engine.icon || '');
    setEditingOriginalName(engine.name);
    setIsAddingEngine(true);
  }, []);

  const handleSaveEngine = useCallback(() => {
    if (!newEngineName.trim() || !newEngineUrl.trim()) return;

    const name = newEngineName.trim();
    
    // Check for duplicate name if we are adding new or renaming
    const isRenaming = editingOriginalName && editingOriginalName !== name;
    const isAdding = !editingOriginalName;
    
    if (isAdding || isRenaming) {
        const exists = settings.searchEngines.some(e => e.name === name);
        if (exists) {
            showToast(t.duplicateEngineName, 'error');
            return;
        }
    }

    const newEngine: SearchEngine = {
      name: name,
      urlPattern: newEngineUrl.trim(),
      icon: newEngineIcon.trim() || undefined
    };

    let updatedEngines = [...settings.searchEngines];
    let updatedSelected = settings.selectedEngine;

    if (editingOriginalName) {
        // Update existing
        const index = updatedEngines.findIndex(e => e.name === editingOriginalName);
        if (index !== -1) {
            updatedEngines[index] = newEngine;
        }

        // If the edited engine was the selected one, update the selection reference
        if (settings.selectedEngine === editingOriginalName) {
            updatedSelected = newEngine.name;
        }
        showToast(t.searchEngineUpdated, 'success');
    } else {
        // Add new
        updatedEngines.push(newEngine);
        showToast(t.newSearchEngineAdded, 'success');
    }

    onUpdateSettings({
      ...settings,
      searchEngines: updatedEngines,
      selectedEngine: updatedSelected
    });

    setNewEngineName('');
    setNewEngineUrl('');
    setNewEngineIcon('');
    setEditingOriginalName(null);
    setIsAddingEngine(false);
  }, [newEngineName, newEngineUrl, newEngineIcon, editingOriginalName, settings, onUpdateSettings, showToast, t]);

  const handleCancel = useCallback(() => {
    setIsAddingEngine(false);
    setNewEngineName('');
    setNewEngineUrl('');
    setNewEngineIcon('');
    setEditingOriginalName(null);
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white/40 uppercase tracking-wider">{t.searchEngines}</h3>
        {!isAddingEngine && (
          <button
            onClick={() => {
                setEditingOriginalName(null);
                setNewEngineName('');
                setNewEngineUrl('');
                setNewEngineIcon('');
                setIsAddingEngine(true);
            }}
            className="p-1.5 rounded-full hover:bg-white/10 transition-colors"
            style={{ color: settings.themeColor }}
            title={t.addCustomEngine}
          >
            <PlusIcon className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Search engine list */}
      <div className="space-y-2">
        {settings.searchEngines.map((engine, index) => (
          <div
            key={engine.name}
            draggable
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragEnd={handleDragEnd}
            className={`
              flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 group transition-all duration-200
              ${draggedIndex === index ? 'opacity-40 border-dashed border-white/30' : ''}
              ${editingOriginalName === engine.name ? 'ring-1 ring-white/30 bg-white/10' : ''}
            `}
          >
            <div className="flex items-center gap-3 overflow-hidden flex-1">
              {/* Drag handle */}
              <div className="cursor-grab active:cursor-grabbing text-white/20 hover:text-white/60 p-1 flex-shrink-0">
                <GripVerticalIcon className="w-4 h-4" />
              </div>

              <div className="flex flex-col overflow-hidden">
                <span className="text-sm font-medium text-white/90 truncate">{engine.name}</span>
                <span className="text-xs text-white/40 truncate font-mono">{engine.urlPattern}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 pl-2 flex-shrink-0">
              {/* Default/Set as default button */}
              {settings.selectedEngine === engine.name ? (
                <span className="text-[10px] font-medium bg-white/20 text-white/90 px-2 py-1 rounded-md whitespace-nowrap cursor-default">
                  {t.current}
                </span>
              ) : (
                <button
                  onClick={() => handleSetDefault(engine.name)}
                  className="text-[10px] font-medium bg-transparent hover:bg-white/10 text-white/40 hover:text-white px-2 py-1 rounded-md border border-white/10 transition-colors"
                >
                  {t.setDefault}
                </button>
              )}

              {/* Edit button */}
              <button
                onClick={() => handleEditEngine(engine)}
                className="p-1.5 rounded-md transition-colors text-white/20 hover:bg-white/10 hover:text-white"
                title={t.edit}
              >
                <EditIcon className="w-4 h-4" />
              </button>

              {/* Delete button */}
              <button
                onClick={() => handleDeleteEngine(engine.name)}
                disabled={settings.searchEngines.length <= 1}
                className={`
                  p-1.5 rounded-md transition-colors
                  ${settings.searchEngines.length <= 1
                    ? 'opacity-0 cursor-default'
                    : 'text-white/20 hover:bg-red-500/20 hover:text-red-400'}
                `}
                title={t.delete}
              >
                <TrashIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit engine form */}
      {isAddingEngine && (
        <div className="mt-4 p-4 rounded-xl bg-white/5 border border-white/10 space-y-3 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-white/80">
                {editingOriginalName ? t.editSearchEngine : t.addCustomEngine}
            </span>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-white/40 ml-1">{t.name}</label>
            <input
              type="text"
              value={newEngineName}
              onChange={(e) => setNewEngineName(e.target.value)}
              placeholder="e.g.: Google"
              className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-white/30 focus:outline-none transition-colors"
              autoFocus
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-white/40 ml-1">{t.searchUrl}</label>
            <input
              type="text"
              value={newEngineUrl}
              onChange={(e) => setNewEngineUrl(e.target.value)}
              placeholder="https://example.com/search?q="
              className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-white/30 focus:outline-none transition-colors font-mono"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-white/40 ml-1">{t.svgIconCode} ({t.optional})</label>
            <textarea
              value={newEngineIcon}
              onChange={(e) => setNewEngineIcon(e.target.value)}
              placeholder='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">...</svg>'
              className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-white/30 focus:outline-none transition-colors font-mono resize-none"
              rows={3}
            />
            {newEngineIcon.trim() && (
              <div className="flex items-center gap-2 mt-2 p-2 bg-black/20 rounded-lg">
                <span className="text-xs text-white/40">{t.preview}:</span>
                <div
                  className="w-5 h-5 text-white/80 [&_svg]:w-full [&_svg]:h-full"
                  dangerouslySetInnerHTML={{ __html: newEngineIcon }}
                />
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button
              onClick={handleCancel}
              className="px-3 py-1.5 text-xs text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              {t.cancel}
            </button>
            <button
              onClick={handleSaveEngine}
              disabled={!newEngineName.trim() || !newEngineUrl.trim()}
              className="px-3 py-1.5 text-xs bg-white text-black font-medium rounded-lg hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {editingOriginalName ? t.save : t.add}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchEngineManager;