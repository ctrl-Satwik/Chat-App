import React, { useEffect, useRef, useState } from 'react';

// Minimal dropdown menu: <Dropdown trigger={(props) => <IconButton {...props} />} items={[...]} />
const Dropdown = ({ trigger, items, align = 'right' }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const handleKey = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      {trigger({ onClick: () => setOpen((o) => !o), active: open, 'aria-expanded': open, 'aria-haspopup': 'menu' })}
      {open && (
        <div
          role="menu"
          className={`absolute top-full mt-1.5 z-40 min-w-[180px] p-1 rounded-xl bg-ink-800 border border-line shadow-pop animate-scale-in ${
            align === 'right' ? 'right-0 origin-top-right' : 'left-0 origin-top-left'
          }`}
        >
          {items.map((item, i) =>
            item.divider ? (
              <div key={i} className="my-1 h-px bg-line" />
            ) : (
              <button
                key={item.label}
                role="menuitem"
                onClick={() => {
                  setOpen(false);
                  item.onClick();
                }}
                className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] text-left transition-colors ${
                  item.danger
                    ? 'text-red-300 hover:bg-danger/10'
                    : 'text-fg-muted hover:text-fg hover:bg-white/[0.06]'
                }`}
              >
                {item.icon && <item.icon className="w-4 h-4 flex-shrink-0" />}
                {item.label}
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
};

export default Dropdown;
