import React, { useState, useEffect } from "react";
import {
  Box, Typography, Paper, Grid, Chip, Stack, Button, IconButton,Dialog, DialogTitle,
  DialogContent, DialogContentText, DialogActions
} from "@mui/material";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import AddIcon from '@mui/icons-material/Add';

export default function AdminProjectManagementPage() {
  const [projects, setProjects] = useState([]);
  const [pmDialogOpen, setPmDialogOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
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
        urgency: proj.urgency 
      }));
      setProjects(cleanedProjects);
    } catch (error) {
      console.error("프로젝트 불러오기 실패", error);
    }
  };

  const handleAssignPM = async (project_id) => {
  try {
    const token = localStorage.getItem("token");
    await axios.put(`${BASE_URL}/admin/projects/assign-pm`, {
      project_id: project_id
    }, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    // 다시 프로젝트 불러오기 (리렌더링)
    fetchProjects();
    alert('해당 프로젝트의 PM이 되었습니다.');
  } catch (error) {
    console.error("PM 지정 실패", error);
  }
};

  const urgencyMap={
    U01:"긴급도: 여유",
    U02:"긴급도: 보통",
    U03:"긴급도: 높음",
  }
  const urgencyColor = (urgency) => {
    if (urgency === "U01") return "success";
    if (urgency === "U02") return "primary";
    if (urgency === "U03") return "warning";
    return "default";
  };
 
  return (
    <>
    <Box sx={{ p: 2 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Typography variant="h4" fontWeight="bold">📁 전체 프로젝트</Typography>
        </Stack>
        <IconButton color="primary" size="large">
          <AddIcon />
        </IconButton>
      </Stack>

      <Grid container spacing={3}>
        {projects.map((proj) => {
          const formattedDate = new Date(proj.create_dt).toLocaleDateString("ko-KR");
          const isManaged = proj.pm_id && proj.pm_id !== null && proj.pm_id !== "미지정";
          return (
            <Grid item xs={12} sm={6} md={4} key={proj.project_id}>
              <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                  <Chip label={urgencyMap[proj.urgency] || "없음"} color={urgencyColor(proj.urgency)} size="small" />
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
                  onClick={() => {
                    setSelectedProjectId(proj.project_id);
                    setPmDialogOpen(true);
                  }}
                  disabled={isManaged}
                >
                  {isManaged ? "관리 중" : "관리하기"}
                </Button>
              </Paper>
            </Grid>
          );
        })}
      </Grid>
    </Box>
    <Dialog open={pmDialogOpen} onClose={() => setPmDialogOpen(false)}>
            <DialogTitle>pm 지정 확인</DialogTitle>
            <DialogContent>
              <DialogContentText>
                이  프로젝트를 관리하시겠습니까?
              </DialogContentText>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setPmDialogOpen(false)}>취소</Button>
              <Button onClick={() => {
                    handleAssignPM(selectedProjectId);
                    setPmDialogOpen(false);
                  }} color="primary" variant="contained">
                확인
              </Button>
            </DialogActions>
          </Dialog>
</>    
  );
}
