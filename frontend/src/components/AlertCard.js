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
  onConfirm,
  onClose,
}) {
  return (
    <Paper
      elevation={3}
      sx={{
        backgroundColor: "#1976d2",
        color: "white",
        p: 0.7,
        mt: 2,
        mb: 2,
        borderRadius: 2,
        position: "relative",
        height: 60
      }}
    >
      {/* 닫기 버튼 */}
      <IconButton
        onClick={onClose}
        sx={{ position: "absolute", top: -2, right: 2, color: "white" }}
      >
        <CloseIcon />
      </IconButton>

      <Stack direction="row" spacing={2} alignItems="flex-start">
        <CheckCircleIcon sx={{ fontSize: 26, mt:1}} />

        <Box flexGrow={1}>
          <Typography variant="h8" fontWeight="bold">
            {title}
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'row' }}>
            <Typography variant="body2" sx={{ mt: 1 }}>
              {description}
            </Typography>

            {/* 버튼 영역 */}
              <Button
                variant="contained"
                sx={{ backgroundColor: "white", color: "#005fb8", position:'absolute', right:'12px', height:'25px',mt:1}}
                onClick={onConfirm}
              >
                {confirmText}
              </Button>
          </Box>
        </Box>
      </Stack>
    </Paper>
  );
}
