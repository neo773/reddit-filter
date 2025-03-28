/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  theme: {
    extend: {
      colors: {
        reddit: {
          dark: '#0F1113',
          card: '#181C1F',
          input: '#2B3236',
          border: '#3F4142',
          tag: '#38414e',
          primary: '#FF4500',
          primaryHover: '#E03D00',
          blue: '#125AC8',
          bluePrimary: '#105BCA',
        },
      },
    },
  },
  plugins: [],
}; 