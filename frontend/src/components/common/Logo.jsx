import React from 'react';
import { MessageSquare } from 'lucide-react';

const Logo = ({ size = 'md', withText = false }) => {
  const box = size === 'lg' ? 'w-12 h-12 rounded-xl' : 'w-8 h-8 rounded-lg';
  const icon = size === 'lg' ? 'w-6 h-6' : 'w-4 h-4';

  return (
    <div className="flex items-center gap-2.5 min-w-0">
      <div className={`${box} bg-accent-gradient flex items-center justify-center text-on-accent flex-shrink-0 shadow-sm shadow-black/40`}>
        <MessageSquare className={icon} strokeWidth={2.25} />
      </div>
      {withText && <span className="text-[15px] font-semibold tracking-tight text-fg truncate">ChatApp</span>}
    </div>
  );
};

export default Logo;
