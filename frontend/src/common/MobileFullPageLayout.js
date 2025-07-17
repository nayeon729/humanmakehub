// components/mobile/MobileFullPageLayout.jsx
import React from "react";
import { Box } from "@mui/material";

export default function MobileFullPageLayout({ children }) {
  return (
    <Box
      sx={{
        position: "relative",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >

      {/* 스크롤 가능한 콘텐츠 */}
      <Box
        sx={{
          flexGrow: 1,
          overflowY: "auto",
        }}
      >
        {children}
      </Box>

    </Box>
  );
}
