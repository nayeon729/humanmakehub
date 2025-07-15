import React, { useState } from "react";
import { Box, Typography, Button, TextField, Container, Paper, Stack } from "@mui/material";
import { useNavigate } from "react-router-dom";
import axios from "../common/axiosInstance"
import EmailTimer from "./EmailTimer";

export default function LoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [emailChecked, setEmailChecked] = useState(false);
  // 창넘어갈때 넘길값
  const [sendUserId, setSendUserId] = useState("");
  const [sendEmail, setSendEmail] = useState("");
  const [startTimer, setStartTimer] = useState(false);

  const BASE_URL = process.env.REACT_APP_API_URL; // 실제 API 주소

  const handleSubmit = async () => {
    navigate("/pwReset", {
      state: {
        user_id: sendUserId,
        email: sendEmail
      }
    });
  };

  const checkDuplicate = async () => {
    try {
      if (username && username != null && username != "") {
        const res = await axios.post(`${BASE_URL}/user/Find-email`, {
          user_id: username,
          email: email,
        });
        if (res.data.emailExists) {
          alert("존재하는 이메일입니다.");
          console.log("data : ", res);
          setSendUserId(res.data?.user_id);
          setSendEmail(res.data?.email);
          setTimeout(() => setStartTimer(true), 10); // 다시 켜주기 (리셋)
        } else {
          alert("존재하지 않는 이메일입니다.");
        }
      } else {
        alert("존재하지않는 아이디입니다.")
      }

    } catch (err) {
      alert("아이디 및 이메일을 확인해주세요.");
      console.error("비밀번호 재설정 실패", err);
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
      setStartTimer(false);
    } catch (err) {
      alert(err.response?.data?.detail || "인증 실패");
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
              fullWidth
              margin="normal"
              label="아이디"
              variant="outlined"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />

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

            <Button variant="outlined" onClick={() => checkDuplicate()}>이메일 인증</Button>
            {startTimer && (
              <div>
                <span>유효 시간: </span>
                <EmailTimer start={startTimer} onExpire={() => alert("시간 초과")} />
              </div>
            )}
            <Stack direction="row" spacing={1} alignItems="center">
              <TextField
                label="인증 코드"
                variant="outlined"
                fullWidth
                value={code}
                onChange={(e) => setCode(e.target.value)}
                sx={{ mb: 2, width: "140%" }}
              />
            </Stack>

            <Button variant="contained" color="primary" fullWidth onClick={handleVerify} disabled={emailChecked}>
              인증 확인
            </Button>

            <Button variant="contained" size="large" onClick={handleSubmit} disabled={!emailChecked}>
              비밀번호 재설정
            </Button>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}
