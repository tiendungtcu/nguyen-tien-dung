/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"DM Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        midnight: '#0b1020',
        indigoGlass: 'rgba(99, 102, 241, 0.08)',
      },
      boxShadow: {
        glow: '0 30px 120px rgba(56, 189, 248, 0.25)',
      },
      backgroundImage: {
        mesh: 'radial-gradient(circle at 20% 20%, rgba(59, 130, 246, 0.35), transparent 45%), radial-gradient(circle at 80% 0%, rgba(14, 165, 233, 0.25), transparent 55%), radial-gradient(circle at 50% 80%, rgba(236, 72, 153, 0.35), transparent 60%)',
      },
    },
  },
  plugins: [],
};

