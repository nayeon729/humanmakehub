import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Card,
  Typography,
  Stack,
  TextField,
  Divider,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import PasswordConfirmDialog from "../components/PasswordConfirmDialog";
import AccountCircleIcon from '@mui/icons-material/AccountCircle';


const BASE_URL = process.env.REACT_APP_API_URL;

export default function ClientUserEditPage() {
  const [userInfo, setUserInfo] = useState(null);
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${BASE_URL}/client/userinfo`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUserInfo(res.data);
        setPhone(res.data.phone || "");
        setCompany(res.data.company || "");
      } catch (err) {
        console.error("회원 정보 불러오기 실패", err);
      }
    };

    fetchUserInfo();
  }, []);

  const handleSubmit = async (password) => {
    try {
      const token = localStorage.getItem("token");
      // ✅ 먼저 비밀번호 확인
      await axios.post(`${BASE_URL}/client/verify-password`, { password }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await axios.put(`${BASE_URL}/client/userupdate`,
        { phone, company },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      alert("회원정보가 수정되었습니다!");
      navigate("/client/userinfo");
    } catch (err) {
      console.error("수정 실패", err);
      alert("수정 중 오류 발생");
    }
  };



  if (!userInfo) return <Typography>로딩 중...</Typography>;

  return (
    <Box sx={{ flex: 1, p: 3 }}>
      <Box sx={{ display: "flex", gap: 1 }}>
        <AccountCircleIcon sx={{ fontSize: 40 }} />
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          회원 수정
        </Typography>
      </Box>
      <Card sx={{ p: 4 }}>
        <Typography variant="h6" gutterBottom>
          안녕하세요! <strong>{userInfo.nickname}</strong>님
        </Typography>
        <Divider sx={{ my: 2 }} />

        <Stack spacing={2}>
          <DisplayItem label="아이디" value={userInfo.user_id} />
          <DisplayItem label="이메일" value={userInfo.email} />
          <TextField
            label="휴대전화"
            variant="outlined"
            fullWidth
            size="small"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <TextField
            label="회사명"
            variant="outlined"
            fullWidth
            size="small"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
          />
        </Stack>

        <Box sx={{ mt: 4, textAlign: "center" }}>
          <Button variant="contained" onClick={() => setDialogOpen(true)}>
            수정
          </Button>
          <PasswordConfirmDialog
            open={dialogOpen}
            onConfirm={(password) => {
              setDialogOpen(false);
              handleSubmit(password);
            }}
            onCancel={() => setDialogOpen(false)}
          />
        </Box>
      </Card>
    </Box>
  );
}

function DisplayItem({ label, value }) {
  return (
    <Box sx={{ display: "flex", justifyContent: "space-between" }}>
      <Typography color="text.secondary">{label}</Typography>
      <Typography fontWeight="bold">{value}</Typography>
    </Box>
  );
}
