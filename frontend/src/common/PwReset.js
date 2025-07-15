import React, { useState } from "react";
import { Box, Typography, Button, TextField, Container, Paper, Stack } from "@mui/material";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "../common/axiosInstance"
import { useAlert } from "../components/CommonAlert";

export default function LoginPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const location = useLocation();
  const { user_id, email } = location.state || {};


  const BASE_URL = process.env.REACT_APP_API_URL; // 실제 API 주소
  const { showAlert } = useAlert();

  const handleSubmit = async () => {
    if (password == confirmPassword) {
      const payload = {
        user_id: user_id,
        email: email,
        password: password,
      };
      console.log(payload);
      try {
        const res = await axios.post(`${BASE_URL}/user/pwFind`, payload);
        showAlert("비밀번호 재설정 성공!");
        navigate("/login");
      } catch (error) {
        showAlert("비밀번호 재설정 실패: ");
      }
    } else {
      showAlert("비밀번호가 일치하지 않습니다.");
    }
  };




  return (
    <Box
      sx={{
        background: "#f0f4f8",
        minHeight: "92vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Container component="main" maxWidth="sm">
        <Paper elevation={3} sx={{ borderRadius: 4, p: 4, mb: 10 }}>
          <Stack spacing={2} mt={3}>
            <Typography variant="h5" sx={{ mb: 3, fontWeight: "bold", alignItems: "center" }}>
              비밀번호 재설정
            </Typography>

            <TextField
              type="password"
              label="비밀번호"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)} />
            <TextField
              type="password"
              label="비밀번호 확인"
              name="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)} />


            <Button variant="contained" size="large" onClick={handleSubmit}>
              비밀번호 재설정
            </Button>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}
