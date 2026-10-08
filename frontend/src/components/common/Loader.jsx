import React from 'react';

const Loader = ({ size = 'md', className = '', label }) => {
  const sizes = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-8 h-8 border-[2.5px]',
  };

  return (
    <div className="flex flex-col items-center justify-center p-4" role="status">
      <div
        className={`animate-spin rounded-full border-white/10 border-t-accent-400 ${sizes[size]} ${className}`}
      />
      {label && <p className="mt-3 text-xs font-medium text-fg-subtle">{label}</p>}
    </div>
  );
};

export default Loader;
