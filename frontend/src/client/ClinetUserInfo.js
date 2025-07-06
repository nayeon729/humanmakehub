import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Card,
  Typography,
  Stack,
  Divider,
} from "@mui/material";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import PasswordConfirmDialog from "../components/PasswordConfirmDialog";



const BASE_URL = "http://127.0.0.1:8000";

export default function ClientUserInfo() {
  const [userInfo, setUserInfo] = useState(null);
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);



  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const token = localStorage.getItem("token");
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
      const token = localStorage.getItem("token");

      // ✅ 먼저 비밀번호 확인
      await axios.post(`${BASE_URL}/client/verify-password`, { password }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // ✅ 통과하면 탈퇴 요청
      await axios.put(`${BASE_URL}/client/withdraw`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert("탈퇴가 완료되었습니다.");
      localStorage.removeItem("token");
      navigate("/");
    } catch (err) {
      alert("비밀번호가 일치하지 않거나 오류 발생");
      console.error(err);
    }
  };
  return (
    <>
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


    </>
  );
}
