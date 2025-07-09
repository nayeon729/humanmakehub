import React, { useState, useEffect } from "react";
import {
  Box, Typography, Paper, Grid, Button, LinearProgress, Chip, Stack,
} from "@mui/material";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Folder from "../assets/folder.png";


const MemberProjectList = () => {
  const [invites, setInvites] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const BASE_URL = "http://127.0.0.1:8000";

  useEffect(() => {
    fetchInvitesAndConfirmed();
  }, []);

  const fetchInvitesAndConfirmed = async () => {
    try {
      const token = localStorage.getItem("token");
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const [invRes, confirmedRes] = await Promise.all([
        axios.get(`${BASE_URL}/member/invites`, config),
        axios.post(`${BASE_URL}/member/confirmed-projects`, {}, config),
      ]);

      const confirmedIds = confirmedRes.data.confirmed_projects;
      // 초대 목록에 확정 여부 추가
      const combined = invRes.data.invites.map(invite => ({
        ...invite,
        isConfirmed: confirmedIds.includes(invite.project_id),
      }));

      setInvites(combined);
      setLoading(false);
    } catch (error) {
      console.error("프로젝트 목록 불러오기 실패", error);
      alert("프로젝트 목록을 불러오는 데 실패했습니다.");
      setLoading(false);
    }
  };


  const handleRespond = async (requestId, accept) => {
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `${BASE_URL}/member/invite/${requestId}/respond`,
        { accept },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert(accept ? "참여 완료!" : "거절 완료");
      fetchInvitesAndConfirmed(); // 다시 목록 갱신
    } catch (err) {
      console.error("응답 실패", err);
      alert("응답 처리에 실패했습니다.");
    }
  };

  if (loading) return <Typography variant="h6">로딩 중...</Typography>;

  return (
    <Box sx={{ px: 4, py: 3 }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        <img src={Folder} alt="폴더" width={40} height={40} style={{ verticalAlign: "middle", marginRight: 8 }} />
        프로젝트 목록
      </Typography>
      <Grid container spacing={3}>
        {invites.map((project) => (
          <Grid item xs={12} sm={6} md={4} key={project.request_id}>
            <Paper elevation={4} sx={{
              p: 2, borderRadius: 3, display: "flex", flexDirection: "column", justifyContent: "space-between",
              gap: 1, width: 265, height: 520, overflow: "hidden",
            }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Chip label={`긴급도: ${project.urgency_level || "없음"}`} color="success" size="small" />
                <Typography variant="caption" color="text.secondary">
                  접수일 : {new Date(project.create_dt).toLocaleDateString("ko-KR")}
                </Typography>
              </Stack>

              <Typography variant="h6" fontWeight="bold">
                {project.title}
              </Typography>
              <Typography variant="body2">
                카테고리: {project.category_name || "없음"}
              </Typography>
              <Typography variant="body2">예상 기간: {project.estimated_duration}일</Typography>
              <Typography variant="body2">예상 예산: {project.budget?.toLocaleString()}원</Typography>
              <Typography variant="body2">요구사항</Typography>
              <Box sx={{
                border: "1px solid #ccc", borderRadius: 2,
                padding: 1.5, mt: 0.3, bgcolor: "#f9f9f9", height: 100
              }}>
                <Typography variant="body2">{project.description}</Typography>
              </Box>

              <Box sx={{
                mt: 1, p: 1, bgcolor: "#f9f9f9",
                border: "1px solid #ddd", borderRadius: 2
              }}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Typography variant="body2" fontWeight="bold">
                    진행 상황
                  </Typography>
                  <Chip
                    label={
                      project.progress >= 100
                        ? "완료"
                        : project.progress >= 50
                          ? "진행 중"
                          : "대기 중"
                    }
                    size="small"
                    sx={{
                      bgcolor:
                        project.progress >= 100
                          ? "#4caf50" // 초록
                          : project.progress >= 50
                            ? "#90caf9" // 파랑
                            : "#90caf9", // 회색
                      color: "white",
                      fontWeight: "bold",
                    }}
                  />
                </Stack>
                <LinearProgress
                  variant="determinate"
                  value={project.progress || 0}
                  sx={{ height: 8, borderRadius: 5, mt: 1 }}
                  color={project.progress === 100 ? "success" : "primary"}
                />
              </Box>

              {project.isConfirmed ? (
                <Button
                  fullWidth
                  variant="contained"
                  sx={{
                    mt: 3,
                    fontWeight: "bold",
                    fontSize: "16px",
                    py: 1.5,
                  }}
                  onClick={() => navigate(`/member/project/${project.project_id}`)}
                >
                  📘 프로젝트 채널
                </Button>
              ) : project.checking === "N" ? (
                <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={() => handleRespond(project.request_id, true)}
                    sx={{
                      backgroundColor: "#E53434",
                      color: "#ffffff",
                    }}
                  >
                    참여
                  </Button>

                  <Button
                    fullWidth
                    variant="outlined"
                    color="error"
                    onClick={() => handleRespond(project.request_id, false)}
                  >
                    거절
                  </Button>
                </Stack>
              ) : project.checking === "Y" && project.status === "Y" ? (
                <Button
                  fullWidth
                  variant="contained"
                  sx={{
                    mt: 2,
                    backgroundColor: "gray",
                    color: "white",
                    opacity: 1,
                    pointerEvents: "none",
                    cursor: "default",
                  }}
                >
                  참여 대기
                </Button>
              ) : (
                <Typography variant="body2" sx={{ mt: 2 }} color="error">
                  ❌ 거절한 프로젝트
                </Typography>
              )}

            </Paper>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default MemberProjectList;
