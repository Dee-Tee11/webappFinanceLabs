import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Básicos
        white: "#FFFFFF",
        black: "#000000",
        transparent: "transparent",
        text: "#111827",
        background: "#F9FAFB",
        
        // Cinzas (backgrounds, texto, bordas)
        gray: {
          50: "#F9FAFB",
          100: "#F3F4F6",
          200: "#E5E7EB",
          300: "#D1D5DB",
          500: "#6B7280",
          700: "#374151",
          800: "#1F2937",
        },
        
        // Primário / Secundário (branding)
        primary: "#667eea",
        secondary: "#764ba2",
        
        // Verdes (sucesso, info útil)
        green: {
          50: "#DCFCE7",
          600: "#16A34A",
          700: "#059669",
        },
        
        // Vermelhos (erro, alerta)
        red: {
          50: "#FEF2F2",
          600: "#DC2626",
        },
        
        // Extras e overlays
        'white-opacity-85': "rgba(255, 255, 255, 0.85)",
        'white-soft': "rgba(255, 255, 255, 0.2)",
        'white-strong': "rgba(255, 255, 255, 0.85)",
        'blue-light': "rgba(102, 126, 234, 0.1)",
        'black-overlay': "rgba(0, 0, 0, 0.6)",
        'black-strong': "rgba(0, 0, 0, 0.9)",
      },
      spacing: {
        'xs': '4px',
        'sm': '8px',
        'md': '12px',
        'base': '16px',
        'lg': '20px',
        'xl': '24px',
        'xxl': '32px',
        'xxxl': '40px',
      },
      borderRadius: {
        'sm': '6px',
        'md': '8px',
        'base': '12px',
        'lg': '16px',
        'xl': '20px',
        'full': '9999px',
      },
      fontSize: {
        'xs': '11px',
        'sm': '12px',
        'base': '14px',
        'md': '15px',
        'lg': '16px',
        'xl': '18px',
        '2xl': '20px',
        '3xl': '24px',
        '4xl': '28px',
        'title': '22px',
        'display': '24px',
        'hero': '28px',
        'mega': '32px',
      },
      fontWeight: {
        'regular': '400',
        'medium': '500',
        'semiBold': '600',
        'bold': '700',
        'extraBold': '800',
      },
      backgroundImage: {
        'primary-gradient': 'linear-gradient(135deg, #667eea, #764ba2)',
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
}

export default config