/**
 * 파일명: ClientUserEditPage.js
 * 설명: 클라이언트(고객)의 회원정보(휴대전화, 회사명)를 수정하는 페이지.
 * 주요 기능:
 *   - /client/userinfo: 로그인된 사용자 정보 조회 후 초기값 세팅
 *   - /client/verify-password: 비밀번호 확인 후 수정 허용
 *   - /client/userupdate: 입력값을 PUT 요청으로 전송하여 정보 수정
 *   - 수정 완료 후 /client/userinfo로 이동
 * 비고:
 *   - 수정 전 비밀번호 확인을 위한 PasswordConfirmDialog 컴포넌트 포함
 *   - axiosInstance 사용, JWT 토큰 헤더 자동 포함
 */
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
import axios from "../common/axiosInstance"
import PasswordConfirmDialog from "../components/PasswordConfirmDialog";
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import { useAlert } from "../components/CommonAlert";
import Tooltip from "@mui/material/Tooltip";
import HelpIcon from '@mui/icons-material/Help';

const BASE_URL = process.env.REACT_APP_API_URL;

export default function ClientUserEditPage() {
  const [userInfo, setUserInfo] = useState(null);
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const navigate = useNavigate();
  const { showAlert } = useAlert();

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const token = sessionStorage.getItem("token");
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
    if(company.length>50){
      return showAlert("회사명은 50자까지 입력 가능합니다.");
    }
    try {
      const token = sessionStorage.getItem("token");
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
      showAlert("회원정보가 수정되었습니다!");
      navigate("/client/userinfo");
    } catch (err) {
      console.error("수정 실패", err);
      showAlert("수정 중 오류 발생");
    }
  };



  if (!userInfo) return <Typography>로딩 중...</Typography>;

  return (
    <Box sx={{ p: 2, pt: 3 }}>
      <Stack sx={{ display: 'flex', flexDirection: 'row', mb:'20px' }}>
        <Typography
          variant="h4"
          fontWeight="bold"
          gutterBottom
          sx={{ mb: 0 }}
        >
          회원수정
        </Typography>
        <Tooltip
          title={
            <Typography sx={{ fontSize: 13, color: "#fff" }}>
              고객의 회원정보를 수정하는 페이지 입니다.
            </Typography>
          }
          placement="right"
          arrow
        >
          <HelpIcon sx={{color:'gray', fontSize: 22, mt: "2px", mr: "4px" }} />
        </Tooltip>
      </Stack>
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
