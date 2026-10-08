import React from 'react';
import { Loader2 } from 'lucide-react';

const Button = ({
  children,
  type = 'button',
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  onClick,
  className = '',
  icon: Icon,
  ...props
}) => {
  const baseClasses =
    'inline-flex items-center justify-center font-medium rounded-lg select-none transition-all duration-150 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-950 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none active:translate-y-0 active:scale-[0.98]';

  const variants = {
    primary:
      'bg-accent-gradient text-on-accent font-semibold shadow-sm shadow-black/30 hover:brightness-110 hover:-translate-y-px',
    secondary:
      'bg-ink-800 text-fg border border-line hover:bg-ink-700 hover:border-line-strong',
    outline:
      'bg-transparent text-fg-muted border border-line hover:bg-white/[0.04] hover:text-fg hover:border-line-strong',
    ghost:
      'bg-transparent text-fg-muted hover:bg-white/[0.05] hover:text-fg',
    danger:
      'bg-danger/90 text-white hover:bg-danger hover:-translate-y-px shadow-sm shadow-black/30',
    'danger-soft':
      'bg-danger/10 text-red-300 border border-danger/20 hover:bg-danger/15 hover:text-red-200',
  };

  const sizes = {
    sm: 'h-8 px-3 text-xs gap-1.5',
    md: 'h-10 px-4 text-sm gap-2',
    lg: 'h-11 px-5 text-sm gap-2',
  };

  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      onClick={onClick}
      aria-busy={isLoading || undefined}
      className={`${baseClasses} ${variants[variant] || variants.primary} ${sizes[size]} ${className}`}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
      ) : (
        Icon && <Icon className="w-4 h-4 flex-shrink-0" />
      )}
      <span className="truncate">{children}</span>
    </button>
  );
};

export default Button;
