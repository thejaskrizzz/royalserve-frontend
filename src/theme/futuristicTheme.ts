// src/theme/futuristicTheme.ts

import { createTheme } from "@mui/material";

const futuristicTheme = createTheme({
  palette: {
    mode: "dark",
    background: {
      default: "#0A0F14",
      paper: "rgba(255,255,255,0.05)",
    },
    primary: { main: "#16F2D6" },
    secondary: { main: "#7CE3B2" },
    text: {
      primary: "#fff",
      secondary: "rgba(255,255,255,0.78)",
      disabled: "rgba(255,255,255,0.55)",
    },
  },

  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.12)",
          backdropFilter: "blur(8px)",
        },
      },
    },
  },
});

export default futuristicTheme;
