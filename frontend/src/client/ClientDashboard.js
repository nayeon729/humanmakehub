// src/pages/client/ClientDashBoard.js

import React, { useEffect, useState } from "react";
import { Box, Typography, Button, Paper, Grid, Chip, Skeleton, Stack, LinearProgress } from "@mui/material";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function ClientDashBoard() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  const BASE_URL = "http://127.0.0.1:8000";

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${BASE_URL}/client/projects`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProjects(response.data);
    } catch (error) {
      console.error("프로젝트 목록 불러오기 실패", error);
    } finally {
      setLoading(false);
    }
  };

  const goToCreatePage = () => {
    navigate("/client/create");
  };

  const goToDetailPage = (id) => {
    navigate(`/client/project/${id}`);
  };

  const statusColor = (status) => {
    if (status === "완료됨") return "success";
    if (status === "검토 중") return "warning";
    return "primary";
  };

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        📂 내 프로젝트 관리
      </Typography>

      <Button
        variant="contained"
        color="primary"
        size="large"
        onClick={goToCreatePage}
        sx={{ mb: 4 }}
      >
        ➕ 새 프로젝트 등록
      </Button>

      {loading ? (
        <Grid container spacing={3}>
          {Array.from({ length: 3 }).map((_, idx) => (
            <Grid item xs={12} sm={6} md={4} key={idx}>
              <Skeleton variant="rectangular" height={180} />
            </Grid>
          ))}
        </Grid>
      ) : projects.length === 0 ? (
        <Typography variant="body1" color="text.secondary">
          등록된 프로젝트가 없습니다. 새 프로젝트를 등록해보세요.
        </Typography>
      ) : (
        <Grid container spacing={3}>
          {projects.map((project) => (
            <Grid item xs={12} sm={6} md={4} key={project.id}>
              <Paper
                sx={{
                  p: 3,
                  borderRadius: 3,
                  boxShadow: 3,
                  transition: "0.3s",
                  "&:hover": { boxShadow: 8, transform: "scale(1.02)" },
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between"
                }}
              >
                <Box>
                  <Typography variant="h6" fontWeight="bold" noWrap gutterBottom>
                    {project.title}
                  </Typography>

                  <Typography variant="body2" color="text.secondary" noWrap>
                    {project.description || "설명 없음"}
                  </Typography>

                  <Stack direction="row" spacing={1} alignItems="center" mt={2}>
                    <Chip
                      label={project.status}
                      color={statusColor(project.status)}
                      size="small"
                    />
                  </Stack>

                  {/* 🔥 진행률 표시 */}
                  <Box mt={2}>
                    <Typography variant="caption" color="text.secondary">
                      진행률: {project.progress ?? 0}%
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={project.progress ?? 0}
                      sx={{ height: 8, borderRadius: 5, mt: 0.5 }}
                    />
                  </Box>

                  {/* 🔥 담당 PM 표시 */}
                  <Typography variant="caption" color="text.secondary" display="block" mt={1}>
                    담당 PM: {project.pm || "PM 미지정"}
                  </Typography>

                  <Typography variant="caption" color="text.disabled" display="block" mt={1}>
                    등록일: {new Date(project.created_at).toLocaleDateString()}
                  </Typography>

                  {project.estimated_duration && (
                    <Typography variant="caption" color="text.secondary">
                      예상 기간: {project.estimated_duration}일
                    </Typography>
                  )}

                  {project.budget && (
                    <Typography variant="caption" color="text.secondary" display="block">
                      예산: {project.budget.toLocaleString()}원
                    </Typography>
                  )}
                </Box>

                <Stack direction="row" spacing={1} mt={2}>
                  <Button
                    variant="outlined"
                    size="small"
                    fullWidth
                    onClick={() => goToDetailPage(project.id)}
                  >
                    상세보기
                  </Button>
                </Stack>
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}
