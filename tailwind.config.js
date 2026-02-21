/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: '#F2F2F7',
          elevated: '#FFFFFF',
          dark: '#2C2C2E',
          darkElevated: '#3A3A3C',
        },
        text: {
          primary: '#000000',
          secondary: '#6E6E73',
          darkPrimary: '#FFFFFF',
          darkSecondary: '#98989D',
        },
        border: {
          DEFAULT: '#E5E5EA',
          dark: '#48484A',
        },
        success: '#34C759',
        warning: '#FF9500',
        danger: '#FF3B30',
        checker: '#E74C3C',
      },
      boxShadow: {
        panel: '0 10px 30px rgba(0, 0, 0, 0.08)',
      },
      borderRadius: {
        xl2: '1rem',
      },
      fontFamily: {
        sans: ['"SF Pro Display"', '"SF Pro Text"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
