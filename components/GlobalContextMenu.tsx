import React, { useEffect, useState, useRef, useCallback } from 'react';
import { CopyIcon, ScissorsIcon, ClipboardIcon } from './Icons';
import { useToast } from '../context/ToastContext';
import { useTranslation } from '../i18n';

interface MenuPosition {
  x: number;
  y: number;
}

const GlobalContextMenu: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState<MenuPosition>({ x: 0, y: 0 });
  const targetRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const { showToast } = useToast();
  const { t } = useTranslation();

  const handleContextMenu = useCallback((event: MouseEvent) => {
    // Safety check for target
    if (!(event.target instanceof HTMLElement)) return;

    const target = event.target as HTMLElement;

    // Check if target is input or textarea
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
      const inputTarget = target as HTMLInputElement | HTMLTextAreaElement;

      // Don't show custom menu for non-text inputs (like range, color, checkbox) unless it's search/text/url/etc
      const type = inputTarget.getAttribute('type');
      const validTypes = ['text', 'search', 'url', 'email', 'password', 'tel', 'number', null, ''];

      if (inputTarget.tagName === 'INPUT' && !validTypes.includes(type)) {
        return;
      }

      // Prevent default browser menu
      // NOTE: We do NOT call event.stopPropagation() here anymore.
      // This allows the event to bubble to React handlers (like SearchBox)
      // which will handle stopping propagation to the App background.
      event.preventDefault();
      
      targetRef.current = inputTarget;

      // Calculate position to prevent overflow
      const menuWidth = 160;
      const menuHeight = 130;
      let x = event.clientX;
      let y = event.clientY;

      if (x + menuWidth > window.innerWidth) {
        x = window.innerWidth - menuWidth - 10;
      }
      if (y + menuHeight > window.innerHeight) {
        y = window.innerHeight - menuHeight - 10;
      }

      setPosition({ x, y });
      setVisible(true);
    } else {
      // If clicked elsewhere, hide menu
      setVisible(false);
    }
  }, []);

  const handleClick = useCallback((event: MouseEvent) => {
    if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
      setVisible(false);
    }
  }, []);

  const handleScroll = useCallback(() => {
    if (visible) setVisible(false);
  }, [visible]);

  useEffect(() => {
    // Use capture phase (true) to catch the event early
    document.addEventListener('contextmenu', handleContextMenu, true);
    document.addEventListener('click', handleClick);
    document.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleScroll);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu, true);
      document.removeEventListener('click', handleClick);
      document.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleScroll);
    };
  }, [handleContextMenu, handleClick, handleScroll]);

  const updateReactState = (element: HTMLInputElement | HTMLTextAreaElement, newValue: string) => {
    // This helper is crucial for React controlled components
    // We must trigger a proper 'input' event so React updates its state
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      "value"
    )?.set;
    
    const nativeTextAreaValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLTextAreaElement.prototype,
      "value"
    )?.set;

    if (element.tagName === 'INPUT' && nativeInputValueSetter) {
      nativeInputValueSetter.call(element, newValue);
    } else if (element.tagName === 'TEXTAREA' && nativeTextAreaValueSetter) {
      nativeTextAreaValueSetter.call(element, newValue);
    } else {
      element.value = newValue;
    }

    const event = new Event('input', { bubbles: true });
    element.dispatchEvent(event);
  };

  const handleCopy = async () => {
    if (!targetRef.current) return;
    const element = targetRef.current;
    const selection = element.value.substring(
      element.selectionStart || 0,
      element.selectionEnd || 0
    );

    if (selection) {
      try {
        await navigator.clipboard.writeText(selection);
        // showToast(t.copy, 'success', 1000);
      } catch (err) {
        console.error('Failed to copy: ', err);
        showToast(t.copyFailed, 'error');
      }
    }
    setVisible(false);
    element.focus();
  };

  const handleCut = async () => {
    if (!targetRef.current) return;
    const element = targetRef.current;
    const start = element.selectionStart || 0;
    const end = element.selectionEnd || 0;
    const selection = element.value.substring(start, end);

    if (selection) {
      try {
        await navigator.clipboard.writeText(selection);
        const newValue = element.value.slice(0, start) + element.value.slice(end);
        updateReactState(element, newValue);
        // Restore cursor position
        element.setSelectionRange(start, start);
        // showToast(t.cut, 'success', 1000);
      } catch (err) {
        console.error('Failed to cut: ', err);
        showToast(t.cutFailed, 'error');
      }
    }
    setVisible(false);
    element.focus();
  };

  const handlePaste = async () => {
    if (!targetRef.current) return;
    const element = targetRef.current;

    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        const start = element.selectionStart || 0;
        const end = element.selectionEnd || 0;

        const newValue = element.value.slice(0, start) + text + element.value.slice(end);
        updateReactState(element, newValue);

        // Move cursor to end of pasted text
        const newCursorPos = start + text.length;
        element.setSelectionRange(newCursorPos, newCursorPos);
      }
    } catch (err) {
      console.error('Failed to paste: ', err);
      showToast(t.cannotReadClipboard, 'error');
    }
    
    setVisible(false);
    element.focus();
  };

  if (!visible) return null;

  return (
    <div
      ref={menuRef}
      className="
        fixed z-[9999] min-w-[140px] py-1.5
        rounded-xl bg-[#1a1a1a]/95 backdrop-blur-xl
        border border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.6)]
        animate-in fade-in zoom-in-95 duration-200 origin-top-left
      "
      style={{
        top: position.y,
        left: position.x,
      }}
    >
      <div className="flex flex-col gap-0.5 px-1.5">
        <button
          onClick={handleCopy}
          className="
            flex items-center gap-3 px-3 py-2 text-sm text-white/90 rounded-lg
            hover:bg-white/10 transition-colors w-full text-left group
          "
        >
          <CopyIcon className="w-4 h-4 text-white/60 group-hover:text-white" />
          <span>{t.copy}</span>
        </button>

        <button
          onClick={handleCut}
          className="
            flex items-center gap-3 px-3 py-2 text-sm text-white/90 rounded-lg
            hover:bg-white/10 transition-colors w-full text-left group
          "
        >
          <ScissorsIcon className="w-4 h-4 text-white/60 group-hover:text-white" />
          <span>{t.cut}</span>
        </button>

        <div className="h-[1px] bg-white/10 my-1 mx-1" />

        <button
          onClick={handlePaste}
          className="
            flex items-center gap-3 px-3 py-2 text-sm text-white/90 rounded-lg
            hover:bg-white/10 transition-colors w-full text-left group
          "
        >
          <ClipboardIcon className="w-4 h-4 text-white/60 group-hover:text-white" />
          <span>{t.paste}</span>
        </button>
      </div>
    </div>
  );
};

export default GlobalContextMenu;