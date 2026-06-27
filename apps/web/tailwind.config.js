/** @type {import('tailwindcss').Config} */
// =============================================================================
// Kore Repuestos · Tailwind config
// -----------------------------------------------------------------------------
// Filosofía:
//   · Paleta de marca navy/red/cyan, sincronizada con apps/web/globals.css.
//   · Tipografía Inter en toda la app (texto y titulares), JetBrains Mono
//     para SKUs/IDs/precios — igual que apps/web/globals.css.
//   · Números tabulares globalmente: precios, stock, SKUs siempre alineados.
// =============================================================================
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Shadcn/ui CSS-variable semantic tokens
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        card: {
          DEFAULT: 'var(--card)',
          foreground: 'var(--card-foreground)',
        },
        popover: {
          DEFAULT: 'var(--popover)',
          foreground: 'var(--popover-foreground)',
        },
        primary: {
          DEFAULT: 'var(--primary)',
          foreground: 'var(--primary-foreground)',
        },
        secondary: {
          DEFAULT: 'var(--secondary)',
          foreground: 'var(--secondary-foreground)',
        },
        muted: {
          DEFAULT: 'var(--muted)',
          foreground: 'var(--muted-foreground)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          foreground: 'var(--accent-foreground)',
        },
        destructive: {
          DEFAULT: 'var(--destructive)',
        },
        border: 'var(--border)',
        input: 'var(--input)',
        ring: 'var(--ring)',
        sidebar: {
          DEFAULT: 'var(--sidebar)',
          foreground: 'var(--sidebar-foreground)',
          primary: 'var(--sidebar-primary)',
          'primary-foreground': 'var(--sidebar-primary-foreground)',
          accent: 'var(--sidebar-accent)',
          'accent-foreground': 'var(--sidebar-accent-foreground)',
          border: 'var(--sidebar-border)',
          ring: 'var(--sidebar-ring)',
        },
        // -----------------------------------------------------------------
        // Tokens de marca KORE — sincronizados manualmente con las variables
        // de apps/web/globals.css. Si cambian ahí, actualizar también aquí
        // (Tailwind necesita valores hex literales para soportar modificadores
        // de opacidad como bg-navy-700/25).
        // -----------------------------------------------------------------
        navy: {
          950: '#060e1f',
          900: '#0a1a33',
          800: '#0f2448',
          700: '#0f3672', // principal
          600: '#1a4a96',
          500: '#2562c0',
          400: '#4a7fd4',
          300: '#7aa5e0',
          200: '#adc5eb',
          100: '#d6e4f5',
          50: '#edf3fb',
        },
        red: {
          900: '#5c000e',
          800: '#8a0017',
          700: '#b80020',
          600: '#d60022', // secundario
          500: '#e8193a',
          400: '#f24d68',
          300: '#f87d92',
          200: '#fbb5bf',
          100: '#fde0e4',
          50: '#fff0f2',
        },
        cyan: {
          700: '#007a9c',
          600: '#0099c2',
          500: '#00aad2',
          400: '#00b5e2', // botón resaltado
          300: '#33c7ea',
          200: '#80ddf2',
          100: '#ccf1fb',
          50: '#e8f9fe',
        },
        neutral: {
          950: '#0d0d0d',
          900: '#1a1a1a',
          800: '#262626',
          700: '#404040',
          600: '#595959',
          500: '#737373',
          400: '#a3a3a3',
          300: '#c9c9c9',
          200: '#e0e0e0',
          100: '#f0f0f0',
          50: '#f5f5f5', // fondo menú
        },
      },
      fontFamily: {
        // Sincronizado con --font-sans/--font-display de globals.css: la marca
        // usa Inter para todo, sin tipografía editorial separada.
        display: ['Inter', 'Arial', '"Helvetica Neue"', 'Helvetica', 'sans-serif'],
        sans: ['Inter', 'Arial', '"Helvetica Neue"', 'Helvetica', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        // Escala editorial: titulares densos + body cómodo
        'display-lg': ['clamp(3rem, 8vw, 7rem)', { lineHeight: '0.9', letterSpacing: '-0.02em' }],
        'display-md': ['clamp(2rem, 5vw, 4rem)', { lineHeight: '0.95', letterSpacing: '-0.01em' }],
        'display-sm': ['1.875rem', { lineHeight: '1', letterSpacing: '0' }],
        eyebrow: ['0.6875rem', { lineHeight: '1', letterSpacing: '0.2em' }],
      },
      letterSpacing: {
        tightest: '-0.04em',
        eyebrow: '0.22em',
      },
      borderRadius: {
        // Por defecto sin radius — overrides explícitos cuando sí lo queramos.
        DEFAULT: '0',
        sm: '2px',
      },
      borderWidth: {
        DEFAULT: '1px',
        3: '3px',
      },
      keyframes: {
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        'fade-in-up': 'fade-in-up 0.4s cubic-bezier(0.16, 1, 0.3, 1) both',
        shimmer: 'shimmer 3s linear infinite',
      },
    },
  },
  plugins: [],
};
