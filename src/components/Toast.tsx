/* eslint-disable react-refresh/only-export-components */
import { useEffect, useState, createContext, useContext, useCallback, type ReactNode } from 'react';
import { CheckCircle, AlertTriangle, X, Info, XCircle } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration: number;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType>({ showToast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const showTimer = setTimeout(() => setVisible(true), 10);
    const hideTimer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onRemove(toast.id), 300);
    }, toast.duration);
    return () => { clearTimeout(showTimer); clearTimeout(hideTimer); };
  }, [toast, onRemove]);

  const icons = {
    success: <CheckCircle size={16} className="text-emerald-600 flex-shrink-0" />,
    error: <XCircle size={16} className="text-red-600 flex-shrink-0" />,
    warning: <AlertTriangle size={16} className="text-amber-600 flex-shrink-0" />,
    info: <Info size={16} className="text-sky-600 flex-shrink-0" />,
  };

  const bgColors = {
    success: 'bg-emerald-50 border-emerald-200',
    error: 'bg-red-50 border-red-200',
    warning: 'bg-amber-50 border-amber-200',
    info: 'bg-sky-50 border-sky-200',
  };

  return (
    <div
      className={`flex items-center gap-2.5 px-4 py-3 rounded-lg border shadow-lg text-sm font-medium text-slate-700 transition-all duration-300 ${bgColors[toast.type]} ${
        visible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}
    >
      {icons[toast.type]}
      <span className="flex-1 min-w-0">{toast.message}</span>
      <button
        onClick={() => { setVisible(false); setTimeout(() => onRemove(toast.id), 300); }}
        className="text-slate-400 hover:text-slate-600 flex-shrink-0 rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-advisa-primary"
        aria-label="Dismiss notification"
      >
        <X size={14} aria-hidden />
      </button>
    </div>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'success', duration: number = 3500) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setToasts(prev => [...prev.slice(-4), { id, message, type, duration }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm">
        {toasts.map(toast => (
          <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}
