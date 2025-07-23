import React from "react";
import {
  Box,
  Typography,
  Button,
  Paper,
  IconButton,
  Stack,
  useTheme,
  useMediaQuery
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CloseIcon from "@mui/icons-material/Close";

export default function AlertBox({
  title = "Alert",
  description = "Alert informs users about important changes or conditions in the interface.",
  confirmText = "Confirm",
  onConfirm,
  onClose,
  color,
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  return (
    <Paper
      elevation={3}
      sx={{
        backgroundColor:"rgba(255, 255, 255, 1)",
        color: "black",
        p: 1,
        mt: 2,
        mb: 2,
        borderRadius: 2,
        position: "relative",
        height: isMobile?75:60,
        border:'4px solid ',
        borderColor: color,
      }}
    >
      {/* 닫기 버튼 */}
      <IconButton
        onClick={onClose}
        sx={{ position: "absolute", top: -2, right: 2, color: color }}
      >
        <CloseIcon />
      </IconButton>

      <Stack direction="row" spacing={2} alignItems="flex-start">
        {!isMobile&&(<CheckCircleIcon sx={{ fontSize: 26, mt:1, color:color}} />)}

        <Box flexGrow={1}>
          <Typography variant="h8" fontWeight="bold">
            {isMobile&&(<CheckCircleIcon sx={{ fontSize: 19, color:color, mr:1, mb:-0.5}} />)}{title}
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'row' }}>
            <Typography variant="body2" sx={{ mt: 1 }}>
              {description}
            </Typography>

            {/* 버튼 영역 */}
              <Button
                variant="text"
                sx={{ backgroundColor: "transparent", color: color, border:"1px solid",borderColor:color, borderRadius:"10px", position:'absolute', top:isMobile?'65px':'40px',right:'10px', height:isMobile?'18px':'25px'}}
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
