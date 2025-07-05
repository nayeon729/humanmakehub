import React, { useState, useEffect } from "react";
import {
  Box, Typography, Paper, LinearProgress, Select, MenuItem,
  Slider, Grid, Chip, Stack, Button
} from "@mui/material";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function AdminProjectManagementPage() {
  const [projects, setProjects] = useState([]);
  const BASE_URL = "http://127.0.0.1:8000"
  const navigate = useNavigate();

  useEffect(() => {
    fetchProjects();
  }, []);

  

  const fetchProjects = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${BASE_URL}/admin/my-projects`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const cleanedProjects = res.data.map((proj) => ({
        ...proj,
        pm: proj.pm || "",
        status: proj.status && proj.status !== "" ? proj.status : "승인 대기",
        progress: proj.progress ?? 0
      }));
      setProjects(cleanedProjects);
    } catch (error) {
      console.error("프로젝트 불러오기 실패", error);
    }
  };

  const updateProject = async (project_id, updatedFields) => {
    try {
      await axios.put(`${BASE_URL}/projects/${project_id}`, updatedFields);
    } catch (error) {
      console.error("프로젝트 업데이트 실패", error);
    }
  };

  const handleProgressChange = (project_id, value) => {
    setProjects((prev) =>
      prev.map((proj) =>
        proj.project_id === project_id
          ? { ...proj, progress: value, status: value === 100 ? "완료됨" : proj.status }
          : proj
      )
    );
    updateProject(project_id, {
      progress: value,
      status: value === 100 ? "완료됨" : undefined,
    });
  };

  const handleStatusChange = (project_id, status) => {
    setProjects((prev) =>
      prev.map((proj) =>
        proj.project_id === project_id ? { ...proj, status } : proj
      )
    );
    updateProject(project_id, { status });
  };


  const statusColor = (status) => {
    if (status === "완료됨") return "success";
    if (status === "진행 중") return "primary";
    if (status === "검토 중") return "warning";
    if (status === "승인 대기") return "default";
    return "default";
  };

  const urgencyColor = (urgency) => {
    if (urgency === "높음") return "error";
    if (urgency === "보통") return "warning";
    return "info";
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        📂 프로젝트 관리
      </Typography>

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
