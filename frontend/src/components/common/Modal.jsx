import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

// placement: 'sheet' slides up from the bottom on phones; 'center' stays centered on every screen
const Modal = ({ isOpen, onClose, title, description, children, maxWidth = 'max-w-lg', bodyClassName = 'p-5', placement = 'sheet' }) => {
  const isCentered = placement === 'center';

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className={`fixed inset-0 z-50 flex justify-center overflow-y-auto ${
        isCentered ? 'items-center p-3 sm:p-6' : 'items-end sm:items-center p-0 sm:p-6'
      }`}
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-[2px] animate-fade-in"
        onClick={onClose}
      />

      {/* Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === 'string' ? title : undefined}
        className={`relative w-full ${maxWidth} bg-ink-850 border border-line shadow-pop z-10 animate-scale-in sm:my-8 modal-max-h flex flex-col ${
          isCentered ? 'rounded-2xl' : 'rounded-t-2xl sm:rounded-2xl pb-[env(safe-area-inset-bottom)] sm:pb-0'
        }`}
      >
        {title && (
          <div className="flex items-start justify-between gap-4 px-5 pt-5 pb-1">
            <div className="min-w-0">
              <h3 className="text-[15px] font-semibold text-fg">{title}</h3>
              {description && <p className="mt-1 text-[13px] text-fg-muted">{description}</p>}
            </div>
            <button
              onClick={onClose}
              aria-label="Close"
              className="-mr-1.5 -mt-1 p-1.5 rounded-md text-fg-subtle hover:text-fg hover:bg-white/[0.06] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className={`overflow-y-auto ${bodyClassName}`}>{children}</div>
      </div>
    </div>,
    document.body
  );
};

export default Modal;
