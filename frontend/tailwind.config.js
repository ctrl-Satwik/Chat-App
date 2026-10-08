/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  future: {
    // hover: styles only apply on devices that can actually hover (no "stuck" hover on phones)
    hoverOnlyWhenSupported: true,
  },
  theme: {
    extend: {
      screens: {
        '3xl': '1920px',
        // Touch-first devices (phones, tablets)
        touch: { raw: '(hover: none) and (pointer: coarse)' },
        // Very short viewports, e.g. phones in landscape
        short: { raw: '(max-height: 520px)' },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      colors: {
        // Surfaces matching WhatsApp desktop's dark theme (neutral charcoal)
        ink: {
          950: '#0f1010ff', // chat area background
          900: '#0f1010ff', // sidebar / chat list
          850: '#1D1F1F', // secondary background / dialogs
          800: '#242626', // cards / panels / incoming bubbles
          750: '#2E2F2F', // inputs
          700: '#353737', // hover on panels / tooltips
          600: '#414343', // pressed / skeleton highlight
        },
        fg: {
          DEFAULT: '#FAFAFA',
          muted: '#ABACAC',
          subtle: '#8A8B8B',
        },
        line: {
          DEFAULT: 'rgba(255,255,255,0.10)',
          strong: 'rgba(255,255,255,0.16)',
        },
        // Purple accent #810CA8.
        // 500 is the brand colour (fills: bubbles, buttons); 300/400 are lighter tints
        // for anything that must stand out against the dark background (text, focus, badges).
        accent: {
          300: '#D199E8',
          400: '#B04FD4',
          500: '#810CA8',
          600: '#6B0A8C',
          700: '#550870',
        },
        // Text/icons placed on top of the purple accent
        'on-accent': {
          DEFAULT: '#FFFFFF',
          muted: 'rgba(255,255,255,0.7)',
          seen: '#8FD3FF',
        },
        // Legacy alias so any remaining brand-* classes follow the accent
        brand: {
          200: '#E8C7F4',
          300: '#D199E8',
          400: '#B04FD4',
          500: '#810CA8',
          600: '#6B0A8C',
        },
        success: '#3FB66B',
        danger: '#EF4444',
      },
      borderRadius: {
        bubble: '14px',
      },
      boxShadow: {
        panel: '0 8px 30px rgba(0,0,0,0.35)',
        pop: '0 12px 40px rgba(0,0,0,0.5)',
        composer: '0 4px 24px rgba(0,0,0,0.25)',
      },
      animation: {
        'fade-in': 'fadeIn 180ms ease-out both',
        'slide-up': 'slideUp 200ms cubic-bezier(0.2, 0.8, 0.2, 1) both',
        'scale-in': 'scaleIn 180ms cubic-bezier(0.2, 0.8, 0.2, 1) both',
        'pop': 'pop 220ms cubic-bezier(0.2, 0.8, 0.2, 1.4) both',
        'shimmer': 'shimmer 1.4s ease-in-out infinite',
        'typing': 'typing 1.2s ease-in-out infinite',
        'soft-ping': 'softPing 2s cubic-bezier(0, 0, 0.2, 1) infinite',
        'toast-in': 'toastIn 220ms cubic-bezier(0.2, 0.8, 0.2, 1) both',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.96) translateY(4px)' },
          '100%': { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
        pop: {
          '0%': { opacity: '0', transform: 'scale(0.6)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        typing: {
          '0%, 60%, 100%': { opacity: '0.3', transform: 'translateY(0)' },
          '30%': { opacity: '1', transform: 'translateY(-2px)' },
        },
        softPing: {
          '0%': { transform: 'scale(1)', opacity: '0.6' },
          '75%, 100%': { transform: 'scale(2.2)', opacity: '0' },
        },
        toastIn: {
          '0%': { opacity: '0', transform: 'translateY(8px) scale(0.98)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
      },
    },
  },
  plugins: [],
}
