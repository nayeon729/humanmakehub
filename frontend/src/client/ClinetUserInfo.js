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
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import PasswordConfirmDialog from "../components/PasswordConfirmDialog";
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import { useAlert } from "../components/CommonAlert";
import Tooltip from "@mui/material/Tooltip";

const BASE_URL = process.env.REACT_APP_API_URL;

export default function ClientUserInfo() {
  const [userInfo, setUserInfo] = useState(null);
  const [searchParams] = useSearchParams();
  const [myId, setMyId] = useState("");
  const isReadonly = searchParams.get("readonly") === "1";
  const { user_id } = useParams();
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);
  const { showAlert } = useAlert();

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const token = sessionStorage.getItem("token");
        let res;
        if (user_id && isReadonly) {
          res = await axios.get(`${BASE_URL}/admin/users/${user_id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
        } else {
          res = await axios.get(`${BASE_URL}/client/userinfo`, {
            headers: { Authorization: `Bearer ${token}` },
          });
        }

        setUserInfo(res.data);
        setMyId(res.data.user_id);
      } catch (err) {
        console.error("회원 정보 조회 실패", err);
        showAlert("회원 정보를 불러오지 못했습니다.");
      }
    };

    fetchUserInfo();
  }, [user_id, isReadonly]);

  if (!userInfo) return <Typography>로딩 중입니다...</Typography>;

  return isReadonly ? (
    <ClientReadOnlyView userInfo={userInfo} />
  ) : (
    <ClientEditableView userInfo={userInfo} />
  );
}

function ClientReadOnlyView({ userInfo }) {
  return (
    <Box sx={{ flex: 1, p: 3 }}>
      <Box sx={{ display: "flex", gap: 1 }}>
        <AccountCircleIcon sx={{ fontSize: 40, color:'#9d9d9d' }} />
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          클라이언트 정보
        </Typography>
      </Box>
      <Card sx={{ p: 4 }}>
        <Typography variant="h6" gutterBottom>
          안녕하세요! <strong>{userInfo.nickname}</strong> 님
        </Typography>
        <Divider sx={{ my: 2 }} />
        <Stack spacing={2}>
          <InfoItem label="아이디" value={userInfo.user_id} />
          <InfoItem label="이메일" value={userInfo.email} />
          <InfoItem label="휴대전화" value={userInfo.phone || "-"} />
          <InfoItem label="회사명" value={userInfo.company || "-"} />
        </Stack>
      </Card>
    </Box>
  );
}

function ClientEditableView({ userInfo }) {
  const navigate = useNavigate();
  const { showAlert } = useAlert();
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleWithdraw = async (password) => {
    try {
      const token = sessionStorage.getItem("token");

      await axios.post(`${BASE_URL}/client/verify-password`, { password }, {
        headers: { Authorization: `Bearer ${token}` }
      });

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
    <Box sx={{ p: 2, pt: 3 }}>
      <Box sx={{ display: "flex", alignItems: "center" }}>
        <Tooltip
          title={
            <Typography sx={{ fontSize: 13, color: "#fff" }}>
              This little budf is <b>really cute</b> 🐤
            </Typography>
          }
          placement="right"
          arrow
        >
          <Box sx={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
            <AccountCircleIcon sx={{ fontSize: "40px", mr: "4px", color:'#9d9d9d' }} />
            <Typography
              variant="h4"
              fontWeight="bold"
              gutterBottom
              sx={{ mb: 0, cursor: "help", }}
            >
              회원정보
            </Typography>
          </Box>
        </Tooltip>
      </Box>
      <Card sx={{ p: 4 }}>
        <Typography variant="h6" gutterBottom>
          안녕하세요! <strong>{userInfo.nickname}</strong> 님
        </Typography>
        <Divider sx={{ my: 2 }} />
        <Stack spacing={2}>
          <InfoItem label="아이디" value={userInfo.user_id} />
          <InfoItem label="이메일" value={userInfo.email} />
          <InfoItem label="휴대전화" value={userInfo.phone || "-"} />
          <InfoItem label="회사명" value={userInfo.company || "-"} />
        </Stack>
        <Box sx={{ display: "flex", justifyContent: "space-between", mt: 4 }}>
          <Button variant="contained" onClick={() => navigate("/client/userupdate")}>
            회원정보 수정
          </Button>
          <Button variant="outlined" onClick={() => setDialogOpen(true)}>
            회원탈퇴
          </Button>
        </Box>

        <PasswordConfirmDialog
          open={dialogOpen}
          onConfirm={handleWithdraw}
          onCancel={() => setDialogOpen(false)}
        />
      </Card>
    </Box>
  );
}

function InfoItem({ label, value }) {
  return (
    <Box sx={{ display: "flex", justifyContent: "space-between" }}>
      <Typography color="text.secondary">{label}</Typography>
      <Typography fontWeight="bold">{value}</Typography>
    </Box>
  );
}