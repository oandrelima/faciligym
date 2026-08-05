/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#E50914',
          dark: '#B81D24',
          light: '#FF3B30',
          dim: 'rgba(229, 9, 20, 0.12)',
          border: 'rgba(229, 9, 20, 0.25)',
        },
      },
    },
  },
  plugins: [],
};
