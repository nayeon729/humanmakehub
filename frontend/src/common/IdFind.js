import React, { useState } from "react";
import { Box, Typography, Button, TextField, Container, Paper, Stack } from "@mui/material";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [emailChecked, setEmailChecked] = useState(false);
  

  const BASE_URL = "http://127.0.0.1:8000"; // 실제 API 주소

  const handleSubmit = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/user/idFind`, {params: { email: email },});
      const userId = res.data.user_id;
      const joinDate = res.data.create_dt;
      alert(`가입한 아이디는 ${userId}입니다!\n가입한 날짜는 ${joinDate}입니다!`); // 확인Alert   지워야함
    //   navigate("/login");
    } catch (error) {
      console.error("아이디 찾기 실패", error);
      alert("아이디 찾기 실패: " + (error.response?.data?.detail || "서버 오류"));
    }
  };

  const checkDuplicate = async () => {
    try {
        const res = await axios.post(`${BASE_URL}/user/Find-email`, {
          email: email,
        });
        if (res.data.emailExists) {
          alert("존재하는 이메일입니다.");
          console.log("data : ", res);
        } else {
          alert("존재하지 않는 이메일입니다.");
        }

    } catch (err) {
      console.error("아이디 찾기 실패", err);
    }
  };

  const handleVerify = async () => {
    if (!code.trim()) {
      alert("인증 코드를 입력해주세요!");
      return;
    }

    try {
      const res = await axios.get(`${BASE_URL}/user/verify-email`, {
        params: { code: code }, // 👈 이렇게 code를 전달해!
      });
      alert(res.data.message);
      setEmailChecked(true);
    } catch (err) {
      alert(err.response?.data?.detail || "인증 실패");
    }
  };


  return (
    <Container component="main" maxWidth="sm">
      <Paper elevation={3} sx={{ p: 4, mt: 8 }}>
        <Stack spacing={2} mt={3}>
            <Typography variant="h5" sx={{ mb: 3, fontWeight: "bold", alignItems:"center" }}>
            아이디찾기
            </Typography>

            <Stack direction="row" spacing={1} alignItems="center">
                <TextField
                fullWidth
                label="이메일 (예: example@domain.com)"
                name="email"
                type="email"
                placeholder="example@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                />
            </Stack>

            <Button variant="outlined" onClick={() => checkDuplicate()}>중복확인</Button>

            <Stack direction="row" spacing={1} alignItems="center">
                <TextField
                    label="인증 코드"
                    variant="outlined"
                    fullWidth
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    sx={{ mb: 2, width:"140%"}}
                />
            </Stack>

            <Button variant="contained" color="primary" fullWidth onClick={handleVerify} disabled={emailChecked}>
                인증 확인
            </Button>

            <Button variant="contained" size="large" onClick={handleSubmit} disabled={!emailChecked}>
                아이디 찾기
            </Button>
        </Stack>
      </Paper>
    </Container>
  );
}
