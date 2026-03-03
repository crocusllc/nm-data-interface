'use client';
import { createTheme } from "@mui/material/styles";
import getConfigs from "@/app/utils/getConfigs";
const themeConfig = getConfigs()?.theme;

const theme = createTheme({
  palette: {
    primary: { ...themeConfig?.colors.primary },
    secondary: { ...themeConfig?.colors.secondary },
  },
  typography: {
    fontFamily: 'var(--font-inter)', // Default body text
    h1: {
      fontFamily: 'var(--font-rubik)',
      fontWeight: 700,
    },
    h2: {
      fontFamily: 'var(--font-rubik)',
      fontWeight: 700,
    },
    h3: {
      fontFamily: 'var(--font-rubik)',
      fontWeight: 500,
    },
  },
});

export default theme;
