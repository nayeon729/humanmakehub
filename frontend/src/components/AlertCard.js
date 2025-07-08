import React from "react";
import {
  Box,
  Typography,
  Button,
  Paper,
  IconButton,
  Stack,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CloseIcon from "@mui/icons-material/Close";

export default function AlertBox({
  title = "Alert",
  description = "Alert informs users about important changes or conditions in the interface.",
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  onClose,
}) {
  return (
    <Paper
      elevation={3}
      sx={{
        backgroundColor: "#1976d2", // 파란 배경
        color: "white",
        p: 3,
        borderRadius: 2,
        position: "relative",
      }}
    >
      {/* 닫기 버튼 */}
      <IconButton
        onClick={onClose}
        sx={{ position: "absolute", top: 8, right: 8, color: "white" }}
      >
        <CloseIcon />
      </IconButton>

      <Stack direction="row" spacing={2} alignItems="flex-start">
        <CheckCircleIcon sx={{ fontSize: 28, mt: 0.5 }} />

        <Box flexGrow={1}>
          <Typography variant="h6" fontWeight="bold">
            {title}
          </Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            {description}
          </Typography>

          {/* 버튼 영역 */}
          <Stack direction="row" spacing={1} mt={2} justifyContent="flex-end">
            <Button
              variant="contained"
              sx={{ backgroundColor: "white", color: "#005fb8" }}
              onClick={onConfirm}
            >
              {confirmText}
            </Button>
            <Button
              variant="outlined"
              sx={{
                borderColor: "white",
                color: "white",
                "&:hover": { borderColor: "#ccc" },
              }}
              onClick={onCancel}
            >
              {cancelText}
            </Button>
          </Stack>
        </Box>
      </Stack>
    </Paper>
  );
}
