/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      colors: {
        ink: {
          950: '#020617',
          900: '#060b17',
          850: '#0a1120',
          800: '#0f172a',
        },
      },
      boxShadow: {
        panel: '0 24px 80px -32px rgba(2, 6, 23, 0.9)',
        seal: '0 0 0 1px rgba(16, 185, 129, 0.22), 0 24px 70px -28px rgba(16, 185, 129, 0.35)',
        alarm: '0 0 0 1px rgba(244, 63, 94, 0.3), 0 30px 120px -30px rgba(244, 63, 94, 0.55)',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(18px) scale(0.98)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        'ping-soft': {
          '0%': { transform: 'scale(1)', opacity: '0.55' },
          '80%, 100%': { transform: 'scale(2.2)', opacity: '0' },
        },
        scan: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(340%)' },
        },
        alarm: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(244, 63, 94, 0.45)' },
          '50%': { boxShadow: '0 0 0 10px rgba(244, 63, 94, 0)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.35s ease-out both',
        'slide-up': 'slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1) both',
        'ping-soft': 'ping-soft 2.4s cubic-bezier(0, 0, 0.2, 1) infinite',
        scan: 'scan 3.2s linear infinite',
        alarm: 'alarm 1.8s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
