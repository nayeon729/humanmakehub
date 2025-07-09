import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Card,
  Typography,
  Stack,
  Divider,
  Grid,
} from "@mui/material";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import PasswordConfirmDialog from "../components/PasswordConfirmDialog";
import Combo from "../components/Combo";  // Combo 컴포넌트 경로 맞게 수정!
import DevIcon from "../assets/dev-icon.png";


const BASE_URL = "http://127.0.0.1:8000";

export default function ClientUserInfo() {
  const [userInfo, setUserInfo] = useState(null);
  const [git, setGit] = useState("");
  const [portfolio, setPortfolio] = useState("");
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [myId, setMyId] = useState("");



  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${BASE_URL}/user/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log("🎯 사용자 정보:", res.data);
        setUserInfo(res.data);
        setMyId(res.data.user_id);
      } catch (err) {
        console.error("회원 정보 조회 실패", err);
      }
    };

    fetchUserInfo();
  }, []);

  if (!userInfo) return <Typography>로딩중...</Typography>;


  const handleWithdraw = async (password) => {

    try {
      const token = localStorage.getItem("token");

      // ✅ 먼저 비밀번호 확인
      await axios.post(`${BASE_URL}/member/verify-password`, { password }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // ✅ 통과하면 탈퇴 요청
      await axios.put(`${BASE_URL}/member/withdraw`, {}, {
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
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        <img src={DevIcon} alt="개발자" width={40} height={40} style={{ verticalAlign: "middle", marginRight: 8 }} />
        회원정보
      </Typography>
      
      <Card sx={{ p: 4 }}>
        <Typography variant="h6" gutterBottom>
          안녕하세요! <strong>{userInfo.nickname}</strong> 님
          <span style={{ fontSize: "0.9rem", color: "#888", marginLeft: "8px" }}>
            {userInfo.user_id}
          </span>
        </Typography>

        {/* 연락처 */}
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
          <Typography>
            {userInfo.email} / {userInfo.phone || "-"}
          </Typography>
        </Box>


        {/* 보유 기술 스택 */}
        <Box>

          <Stack direction="row" spacing={1} flexWrap="wrap">
            {userInfo.skills && userInfo.skills.length > 0 ? (
              userInfo.skills.map((skill) => {
                const experience =
                  skill.is_fresher === "Y" ? "신입" : `${skill.years}년`;
                return (
                  <Box
                    key={skill.code_id}
                    sx={{
                      px: 2,
                      py: 1,
                      bgcolor: "#f0f0f0",
                      borderRadius: 3,
                      mb: 1,
                    }}
                  >
                    <Typography variant="body2">
                      {skill.skill_name} | {experience}
                    </Typography>
                  </Box>
                );
              })
            ) : (
              <Typography>보유 기술 없음</Typography>
            )}
          </Stack>
        </Box>
        <br />

        <Divider sx={{ borderBottomWidth: 2, borderColor: "black", mb: 3 }} />

        <Stack spacing={2}>
          <Grid container spacing={30} justifyContent="center">
            {/* 주요 기술 */}
            <Grid item xs={12} sm={6} md={5} sx={{ textAlign: "center" }}>
              <Typography fontWeight="bold" mb={1}>
                주요 기술
              </Typography>
              <Typography sx={{ whiteSpace: "pre-line" }}>
                {userInfo.tech || "-"}
              </Typography>
            </Grid>

            {/* 경험 */}
            <Grid item xs={12} md={6} sx={{ textAlign: "center" }}>
              <Typography fontWeight="bold" mb={1}>
                경험
              </Typography>
              <Typography sx={{ whiteSpace: "pre-line" }}>
                {userInfo.experience || "-"}
              </Typography>
            </Grid>
          </Grid>

          {/* Git 주소 */}
          <Box sx={{ textAlign: "center", mt: 4, }}>
            <Typography sx={{ mb: 10, mt: 10, }}>
              <strong>Git 주소</strong>{" "}
              {userInfo.git ? (
                <a href={userInfo.git} target="_blank" rel="noopener noreferrer">
                  {userInfo.git}
                </a>
              ) : (
                "-"
              )}
            </Typography>

            {/* 포트폴리오 주소 */}
            <Typography sx={{ mb: 5 }}>
              <strong>포트폴리오 주소</strong>{" "}
              {userInfo.portfolio ? (
                <a href={userInfo.portfolio} target="_blank" rel="noopener noreferrer">
                  {userInfo.portfolio}
                </a>
              ) : (
                "-"
              )}
            </Typography>
          </Box>

          {/* 버튼들 */}
          {userInfo && myId === userInfo.user_id && (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                mt: 4,
                gap: 1,
              }}
            >
              <Button
                variant="contained"
                onClick={() => navigate("/member/userupdate")}
              >
                회원정보 수정
              </Button>
              <Button variant="contained" onClick={() => setDialogOpen(true)}>
                회원탈퇴
              </Button>
            </Box>
          )}
        </Stack>
      </Card>

      {/* 비밀번호 확인 다이얼로그 */}
      <PasswordConfirmDialog
        open={dialogOpen}
        onConfirm={(password) => {
          setDialogOpen(false);
          handleWithdraw(password);
        }}
        onCancel={() => setDialogOpen(false)}
      />
    </>
  );
}

