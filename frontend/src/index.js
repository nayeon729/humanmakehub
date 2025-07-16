// src/index.js
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { CssBaseline, GlobalStyles } from "@mui/material";
import { ThemeProvider, createTheme } from "@mui/material/styles";

const theme = createTheme({
  // 여기에 브레이크포인트 커스터마이징도 가능
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 900,
      lg: 1200,
      xl: 1536,
    },
  },
});

const globalStyles = (
  <GlobalStyles
    styles={{
      html: {
        WebkitFontSmoothing: "antialiased",
        MozOsxFontSmoothing: "grayscale",
        height: "100%",
      },
      body: {
        margin: 0,
        padding: 0,
        height: "100%",
        overflowX: "hidden",
        backgroundColor: "#f5f5f5",
      },
      "#root": {
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
      },
      "*": {
        boxSizing: "border-box",
      },
    }}
  />
);

ReactDOM.createRoot(document.getElementById("root")).render(
  <ThemeProvider theme={theme}>
    <CssBaseline />
    {globalStyles}
    <App />
  </ThemeProvider>
);

