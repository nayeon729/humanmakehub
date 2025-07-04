import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
} from "@mui/material";

export default function PasswordConfirmDialog({ open, onConfirm, onCancel }) {
  const [password, setPassword] = useState("");

  const handleConfirm = () => {
    onConfirm(password);      // 비밀번호 전달
    setPassword("");          // 입력 초기화
  };

  const handleClose = () => {
    setPassword("");          // 닫을 때도 초기화
    onCancel();
  };

  return (
    <Dialog open={open} onClose={handleClose}>
      <DialogTitle>비밀번호 확인</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          label="비밀번호"
          type="password"
          fullWidth
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>취소</Button>
        <Button variant="contained" onClick={handleConfirm}>
          확인
        </Button>
      </DialogActions>
    </Dialog>
  );
}