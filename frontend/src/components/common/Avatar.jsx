import React, { useState } from 'react';

// Muted, tasteful tints for initials avatars — picked deterministically from the name
const TINTS = [
  'bg-indigo-500/20 text-indigo-200',
  'bg-violet-500/20 text-violet-200',
  'bg-sky-500/20 text-sky-200',
  'bg-emerald-500/20 text-emerald-200',
  'bg-amber-500/20 text-amber-200',
  'bg-rose-500/20 text-rose-200',
  'bg-teal-500/20 text-teal-200',
  'bg-fuchsia-500/20 text-fuchsia-200',
];

const tintFor = (name = '') => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) | 0;
  return TINTS[Math.abs(hash) % TINTS.length];
};

const getInitials = (n) => {
  if (!n) return '?';
  const parts = n.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return n.slice(0, 2).toUpperCase();
};

const Avatar = ({
  src,
  name = '',
  size = 'md',
  isOnline = false,
  showStatus = false,
  ringClassName = 'border-ink-900',
  className = '',
}) => {
  const [imgFailed, setImgFailed] = useState(false);

  const sizeClasses = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-[11px]',
    md: 'w-10 h-10 text-[13px]',
    lg: 'w-12 h-12 text-sm',
    xl: 'w-20 h-20 text-xl',
  };

  const statusDotSizes = {
    xs: 'w-2 h-2 -right-px -bottom-px border',
    sm: 'w-2.5 h-2.5 -right-px -bottom-px border-2',
    md: 'w-3 h-3 -right-0.5 -bottom-0.5 border-2',
    lg: 'w-3.5 h-3.5 right-0 bottom-0 border-2',
    xl: 'w-4 h-4 right-1 bottom-1 border-[3px]',
  };

  const showImage = src && !imgFailed;

  return (
    <div className={`relative inline-flex flex-shrink-0 ${className}`}>
      {showImage ? (
        <img
          src={src}
          alt={name || 'User avatar'}
          className={`${sizeClasses[size]} rounded-full object-cover bg-ink-800`}
          onError={() => setImgFailed(true)}
        />
      ) : (
        <div
          className={`${sizeClasses[size]} ${tintFor(name)} rounded-full font-semibold flex items-center justify-center select-none`}
          aria-label={name || 'User avatar'}
        >
          {getInitials(name)}
        </div>
      )}

      {showStatus && (
        <span
          className={`absolute rounded-full ${ringClassName} ${statusDotSizes[size]} ${
            isOnline ? 'bg-success' : 'bg-fg-subtle'
          }`}
          title={isOnline ? 'Online' : 'Offline'}
        />
      )}
    </div>
  );
};

export default Avatar;
