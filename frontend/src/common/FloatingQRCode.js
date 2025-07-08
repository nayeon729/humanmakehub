// ✅ FloatingQRCode.jsx
import React from "react";
import { Box, Typography } from "@mui/material";
import qrImage from "../assets/kakao_qr.png";  // QR 이미지 경로 맞춰줘!

export default function FloatingQRCode() {
    return (
        <Box
            sx={{
                position: "fixed",
                bottom: 32,
                right: 32,
                width: 80,
                zIndex: 9999,
                backgroundColor: "#fff",
                borderRadius: "12px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
                padding: 2,
                textAlign: "center",
                animation: "float 3s ease-in-out infinite",
            }}
        >
            <Typography variant="body2" sx={{ mb: 1, fontWeight: "bold" }}>
                문의사항
            </Typography>
            <img
                src={qrImage}
                alt="카카오 오픈채팅 QR"
                style={{ width: "100%", height: "100%" }}
            />
        </Box>
    );
}
