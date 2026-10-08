import React, { useState } from 'react';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';

const Input = ({
  label,
  id,
  type = 'text',
  placeholder,
  value,
  onChange,
  error,
  hint,
  required = false,
  icon: Icon,
  className = '',
  containerClassName = '',
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';

  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

  return (
    <div className={`space-y-1.5 ${containerClassName}`}>
      {label && (
        <label htmlFor={id} className="block text-[13px] font-medium text-fg-muted">
          {label}
        </label>
      )}
      <div className="relative group">
        {Icon && (
          <div
            className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-colors ${
              error ? 'text-red-400' : 'text-fg-subtle group-focus-within:text-accent-400'
            }`}
          >
            <Icon className="w-4 h-4" />
          </div>
        )}
        <input
          id={id}
          type={inputType}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          aria-invalid={!!error || undefined}
          aria-describedby={error && id ? `${id}-error` : undefined}
          className={`w-full h-11 px-3.5 text-base sm:text-sm text-fg placeholder:text-fg-subtle bg-ink-750 border rounded-lg transition-[border-color,box-shadow,background-color] duration-150 focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed ${
            Icon ? 'pl-10' : ''
          } ${isPassword ? 'pr-10' : ''} ${
            error
              ? 'border-danger/60 focus:border-danger focus:ring-4 focus:ring-danger/15'
              : 'border-line hover:border-line-strong focus:border-accent-300/45 focus:ring-4 focus:ring-accent-400/15'
          } ${className}`}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            className="absolute inset-y-0 right-0 px-3 flex items-center text-fg-subtle hover:text-fg transition-colors"
            tabIndex={-1}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
      </div>
      {error ? (
        <p id={id ? `${id}-error` : undefined} className="flex items-center gap-1.5 text-xs text-red-400 animate-fade-in">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          {error}
        </p>
      ) : (
        hint && <p className="text-xs text-fg-subtle">{hint}</p>
      )}
    </div>
  );
};

export default Input;
