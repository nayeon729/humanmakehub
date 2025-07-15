/**
 * 파일명: ClientUserInfo.js
 * 설명: 클라이언트(고객)의 회원정보 조회 및 탈퇴 처리 페이지.
 * 주요 기능:
 *   - /client/userinfo: 로그인된 사용자의 정보 조회 (JWT 기반 인증)
 *   - 회원정보 수정 버튼 → /client/userupdate 페이지로 이동
 *   - 회원탈퇴 버튼 클릭 시 PasswordConfirmDialog를 통해 비밀번호 확인 후 탈퇴 요청
 *   - 탈퇴 완료 시 세션 삭제 후 메인 페이지로 이동
 * 비고:
 *   - 수정 전 비밀번호 확인을 위한 PasswordConfirmDialog 컴포넌트 포함
 *   - 탈퇴 시 /client/verify-password → /client/withdraw 순차 호출
 */
import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Card,
  Typography,
  Stack,
  Divider,
} from "@mui/material";
import axios from "../common/axiosInstance"
import { useNavigate } from "react-router-dom";
import PasswordConfirmDialog from "../components/PasswordConfirmDialog";
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import { useAlert } from "../components/CommonAlert";

const BASE_URL = process.env.REACT_APP_API_URL;

export default function ClientUserInfo() {
  const [userInfo, setUserInfo] = useState(null);
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);
  const { showAlert } = useAlert();


  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const token = sessionStorage.getItem("token");
        console.log("📦 토큰 확인:", token);
        const res = await axios.get(`${BASE_URL}/client/userinfo`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUserInfo(res.data);
      } catch (err) {
        console.error("회원 정보 조회 실패", err);
      }
    };

    fetchUserInfo();
  }, []);

  if (!userInfo) return <Typography>로ading... 🍃</Typography>;

  const infoItems = [
    { label: "아이디", value: userInfo.user_id },
    { label: "이메일", value: userInfo.email },
    { label: "휴대전화", value: userInfo.phone || "-" },
    { label: "회사명", value: userInfo.company || "-" },
  ];

  const handleWithdraw = async (password) => {

    try {
      const token = sessionStorage.getItem("token");

      // ✅ 먼저 비밀번호 확인
      await axios.post(`${BASE_URL}/client/verify-password`, { password }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // ✅ 통과하면 탈퇴 요청
      await axios.put(`${BASE_URL}/client/withdraw`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      showAlert("탈퇴가 완료되었습니다.");
      sessionStorage.removeItem("token");
      navigate("/");
    } catch (err) {
      showAlert("비밀번호가 일치하지 않거나 오류 발생");
      console.error(err);
    }
  };
  return (
    <Box sx={{ flex: 1, p: 3 }}>
      <Box sx={{ display: "flex", gap:1 }}>
        <AccountCircleIcon sx={{ fontSize: 40 }} />
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          회원정보
        </Typography>
      </Box>
      <Card sx={{ p: 4 }}>
        <Typography variant="h6" gutterBottom>
          안녕하세요! <strong>{userInfo.nickname}</strong> 님
        </Typography>
        <Divider sx={{ my: 2 }} />

        <Stack spacing={2}>
          {infoItems.map((item) => (
            <Box
              key={item.label}
              sx={{ display: "flex", justifyContent: "space-between" }}
            >
              <Typography color="text.secondary">{item.label}</Typography>
              <Typography fontWeight="bold">{item.value}</Typography>
            </Box>
          ))}
        </Stack>

        <Box sx={{ display: "flex", justifyContent: "space-between", mt: 4 }}>
          <Button variant="contained" onClick={() => navigate("/client/userupdate")}>회원정보 수정</Button>
          <Button variant="outlined" onClick={() => setDialogOpen(true)}>회원탈퇴</Button>

          <PasswordConfirmDialog
            open={dialogOpen}
            onConfirm={(password) => {
              setDialogOpen(false);
              handleWithdraw(password);
            }}
            onCancel={() => setDialogOpen(false)}
          />

        </Box>
      </Card>

    </Box>
  );
}
