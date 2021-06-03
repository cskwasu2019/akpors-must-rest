const colors = require('tailwindcss/colors')

module.exports = {
  purge: ['./src/**/*.html', './src/**/*.css'],
  darkMode: false, // or 'media' or 'class'
  theme: {
    minHeight: {
      card: '15rem',
    },
    maxHeight: {
      'screen-3/5': '60vh',
    },
    maxWidth: {
      card: '35rem',
    },
    colors: {
      gray: colors.trueGray,
      red: colors.red,
      yellow: colors.yellow,
      black: colors.black,
      white: colors.white,
      green: colors.green,
      blue: colors.blue,
    },
    extend: {},
  },
  variants: {
    extend: {
      backgroundColor: ['disabled'],
      textColor: ['disabled'],
    },
  },
  plugins: [],
}
