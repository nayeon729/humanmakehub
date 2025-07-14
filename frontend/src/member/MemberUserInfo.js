import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Card,
  Typography,
  Stack,
  Divider,
  Grid,
  Paper,
} from "@mui/material";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import PasswordConfirmDialog from "../components/PasswordConfirmDialog";
import Combo from "../components/Combo";  // Combo 컴포넌트 경로 맞게 수정!
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import { useParams, useSearchParams } from "react-router-dom";



const BASE_URL = process.env.REACT_APP_API_URL;

export default function MemberUserInfo() {
  const [userInfo, setUserInfo] = useState(null);
  const [git, setGit] = useState("");
  const [portfolio, setPortfolio] = useState("");
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [myId, setMyId] = useState("");
  const { user_id } = useParams();
  const [searchParams] = useSearchParams();
  const isReadonly = searchParams.get("readonly") === "1";


  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const token = sessionStorage.getItem("token");
        let res;

        if (user_id && isReadonly) {
          // 👉 관리자가 개발자 조회하는 경우
          res = await axios.get(`${BASE_URL}/admin/users/${user_id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          console.log("🔍 가져온 데이터:", res.data);
        } else {
          // 👉 일반 사용자 본인 정보
          res = await axios.get(`${BASE_URL}/user/me`, {
            headers: { Authorization: `Bearer ${token}` }
          });
        }

        setUserInfo(res.data);
        setMyId(res.data.user_id);
      } catch (err) {
        console.error("회원 정보 조회 실패", err);
        alert("사용자 정보를 불러올 수 없습니다.");
      }
    };

    fetchUserInfo();
  }, [user_id, isReadonly]);


  if (!userInfo) return <Typography>로딩중...</Typography>;


  const handleWithdraw = async (password) => {

    try {
      const token = sessionStorage.getItem("token");

      // ✅ 먼저 비밀번호 확인
      await axios.post(`${BASE_URL}/member/verify-password`, { password }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // ✅ 통과하면 탈퇴 요청
      await axios.put(`${BASE_URL}/member/withdraw`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert("탈퇴가 완료되었습니다.");
      sessionStorage.removeItem("token");
      navigate("/");
    } catch (err) {
      alert("비밀번호가 일치하지 않거나 오류 발생");
      console.error(err);
    }
  };
  return (
    <>
      {/* <Typography variant="h4" fontWeight="bold" gutterBottom>
        <img src={DevIcon} alt="개발자" width={40} height={40} style={{ verticalAlign: "middle", marginRight: 8 }} />
        회원정보
      </Typography> */}

      {isReadonly ? (
        <ReadOnlyView userInfo={userInfo} />
      ) : (
        <EditableView userInfo={userInfo} myId={myId} />
      )}
    </>
  );
}

// ✅ 관리자용: 읽기 전용
function ReadOnlyView({ userInfo }) {
  return (

    <Box sx={{ flex: 1, p: 3 }}>
      <Box sx={{ display: "flex", gap: 1 }}>
        <AccountCircleIcon sx={{ fontSize: 40 }} />
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          회원정보
        </Typography>
      </Box>
      <Paper sx={{
        p: 3,
        mt: 2,
        backgroundColor: "#fff",
        mt: 2,
        borderRadius: 2,
        boxShadow: "4px 4px 8px rgba(0, 0, 0, 0.1)",
        "& fieldset": { border: "none" },
        borderTop: "1px solid #ddd",
        borderLeft: "1px solid #ddd",
      }}>
        <Typography variant="h6" gutterBottom>
          안녕하세요! <strong>{userInfo.nickname}</strong> 님
          <span style={{ fontSize: "0.9rem", color: "#888", marginLeft: "8px" }}>
            {userInfo.user_id}
          </span>
        </Typography>

        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
          <Typography>{userInfo.email} / {userInfo.phone || "-"}</Typography>
        </Box>

        <Stack direction="row" spacing={1} flexWrap="wrap">
          {userInfo.skills?.length > 0 ? (
            userInfo.skills.map((skill) => (
              <Box key={skill.code_id} sx={{ px: 2, py: 1, bgcolor: "#f0f0f0", borderRadius: 3, mb: 1 }}>
                <Typography variant="body2">
                  {skill.skill_name} | {skill.is_fresher === "Y" ? "신입" : `${skill.years}년`}
                </Typography>
              </Box>
            ))
          ) : (
            <Typography>보유 기술 없음</Typography>
          )}
        </Stack>

        <Divider sx={{ borderBottomWidth: 2, borderColor: "black", my: 3 }} />

        <Stack spacing={2}>
          <Grid container spacing={30} justifyContent="center">
            <Grid item xs={12} sm={6} md={5} sx={{ textAlign: "center" }}>
              <Typography fontWeight="bold" mb={1}>주요 기술</Typography>
              <Typography sx={{ whiteSpace: "pre-line" }}>{userInfo.tech || "-"}</Typography>
            </Grid>
            <Grid item xs={12} md={6} sx={{ textAlign: "center" }}>
              <Typography fontWeight="bold" mb={1}>경험</Typography>
              <Typography sx={{ whiteSpace: "pre-line" }}>{userInfo.experience || "-"}</Typography>
            </Grid>
          </Grid>

          <Box sx={{ textAlign: "center", mt: 4 }}>
            <Typography sx={{ mb: 5 }}>
              <strong>Git 주소</strong>{" "}
              {userInfo.git ? <a href={userInfo.git} target="_blank" rel="noreferrer">{userInfo.git}</a> : "-"}
            </Typography>
            <Typography sx={{ mb: 5 }}>
              <strong>포트폴리오 주소</strong>{" "}
              {userInfo.portfolio ? <a href={userInfo.portfolio} target="_blank" rel="noreferrer">{userInfo.portfolio}</a> : "-"}
            </Typography>
          </Box>
        </Stack>
      </Paper>
    </Box>
  );
}


// ✅ 본인용: 수정/탈퇴 가능한 뷰
function EditableView({ userInfo, myId }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const navigate = useNavigate();

  const handleWithdraw = async (password) => {
    try {
      const token = sessionStorage.getItem("token");

      await axios.post(`${BASE_URL}/member/verify-password`, { password }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      await axios.put(`${BASE_URL}/member/withdraw`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });

      alert("탈퇴가 완료되었습니다.");
      sessionStorage.removeItem("token");
      navigate("/");
    } catch (err) {
      alert("비밀번호가 일치하지 않거나 오류 발생");
      console.error(err);
    }
  };

  return (
    <>

      <Box sx={{ display: "flex", gap: 1 }}>
        <AccountCircleIcon sx={{ fontSize: 40 }} />
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          회원정보
        </Typography>
      </Box>

      <Paper sx={{
        p: 3,
        mt: 2,
        backgroundColor: "#fff",
        mt: 2,
        borderRadius: 2,
        boxShadow: "4px 4px 8px rgba(0, 0, 0, 0.1)",
        "& fieldset": { border: "none" },
        borderTop: "1px solid #ddd",
        borderLeft: "1px solid #ddd",
        height: 650,
      }}>

        <Typography variant="h6" gutterBottom>
          안녕하세요! <strong>{userInfo.nickname}</strong> 님
          <span style={{ fontSize: "0.9rem", color: "#888", marginLeft: "8px" }}>
            {userInfo.user_id}
          </span>
        </Typography>

        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
          <Typography>{userInfo.email} / {userInfo.phone || "-"}</Typography>
        </Box>

        <Stack direction="row" spacing={1} flexWrap="wrap">
          {userInfo.skills?.length > 0 ? (
            userInfo.skills.map((skill) => (
              <Box key={skill.code_id} sx={{ px: 2, py: 1, bgcolor: "#f0f0f0", borderRadius: 3, mb: 1 }}>
                <Typography variant="body2">
                  {skill.skill_name} | {skill.is_fresher === "Y" ? "신입" : `${skill.years}년`}
                </Typography>
              </Box>
            ))
          ) : (
            <Typography>보유 기술 없음</Typography>
          )}
        </Stack>

        <Divider sx={{ borderBottomWidth: 2, borderColor: "black", my: 3 }} />

        <Stack spacing={2}>
          <Grid container spacing={30} justifyContent="center">
            <Grid item xs={12} sm={6} md={5} sx={{ textAlign: "center" }}>
              <Typography fontWeight="bold" mb={1}>주요 기술</Typography>
              <Typography sx={{ whiteSpace: "pre-line" }}>{userInfo.tech || "-"}</Typography>
            </Grid>
            <Grid item xs={12} md={6} sx={{ textAlign: "center" }}>
              <Typography fontWeight="bold" mb={1}>경험</Typography>
              <Typography sx={{ whiteSpace: "pre-line" }}>{userInfo.experience || "-"}</Typography>
            </Grid>
          </Grid>

          <Box sx={{ textAlign: "center", mt: 4 }}>
            <Typography sx={{ mb: 5 }}>
              <strong>Git 주소</strong>{" "}
              {userInfo.git ? <a href={userInfo.git} target="_blank" rel="noreferrer">{userInfo.git}</a> : "-"}
            </Typography>
            <Typography sx={{ mb: 5 }}>
              <strong>포트폴리오 주소</strong>{" "}
              {userInfo.portfolio ? <a href={userInfo.portfolio} target="_blank" rel="noreferrer">{userInfo.portfolio}</a> : "-"}
            </Typography>
          </Box>

          <Box sx={{ display: "flex", justifyContent: "center", mt: 4, gap: 1 }}>
            <Button variant="contained" onClick={() => navigate("/member/userupdate")}>
              회원정보 수정
            </Button>
            <Button variant="contained" onClick={() => setDialogOpen(true)}>
              회원탈퇴
            </Button>
          </Box>
        </Stack>

        <PasswordConfirmDialog
          open={dialogOpen}
          onConfirm={(password) => {
            setDialogOpen(false);
            handleWithdraw(password);
          }}
          onCancel={() => setDialogOpen(false)}
        />

      </Paper>
    </>
  );
}
