import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        labsa: {
          // Pure white lockup surface required by BRAND_GUIDE.md
          white: '#FFFFFF',
          // Palette B warm-white main background & soft cream surfaces
          canvas: '#FAF7F2',
          surface: '#F3ECE1',
          // Sampled warm fabric highlight from logo scarf/stitching
          cream: '#E9D7BF',
          // Sampled primary charcoal from logo jacket & Arabic wordmark
          charcoal: {
            DEFAULT: '#30302E',
            muted: '#5C5A54',
            light: '#78756E',
          },
          // Sampled muted olive from logo trousers & hoodie
          olive: {
            DEFAULT: '#808060',
            dark: '#66664B',
            light: '#E6E6DC',
          },
          // Sampled terracotta orange from logo overalls & hoodie pocket
          terracotta: {
            DEFAULT: '#C8784C',
            dark: '#B06238',
            light: '#F7E7DE',
          },
          // Semantic status colors harmonized with Palette B
          status: {
            success: '#2E6F40',
            warning: '#B86B14',
            danger: '#B43C3C',
            info: '#3B6998',
          },
        },
      },
      fontFamily: {
        sans: [
          'var(--font-english)',
          'var(--font-arabic)',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'sans-serif',
        ],
        arabic: [
          'var(--font-arabic)',
          'var(--font-english)',
          '"IBM Plex Sans Arabic"',
          '"Segoe UI"',
          'Tahoma',
          'sans-serif',
        ],
        english: [
          'var(--font-english)',
          'var(--font-arabic)',
          '"Manrope"',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'sans-serif',
        ],
      },
      fontWeight: {
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
        extrabold: '700',
      },
      fontSize: {
        xs: ['0.8125rem', { lineHeight: '1.5' }],
        sm: ['0.9375rem', { lineHeight: '1.6' }],
        base: ['1rem', { lineHeight: '1.65' }],
        lg: ['1.125rem', { lineHeight: '1.5' }],
        xl: ['1.25rem', { lineHeight: '1.4' }],
        '2xl': ['1.5rem', { lineHeight: '1.3' }],
        '3xl': ['1.875rem', { lineHeight: '1.22' }],
        '4xl': ['2.25rem', { lineHeight: '1.16' }],
        '5xl': ['2.75rem', { lineHeight: '1.12' }],
      },
      boxShadow: {
        craft: '0 2px 12px -2px rgba(48, 48, 46, 0.07)',
        'craft-lg': '0 8px 24px -4px rgba(48, 48, 46, 0.11)',
      },
    },
  },
  plugins: [],
};

export default config;
