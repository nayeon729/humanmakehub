/**
 * 파일명: LoginPage.js
 * 설명: 이메일 인증 기반 아이디 찾기 페이지 (아이디 분실 시 사용).
 * 주요 기능:
 *   - 이메일 입력 후 존재 여부 확인 (/user/Find-email)
 *   - 존재할 경우 인증 코드 발송 → 타이머 시작
 *   - 인증 코드 검증 (/user/verify-email)
 *   - 인증 완료 후 아이디 및 가입일자 조회 (/user/idFind)
 * 비고:
 *   - EmailTimer 컴포넌트 사용 (3분 타이머)
 *   - 인증 확인 후에만 아이디 찾기 가능 (버튼 비활성화로 제어)
 *   - axiosInstance 사용 및 토큰 없이 동작
 */
import React, { useState } from "react";
import { Box, Typography, Button, TextField, Container, Paper, Stack } from "@mui/material";
import { useNavigate } from "react-router-dom";
import axios from "../common/axiosInstance"
import EmailTimer from "./EmailTimer";
import { useAlert } from "../components/CommonAlert";

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [emailChecked, setEmailChecked] = useState(false);
  const [startTimer, setStartTimer] = useState(false);
  const [resultVisible, setResultVisible] = useState(false);
  const [userInfo, setUserInfo] = useState({ userId: "", joinDate: "" });


  const BASE_URL = process.env.REACT_APP_API_URL;
  const { showAlert } = useAlert();
  
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
      showAlert("아이디 찾기 실패: " + (error.response?.data?.detail || "서버 오류"));
    }
  };

  const checkDuplicate = async () => {
    try {
      const res = await axios.post(`${BASE_URL}/user/Find-email`, {
        email: email,
      });
      if (res.data.emailExists) {
        showAlert("존재하는 이메일입니다.");
        setStartTimer(false); // 먼저 false로 껐다가
        setTimeout(() => setStartTimer(true), 10); // 다시 켜주기 (리셋)
      } else {
        showAlert("존재하지 않는 이메일입니다.");
      }

    } catch (err) {
      console.error("아이디 찾기 실패", err);
    }
  };

  const handleVerify = async () => {
    if (!code.trim()) {
      showAlert("인증 코드를 입력해주세요!");
      return;
    }

    try {
      const res = await axios.get(`${BASE_URL}/user/verify-email`, {
        params: { code: code },
      });
      showAlert(res.data.message);
      setEmailChecked(true);
      setStartTimer(false);
    } catch (err) {
      showAlert(err.response?.data?.detail || "인증 실패");
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
                  <EmailTimer start={startTimer} onExpire={() => showAlert("시간 초과")} />
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
