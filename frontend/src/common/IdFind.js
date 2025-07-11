import React, { useState } from "react";
import { Box, Typography, Button, TextField, Container, Paper, Stack } from "@mui/material";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import EmailTimer from "./EmailTimer";

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [emailChecked, setEmailChecked] = useState(false);
  const [startTimer, setStartTimer] = useState(false);
  const [resultVisible, setResultVisible] = useState(false); // ✅ 결과 보이기 여부
  const [userInfo, setUserInfo] = useState({ userId: "", joinDate: "" });


  const BASE_URL = process.env.REACT_APP_API_URL; // 실제 API 주소

  const handleSubmit = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/user/idFind`, { params: { email: email }, });
      setUserInfo({
        userId: res.data.user_id,
        joinDate: res.data.create_dt,
      });
      setResultVisible(true);
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
        setStartTimer(false); // 먼저 false로 껐다가
        setTimeout(() => setStartTimer(true), 10); // 다시 켜주기 (리셋)
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
        params: { code: code },
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
          {resultVisible ? (
            // ✅ 결과 화면
            <Box textAlign="center">
              <Typography variant="h6" fontWeight="bold" sx={{mb:3, }}>아이디 찾기</Typography>
              <Typography sx={{fontWeight:"600" }}>회원님의 아이디는 다음과 같습니다.</Typography>
              <Typography sx={{ mt: 2, mb: 1, fontWeight:"600" }}>
                아이디 : {userInfo.userId}
              </Typography>
              <Typography sx={{ fontWeight:"600" }}>
                가입일자 : {userInfo.joinDate?.split("T")[0]}
              </Typography>
            </Box>
          ) : (
            <Stack spacing={2} mt={3}>
              <Typography variant="h5" sx={{ mb: 3, fontWeight: "bold", alignItems: "center" }}>
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
                아이디 찾기
              </Button>
            </Stack>
          )}
        </Paper>
      </Container>
    </Box>
  );
}
