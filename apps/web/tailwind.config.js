/** @type {import('tailwindcss').Config} */
// =============================================================================
// Kore Repuestos · Tailwind config — Dirección estética "industrial editorial"
// -----------------------------------------------------------------------------
// Filosofía:
//   · Negro profundo de imprenta como base (no gris azulado de UI genérica).
//   · Acento naranja seguridad — el color de las señales en talleres y máquinas.
//   · Tipografía condensada para titulares (Bebas Neue) que evoca señalética
//     industrial y manuales técnicos antiguos.
//   · Esquinas vivas (radius=0) por defecto en formularios → estética mecánica.
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
        // Tinta (background, surfaces, dividers)
        ink: {
          950: '#0a0a0a', // base — negro de imprenta
          900: '#121212', // panels
          850: '#171717',
          800: '#1f1f1f', // cards
          700: '#2a2a2a', // borders
          600: '#3a3a3a',
          500: '#525252',
          400: '#737373',
          300: '#a3a3a3',
          200: '#d4d4d4',
          100: '#e5e5e5',
          50: '#fafaf9', // body text — blanco cálido, no #fff puro
        },
        // Naranja seguridad — único color cromático del sistema
        signal: {
          50: '#fff4ec',
          100: '#ffe1cc',
          300: '#ffaa70',
          500: '#ff5e1f', // primario · CTAs · destacados numéricos
          600: '#e84a08',
          700: '#b53805',
          900: '#5a1c02',
        },
        // Acento secundario (alertas, low-stock)
        warning: {
          400: '#fcd34d',
          500: '#facc15',
        },
        // Verde técnico (estados OK, validación correcta)
        success: {
          500: '#22c55e',
          700: '#15803d',
        },
        // Rojo (errores de validación, destructivo)
        danger: {
          500: '#ef4444',
          700: '#b91c1c',
        },
      },
      fontFamily: {
        display: ['"Bebas Neue"', 'Impact', 'sans-serif'],
        sans: ['"IBM Plex Sans"', 'system-ui', 'sans-serif'],
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
      boxShadow: {
        panel: '0 1px 0 0 #2a2a2a inset, 0 -1px 0 0 #2a2a2a inset',
        'signal-glow': '0 0 0 1px #ff5e1f, 0 0 24px -8px #ff5e1f',
      },
      backgroundImage: {
        // Patrón diagonal industrial (cintas de "no pasar")
        'hazard-stripes': `repeating-linear-gradient(
          135deg,
          #ff5e1f 0,
          #ff5e1f 10px,
          #0a0a0a 10px,
          #0a0a0a 20px
        )`,
        // Grilla técnica sutil para fondos de paneles
        'tech-grid': `linear-gradient(#1f1f1f 1px, transparent 1px),
                      linear-gradient(90deg, #1f1f1f 1px, transparent 1px)`,
      },
      backgroundSize: {
        'tech-grid': '32px 32px',
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
