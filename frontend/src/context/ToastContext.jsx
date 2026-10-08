import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

const ICONS = {
  success: { Icon: CheckCircle2, className: 'text-success' },
  error: { Icon: AlertCircle, className: 'text-red-400' },
  info: { Icon: Info, className: 'text-accent-400' },
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback(
    (type, message, { duration = 3200, action } = {}) => {
      const id = ++idRef.current;
      setToasts((prev) => [...prev.slice(-3), { id, type, message, action }]);
      if (duration) {
        setTimeout(() => dismiss(id), duration);
      }
      return id;
    },
    [dismiss]
  );

  const toast = useMemo(
    () => ({
      success: (msg, opts) => show('success', msg, opts),
      error: (msg, opts) => show('error', msg, opts),
      info: (msg, opts) => show('info', msg, opts),
      dismiss,
    }),
    [show, dismiss]
  );

  return (
    <ToastContext.Provider value={toast}>
      {children}
      {createPortal(
        <div
          className="fixed z-[70] top-[max(0.75rem,env(safe-area-inset-top))] sm:top-auto sm:bottom-5 left-1/2 -translate-x-1/2 sm:left-auto sm:right-5 sm:translate-x-0 flex flex-col items-center sm:items-end gap-2 w-[calc(100%-2rem)] sm:w-auto pointer-events-none"
          aria-live="polite"
        >
          {toasts.map(({ id, type, message, action }) => {
            const { Icon, className } = ICONS[type] || ICONS.info;
            return (
              <div
                key={id}
                role={type === 'error' ? 'alert' : 'status'}
                className="pointer-events-auto flex items-center gap-2.5 w-full sm:w-auto sm:min-w-[260px] max-w-sm pl-3.5 pr-2 py-2.5 rounded-xl bg-ink-800 border border-line shadow-pop animate-toast-in"
              >
                <Icon className={`w-4 h-4 flex-shrink-0 ${className}`} />
                <span className="flex-1 text-[13px] text-fg leading-snug">{message}</span>
                {action && (
                  <button
                    onClick={() => {
                      action.onClick();
                      dismiss(id);
                    }}
                    className="text-xs font-semibold text-accent-300 hover:text-accent-400 px-2 py-1 rounded-md hover:bg-white/[0.05]"
                  >
                    {action.label}
                  </button>
                )}
                <button
                  onClick={() => dismiss(id)}
                  aria-label="Dismiss"
                  className="p-1 rounded-md text-fg-subtle hover:text-fg hover:bg-white/[0.06] transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);
