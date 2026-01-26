import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import { aliases, mdi } from 'vuetify/iconsets/mdi'
import '@mdi/font/css/materialdesignicons.css'

const lightTheme = {
  dark: false,
  colors: {
    primary: '#7C4DFF',
    secondary: '#00BCD4',
    surface: '#FFFFFF',
    background: '#FAFAFA',
    success: '#2E7D32',
    error: '#D32F2F',
    warning: '#FB8C00',
    info: '#26A69A',
  },
}

const darkTheme = {
  dark: true,
  colors: {
    primary: '#B388FF',
    secondary: '#80DEEA',
    surface: '#1E1E1E',
    background: '#121212',
    success: '#81C784',
    error: '#EF9A9A',
    warning: '#FFCC80',
    info: '#80DEEA',
  },
}

export const vuetify = createVuetify({
  icons: {
    defaultSet: 'mdi',
    aliases,
    sets: { mdi },
  },
  theme: {
    defaultTheme: 'dark',
    themes: {
      light: lightTheme,
      dark: darkTheme,
    },
  },
})
