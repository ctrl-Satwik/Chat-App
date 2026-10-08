import React, { forwardRef } from 'react';

// Rounded-square icon button with a CSS tooltip (see [data-tooltip] in index.css)
const IconButton = forwardRef(
  (
    {
      icon: Icon,
      label,
      onClick,
      tooltipSide = 'top',
      tooltipAlign,
      size = 'md',
      variant = 'ghost',
      active = false,
      className = '',
      type = 'button',
      showTooltip = true,
      ...props
    },
    ref
  ) => {
    const sizes = {
      sm: 'w-7 h-7 touch:w-9 touch:h-9 rounded-md',
      md: 'w-9 h-9 touch:w-10 touch:h-10 rounded-lg',
      lg: 'w-10 h-10 rounded-lg',
    };

    const iconSizes = {
      sm: 'w-3.5 h-3.5',
      md: 'w-[18px] h-[18px]',
      lg: 'w-5 h-5',
    };

    const variants = {
      ghost: active
        ? 'bg-white/[0.08] text-fg'
        : 'text-fg-muted hover:text-fg hover:bg-white/[0.06]',
      danger: 'text-fg-muted hover:text-red-300 hover:bg-danger/10',
      solid: 'bg-ink-800 border border-line text-fg-muted hover:text-fg hover:bg-ink-700',
    };

    return (
      <button
        ref={ref}
        type={type}
        onClick={onClick}
        aria-label={label}
        data-tooltip={showTooltip ? label : undefined}
        data-tooltip-side={tooltipSide}
        data-tooltip-align={tooltipAlign}
        className={`inline-flex items-center justify-center flex-shrink-0 transition-colors duration-150 disabled:opacity-40 disabled:pointer-events-none ${sizes[size]} ${variants[variant]} ${className}`}
        {...props}
      >
        <Icon className={iconSizes[size]} />
      </button>
    );
  }
);

IconButton.displayName = 'IconButton';

export default IconButton;
