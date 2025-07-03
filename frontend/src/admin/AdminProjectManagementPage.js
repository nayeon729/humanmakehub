import React, { useState, useEffect } from "react";
import {
  Box, Typography, Paper, LinearProgress, Select, MenuItem,
  Slider, Grid, Chip, Stack, Button
} from "@mui/material";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function AdminProjectManagementPage() {
  const [projects, setProjects] = useState([]);
  const [pms, setPms] = useState([]);
  const BASE_URL = "http://127.0.0.1:8000";
  const navigate = useNavigate();

  useEffect(() => {
    fetchProjects();
    fetchPMs();
  }, []);

  const fetchPMs = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${BASE_URL}/admin/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPms(res.data.filter((user) => user.role === "pm") || []);
    } catch (error) {
      console.error("PM 목록 불러오기 실패", error);
      setPms([]);
    }
  };

  const fetchProjects = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/projects`);
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

  const updateProject = async (id, updatedFields) => {
    try {
      await axios.put(`${BASE_URL}/projects/${id}`, updatedFields);
    } catch (error) {
      console.error("프로젝트 업데이트 실패", error);
    }
  };

  const handleProgressChange = (id, value) => {
    setProjects((prev) =>
      prev.map((proj) =>
        proj.id === id
          ? { ...proj, progress: value, status: value === 100 ? "완료됨" : proj.status }
          : proj
      )
    );
    updateProject(id, {
      progress: value,
      status: value === 100 ? "완료됨" : undefined,
    });
  };

  const handleStatusChange = (id, status) => {
    setProjects((prev) =>
      prev.map((proj) =>
        proj.id === id ? { ...proj, status } : proj
      )
    );
    updateProject(id, { status });
  };

  const handleAssignPM = async (projectId, pmName) => {
    try {
      const current = projects.find(p => p.id === projectId);
      const newStatus = current.status === "승인 대기" ? "검토 중" : current.status;
      setProjects((prev) =>
        prev.map((proj) =>
          proj.id === projectId
            ? { ...proj, pm: pmName, status: newStatus }
            : proj
        )
      );
      await axios.put(`${BASE_URL}/projects/${projectId}`, {
        pm: pmName,
        status: newStatus
      });
    } catch (error) {
      console.error("PM 지정 실패", error);
    }
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

      <Grid container spacing={3} sx={{ mt: 1 }}>
        {projects.map((proj) => {
          const isLocked = proj.status === "완료됨";
          const formattedDate = new Date(proj.created_at).toLocaleDateString("ko-KR");

          return (
            <Grid item xs={12} sm={6} md={4} key={proj.id}>
              <Paper
                sx={{
                  p: 3,
                  borderRadius: 3,
                  boxShadow: 3,
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between"
                }}
              >
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                  <Chip label={`긴급도: ${proj.urgency}`} color={urgencyColor(proj.urgency)} size="small" />
                  <Typography variant="caption" color="text.secondary">
                    접수일: {formattedDate}
                  </Typography>
                </Stack>

                <Box sx={{ mb: 1 }}>
                  <Typography variant="h6" fontWeight="bold" noWrap>{proj.title}</Typography>
                  <Typography variant="body2" color="text.secondary">클라이언트: {proj.client}</Typography>
                  <Typography variant="body2" color="text.secondary">프로젝트 ID: {proj.id}</Typography>
                </Box>

                <Box sx={{ mt: 1 }}>
                  <Typography variant="body2">카테고리: {proj.category}</Typography>
                  <Typography variant="body2">예상 기간: {proj.estimated_duration}일</Typography>
                  <Typography variant="body2">예산: {proj.budget}원</Typography>
                </Box>

                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" fontWeight="bold" gutterBottom>📌 PM 지정</Typography>
                  <Select
                    fullWidth
                    size="small"
                    value={proj.pm || ""}
                    onChange={(e) => handleAssignPM(proj.id, e.target.value)}
                    disabled={isLocked}
                  >
                    <MenuItem value="">PM 미지정</MenuItem>
                    {pms.map((pm) => (
                      <MenuItem key={pm.id} value={pm.username}>{pm.username}</MenuItem>
                    ))}
                  </Select>
                </Box>

                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" fontWeight="bold" gutterBottom>📊 진행률</Typography>
                  <LinearProgress variant="determinate" value={proj.progress} sx={{ height: 8, borderRadius: 5 }} />
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Typography variant="caption" color="text.secondary">{proj.progress}%</Typography>
                    <Slider
                      value={proj.progress}
                      onChange={(e, newVal) => handleProgressChange(proj.id, newVal)}
                      min={0}
                      max={100}
                      size="small"
                      valueLabelDisplay="auto"
                      disabled={isLocked}
                      sx={{ width: "75%" }}
                    />
                  </Box>
                </Box>

                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" fontWeight="bold" gutterBottom>📋 상태</Typography>
                  <Select
                    fullWidth
                    size="small"
                    value={proj.status}
                    onChange={(e) => handleStatusChange(proj.id, e.target.value)}
                    disabled={isLocked}
                  >
                    <MenuItem value="승인 대기">승인 대기</MenuItem>
                    <MenuItem value="검토 중">검토 중</MenuItem>
                    <MenuItem value="진행 중">진행 중</MenuItem>
                    <MenuItem value="완료됨">완료됨</MenuItem>
                  </Select>
                  <Box mt={1}>
                    <Chip label={proj.status} color={statusColor(proj.status)} size="small" />
                  </Box>
                </Box>

                <Button
                  variant="contained"
                  color="primary"
                  fullWidth
                  sx={{ mt: 2 }}
                  onClick={() => navigate(`/admin/project/${proj.id}`)}
                >
                  관리
                </Button>
              </Paper>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
}
