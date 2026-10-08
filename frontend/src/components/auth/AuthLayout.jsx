import React from 'react';
import { AlertCircle } from 'lucide-react';
import Logo from '../common/Logo';

const AuthLayout = ({ title, subtitle, error, children, footer }) => (
  <div className="app-min-screen w-full overflow-y-auto bg-ink-950 relative">
    {/* Very subtle top light so the page doesn't feel flat */}
    <div
      className="pointer-events-none absolute inset-x-0 top-0 h-[420px] opacity-70"
      style={{
        background:
          'radial-gradient(600px 280px at 50% -60px, rgba(176,79,212,0.12), transparent 70%)',
      }}
    />

    <div className="relative app-min-screen flex flex-col items-center justify-center px-4 py-10 short:py-6 pt-[max(2.5rem,env(safe-area-inset-top))] pb-[max(2.5rem,env(safe-area-inset-bottom))]">
      <div className="w-full max-w-[400px] animate-slide-up">
        <div className="flex flex-col items-center text-center mb-7 short:mb-4">
          <Logo size="lg" />
          <h1 className="mt-5 text-2xl font-semibold tracking-tight text-fg">{title}</h1>
          {subtitle && <p className="mt-1.5 text-sm text-fg-muted">{subtitle}</p>}
        </div>

        <div className="bg-ink-850 border border-line rounded-2xl p-6 sm:p-7 shadow-panel">
          {error && (
            <div
              role="alert"
              className="mb-5 flex items-start gap-2.5 px-3.5 py-3 rounded-lg bg-danger/10 border border-danger/20 text-[13px] text-red-300 animate-fade-in"
            >
              <AlertCircle className="w-4 h-4 mt-px flex-shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}
          {children}
        </div>

        {footer && <div className="mt-6 text-center text-[13px] text-fg-muted">{footer}</div>}
      </div>
    </div>
  </div>
);

export default AuthLayout;
