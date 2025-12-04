import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { XIcon, CheckIcon, AlertCircleIcon, InfoIcon } from '../components/Icons';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

interface ToastProviderProps {
  children: ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: ToastType = 'info', duration = 3500) => {
    const id = Date.now().toString() + Math.random().toString();
    setToasts((prev) => [...prev, { id, message, type }]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {createPortal(
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-3 w-full max-w-sm pointer-events-none px-4 md:px-0">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className="pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-xl bg-[#1a1a1a]/90 backdrop-blur-xl border border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.5)] animate-in slide-in-from-top-5 fade-in duration-300 text-white group"
            >
              <div className="flex-shrink-0 pt-0.5">
                {toast.type === 'success' && <CheckIcon className="w-5 h-5 text-green-400" />}
                {toast.type === 'error' && <AlertCircleIcon className="w-5 h-5 text-red-400" />}
                {toast.type === 'warning' && <AlertCircleIcon className="w-5 h-5 text-yellow-400" />}
                {toast.type === 'info' && <InfoIcon className="w-5 h-5 text-blue-400" />}
              </div>
              <p className="text-sm font-medium flex-1 break-words leading-tight opacity-90">{toast.message}</p>
              <button
                onClick={() => removeToast(toast.id)}
                className="p-1 -mt-1 -mr-1 rounded-md hover:bg-white/10 text-white/40 hover:text-white transition-colors"
              >
                <XIcon className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
};
