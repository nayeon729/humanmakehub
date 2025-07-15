/**
 * 파일명: LoginPage.js
 * 설명: 사용자 로그인 페이지. 사용자 인증 및 역할별 대시보드로 라우팅.
 * 주요 기능:
 *   - /user/login: 로그인 요청 (username + password)
 *   - /user/me: 로그인 후 사용자 정보 조회
 *   - 역할(role)에 따라 다른 페이지로 리다이렉트
 *     - R01: 클라이언트 → /client/dashboard
 *     - R02: 멤버(개발자) → /member/tasks
 *     - R03, R04: 관리자 → /admin/dashboard
 *   - 아이디/비밀번호 찾기 링크 제공
 * 비고:
 *   - axiosInstance 사용, JWT 토큰은 sessionStorage에 저장
 *   - Enter 키로 로그인 가능
 */
import React, { useState } from "react";
import { Box, Typography, Button, TextField, Container, Paper, Stack } from "@mui/material";
import { useNavigate } from "react-router-dom";
import axios from "../common/axiosInstance"
import { useAlert } from "../components/CommonAlert";

export default function LoginPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");

  const BASE_URL = process.env.REACT_APP_API_URL; // 실제 API 주소
  const { showAlert } = useAlert();

  const handleLogin = async () => {
    if (!username || !password) {
      showAlert("아이디와 비밀번호를 모두 입력하세요.");
      return;
    }

    try {
      // 1. 로그인 요청
      const response = await axios.post(`${BASE_URL}/user/login`, new URLSearchParams({
        username,
        password,
      }));

      const token = response.data.access_token;
      sessionStorage.setItem("token", token);

      // 2. 사용자 정보 요청 (/me)
      const userRes = await axios.get(`${BASE_URL}/user/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const role = userRes.data.role;
      sessionStorage.setItem("role", role);
      sessionStorage.setItem("nickname", userRes.data.nickname || "");
      sessionStorage.setItem("user_id", userRes.data.user_id || "");

      // 3. ✅ 역할별 메인 화면 리다이렉트
     if (role === "R03" || role === "R04") {
      showAlert("관리자님 환영합니다!", () => {
        navigate("/admin/dashboard");
      });
    } else if (role === "R01") {
      showAlert("클라이언트님 반갑습니다!", () => {
        navigate("/client/dashboard");
      });
    } else if (role === "R02") {
      showAlert("개발자님 환영합니다!", () => {
        navigate("/member/tasks");
      });
    } else {
      showAlert("알 수 없는 사용자 역할입니다.");
    }
  } catch (error) {
    console.error("로그인 실패", error);
    if (error.response?.status === 500) {
      showAlert("아이디 또는 비밀번호가 올바르지 않습니다.");
    }
  }
};

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleLogin();
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
        <Paper elevation={3} sx={{ borderRadius: 4, p: 4, mb:10 }}>
          <Typography variant="h5" sx={{ mb: 3, fontWeight: "bold" }}>
            로그인
          </Typography>

          <TextField
            fullWidth
            margin="normal"
            label="아이디"
            variant="outlined"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyDown={handleKeyDown}
          />

          <TextField
            fullWidth
            margin="normal"
            label="비밀번호"
            type="password"
            variant="outlined"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={handleKeyDown}
          />

          <Button
            fullWidth
            variant="contained"
            color="primary"
            sx={{ mt: 2, mb: 2}}
            onClick={handleLogin}
          >
            로그인하기
          </Button>

          <Stack direction="row" spacing={1} alignItems="center" justifyContent="center">
            <Typography
              variant="body2"
              sx={{textAlign: "center", cursor: "pointer", color: "primary.main" }}
              onClick={() => navigate("/idFind")}
            >
              아이디 찾기
            </Typography>
             <Typography sx={{color: "primary.main"}}>|</Typography>
            <Typography
              variant="body2"
              sx={{ textAlign: "center", cursor: "pointer", color: "primary.main" }}
              onClick={() => navigate("/pwFind")}
            >
              비밀번호 재설정
            </Typography>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}
