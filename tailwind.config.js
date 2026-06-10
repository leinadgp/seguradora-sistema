/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        orbitron: ['Orbitron', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      colors: {
        // Paleta clara corporativa (mantém os nomes "cyber-*" usados nos componentes)
        cyber: {
          bg:      '#f1f5f9',
          surface: '#ffffff',
          card:    '#ffffff',
          border:  '#e2e8f0',
          cyan:    '#2563eb',
          purple:  '#7c3aed',
          green:   '#16a34a',
          amber:   '#d97706',
          red:     '#dc2626',
          pink:    '#db2777',
          text:    '#0f172a',
          muted:   '#64748b',
          dim:     '#94a3b8',
        },
      },
      boxShadow: {
        'neon-cyan':   '0 0 0 3px rgba(37,99,235,0.12)',
        'neon-purple': '0 0 0 3px rgba(124,58,237,0.12)',
        'neon-green':  '0 0 0 3px rgba(22,163,74,0.12)',
        'neon-amber':  '0 0 0 3px rgba(217,119,6,0.12)',
        'neon-red':    '0 0 0 3px rgba(220,38,38,0.12)',
        'neon-pink':   '0 0 0 3px rgba(219,39,119,0.12)',
        card:          '0 1px 2px 0 rgb(15 23 42 / 0.04), 0 1px 3px 0 rgb(15 23 42 / 0.06)',
        'card-md':     '0 4px 12px -2px rgb(15 23 42 / 0.08), 0 2px 6px -2px rgb(15 23 42 / 0.05)',
        'card-lg':     '0 12px 32px -8px rgb(15 23 42 / 0.12)',
        modal:         '0 24px 48px -12px rgb(15 23 42 / 0.18)',
        toast:         '0 8px 24px -4px rgb(15 23 42 / 0.12)',
      },
      animation: {
        'fade-in':       'fadeIn 0.18s ease-out',
        'slide-up':      'slideUp 0.22s cubic-bezier(0.4,0,0.2,1)',
        'slide-in-right':'slideInRight 0.25s cubic-bezier(0.4,0,0.2,1)',
        'slide-in-down': 'slideInDown 0.18s ease-out',
        'scale-in':      'scaleIn 0.18s cubic-bezier(0.4,0,0.2,1)',
        'pulse-glow':    'pulseGlow 2s ease-in-out infinite',
        'scan':          'scan 4s linear infinite',
      },
      keyframes: {
        fadeIn:       { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp:      { from: { opacity: '0', transform: 'translateY(10px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        slideInRight: { from: { opacity: '0', transform: 'translateX(20px)' }, to: { opacity: '1', transform: 'translateX(0)' } },
        slideInDown:  { from: { opacity: '0', transform: 'translateY(-8px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        scaleIn:      { from: { opacity: '0', transform: 'scale(0.96)' }, to: { opacity: '1', transform: 'scale(1)' } },
        pulseGlow:    { '0%,100%': { opacity: '1' }, '50%': { opacity: '0.6' } },
        scan: {
          '0%':   { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
      },
      backgroundImage: {
        'grid-cyber': 'linear-gradient(rgba(15,23,42,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(15,23,42,0.02) 1px, transparent 1px)',
        'gradient-cyber': 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
        'gradient-green': 'linear-gradient(135deg, #16a34a 0%, #2563eb 100%)',
        'gradient-amber': 'linear-gradient(135deg, #d97706 0%, #db2777 100%)',
        'gradient-red':   'linear-gradient(135deg, #dc2626 0%, #d97706 100%)',
        'gradient-purple':'linear-gradient(135deg, #7c3aed 0%, #db2777 100%)',
      },
      backgroundSize: {
        'grid': '40px 40px',
      },
    },
  },
  plugins: [],
}
