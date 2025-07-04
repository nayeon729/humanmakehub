import React, { useState, useEffect } from "react";
import {
  Box, Typography, Paper, Grid, Chip, Stack, Button, IconButton
} from "@mui/material";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import AddIcon from '@mui/icons-material/Add';

export default function AdminProjectManagementPage() {
  const [projects, setProjects] = useState([]);
  const BASE_URL = "http://127.0.0.1:8000";
  const navigate = useNavigate();

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const token = localStorage.getItem("token");
      console.log("보내는 토큰:", token);
      const res = await axios.get(`${BASE_URL}/admin/projects`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const cleanedProjects = res.data.map((proj) => ({
        ...proj,
        pm: proj.pm || "미지정",
        status: proj.status || "승인 대기",
      }));
      setProjects(cleanedProjects);
    } catch (error) {
      console.error("프로젝트 불러오기 실패", error);
    }
  };

  const statusColor = (status) => {
    if (status === "완료됨") return "success";
    if (status === "진행 중") return "primary";
    if (status === "검토 중") return "warning";
    return "default";
  };

  return (
    <Box sx={{ p: 4 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Typography variant="h5" fontWeight="bold">📁 전체 프로젝트</Typography>
        </Stack>
        <IconButton color="primary" size="large">
          <AddIcon />
        </IconButton>
      </Stack>

      <Grid container spacing={3}>
        {projects.map((proj) => {
          const formattedDate = new Date(proj.create_dt).toLocaleDateString("ko-KR");
          return (
            <Grid item xs={12} sm={6} md={4} key={proj.project_id}>
              <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                  <Chip label={proj.status} color={statusColor(proj.status)} size="small" />
                  <Typography variant="caption" color="text.secondary">
                    접수일: {formattedDate}
                  </Typography>
                </Stack>

                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  {proj.title}
                </Typography>

                <Typography variant="body2" gutterBottom>
                  <strong>고객:</strong> {proj.client_id}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>회사명:</strong> {proj.client_company}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>Email:</strong> {proj.client_email}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>예상 기간:</strong> {proj.estimated_duration}일
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>예산:</strong> {proj.budget}원
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>요구사항:</strong> <br/>
                  {proj.description}
                </Typography>
                <Button
                  variant="contained"
                  fullWidth
                  sx={{ mt: 2 }}
                  onClick={() => navigate(`/admin/project/${proj.project_id}`)}
                >
                  관리하기
                </Button>
              </Paper>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
}
