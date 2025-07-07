import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  LinearProgress,
  Chip,
  Stack,
} from "@mui/material";
import axios from "axios";

const MemberProjectList = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          alert("로그인 후 사용 가능합니다.");
          return;
        }

        const response = await axios.post(
          "http://127.0.0.1:8000/member/list",
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setProjects(response.data.projects);
        setLoading(false);
      } catch (error) {
        console.error("프로젝트 목록을 가져오는 데 실패했습니다.", error);
        setLoading(false);
        alert("프로젝트 목록을 가져오는 데 실패했습니다.");
      }
    };

    fetchProjects();
  }, []);

  if (loading) return <Typography variant="h6">로딩 중...</Typography>;

  return (
    <Box sx={{ px: 4, py: 6 }}>
      <Typography variant="h4" mb={4} fontWeight="bold">
        📁 프로젝트 목록
      </Typography>
      <Grid container spacing={3}>
        {projects.map((project) => (
          <Grid item xs={12} sm={6} md={4} key={project.id}>
            <Paper
              elevation={4}
              sx={{
                p: 3,
                borderRadius: 3,
                display: "flex",
                flexDirection: "column",
                gap: 1,
                width: 300,
                height: 480,
                overflow: "hidden",
              }}
            >
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Chip label={`긴급도: ${project.urgency_level}`} color="success" size="small" />
                <Typography variant="caption" color="text.secondary">
                  {project.create_date}
                </Typography>
              </Stack>

              <Typography variant="h6" fontWeight="bold">
                {project.title}
              </Typography>
              <Typography variant="body2">
                카테고리: {project.category_name}
              </Typography>
              <Typography variant="body2">예상 기간: {project.estimated_duration}일</Typography>
              <Typography variant="body2">예상 예산: {project.budget.toLocaleString()}원</Typography>
              <Typography variant="body2">요구사항</Typography>
              <Box
                sx={{
                  border: "1px solid #ccc", // 테두리 색상
                  borderRadius: 2,          // 둥근 정도
                  padding: 1.5,             // 안쪽 여백
                  mt: 0.3,                    // 위쪽 여백 (margin-top)
                  bgcolor: "#f9f9f9",       // 배경색 (선택)
                  height: 100,
                  
                }}
              >
                <Typography variant="body2">{project.description}</Typography>
              </Box>

              <Box
                sx={{
                  mt: 1,
                  p: 1,
                  bgcolor: "#f9f9f9",
                  border: "1px solid #ddd",
                  borderRadius: 2,
                }}
              >
                <Typography variant="body2" fontWeight="bold">
                  진행 상황: {project.progress >= 100 ? "완료" : project.progress >= 50 ? "진행 중" : "대기 중"}
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={project.progress || 0}
                  sx={{ height: 8, borderRadius: 5, mt: 1 }}
                  color={project.progress === 100 ? "success" : "primary"}
                />
              </Box>

              <Button
                fullWidth
                variant="contained"
                sx={{ mt: 2, bgcolor: project.progress === 0 ? "error.main" : project.progress >= 50 ? "primary.main" : "success.main" }}
              >
                {project.progress === 0 ? "참여하기" : project.progress >= 50 ? "프로젝트 채널" : "참여 대기"}
              </Button>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default MemberProjectList;
