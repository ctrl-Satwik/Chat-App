import React from 'react';

// Three softly pulsing dots used for typing indicators
const TypingDots = ({ className = 'text-fg-muted' }) => (
  <span className={`inline-flex items-center gap-[3px] ${className}`} aria-hidden="true">
    {[0, 150, 300].map((delay) => (
      <span
        key={delay}
        className="w-1 h-1 rounded-full bg-current animate-typing"
        style={{ animationDelay: `${delay}ms` }}
      />
    ))}
  </span>
);

export default TypingDots;
