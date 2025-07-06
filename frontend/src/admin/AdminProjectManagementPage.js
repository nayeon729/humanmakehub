import React, { useState, useEffect } from "react";
import {
  Box, Typography, Paper, LinearProgress, Select, MenuItem,
  Slider, Grid, Chip, Stack, Button,Dialog, DialogTitle,
    DialogContent, DialogContentText, DialogActions,
} from "@mui/material";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Combo from "../components/Combo";


export default function AdminProjectManagementPage() {
  const [projects, setProjects] = useState([]);
  const [projectStatus, setProjectStatus] = useState("");
  const [progressMap, setProgressMap] = useState({});
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId]=useState({});
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
        urgency: proj.urgency,
        status: proj.status ?? 0,
        progress: proj.progress ?? 0
      }));
      setProjects(cleanedProjects);
    } catch (error) {
      console.error("프로젝트 불러오기 실패", error);
    }
  };


  const handleProgressChange = async (project_id, newProgress) => {
    const token = localStorage.getItem("token");
    const proj = projects.find(p => p.project_id === project_id);
    if (!proj || proj.progress === newProgress) return;
    if (!token) {
      alert("로그인 세션이 만료되었습니다. 다시 로그인해주세요.");
      return;
    }
    if (!newProgress) {
      alert("새 상태가 유효하지 않습니다.");
      return;
    }
    try {
      await axios.put(
        `${BASE_URL}/admin/projects/${project_id}`,
        { progress: newProgress },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        }
      );
      setProjects((prevProjects) =>
        prevProjects.map((project) =>
          project.project_id === project_id ? { ...project, progress: newProgress } : project
        )
      );
      alert("✅ 진행률이 성공적으로 수정되었습니다.");
    } catch (error) {
      console.error("❌ 진행률 수정 실패", error);
      const errorMsg = error.response?.data?.detail || "알 수 없는 서버 오류입니다.";
      alert("❌ 진행률 수정 실패: " + errorMsg);
    }
  };

  const handleStatusChange = async (project_id, newStatus) => {
    const token = localStorage.getItem("token");
    const proj = projects.find(p => p.project_id === project_id);
    if (!proj || proj.status === newStatus) return;
    if (!token) {
      alert("로그인 세션이 만료되었습니다. 다시 로그인해주세요.");
      return;
    }
    if (!newStatus) {
      alert("새 상태가 유효하지 않습니다.");
      return;
    }
    try {
      await axios.put(
        `${BASE_URL}/admin/projects/${project_id}`,
        { status: newStatus },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        }
      );
      setProjects((prevProjects) =>
        prevProjects.map((project) =>
          project.project_id === project_id ? { ...project, status: newStatus } : project
        )
      );
      alert("✅ 상태이 성공적으로 수정되었습니다.");
    } catch (error) {
      console.error("❌ 상태 수정 실패", error);
      const errorMsg = error.response?.data?.detail || "알 수 없는 서버 오류입니다.";
      alert("❌ 상태 수정 실패: " + errorMsg);
    }
  };


  const handleDeleteProject = async(project_id) =>{
    try{
      const token= localStorage.getItem("token");
      await axios.delete(`${BASE_URL}/admin/projects/${project_id}/delete`,{
        headers:{Authorization: `Bearer ${token}`}
      });
      fetchProjects();
      setDeleteDialogOpen(false);
      alert("✅ 프로젝트가 삭제(표시)되었습니다.")
    } catch (error) {
      console.error("❌ 프로젝트 삭제 실패", error);
      alert("❌ 프로젝트 삭제에 실패했습니다.");
    }
  };

  const urgencyMap = {
    U01: "긴급도: 여유",
    U02: "긴급도: 보통",
    U03: "긴급도: 높음",
  }
  const categoryMap = {
    A01: "웹 개발",
    A02: "앱 개발 ",
    A03: "데이터 분석",
    A04: "AI 솔루션",
    A05: "전산 시스템 구축",
    A06: "쇼핑몰 구축",
    A07: "플랫폼 구축",
    A08: "기타"
  }
  const urgencyColor = (urgency) => {
    if (urgency === "U01") return "success";
    if (urgency === "U02") return "primary";
    if (urgency === "U03") return "warning";
    return "default";
  }

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
                <Box  mb={1}
                  sx={{display:"flex", flexDirection:"row", justifyContent:"space-between", alignItems:"center"}}>
                    <Box sx={{display:"flex", flex:'4'}}>
                  <Typography variant="caption" color="text.secondary" sx={{display:'flex'}}>
                    접수일: {formattedDate}
                  </Typography>
                  </Box>
                  <Box sx={{display:"flex",flex:'1', flexDirection:"row", marginLeft:"10px"}}>
                    <button 
                      style={{background:"none", width:'35px', border:'none', padding:'0px', color:'blue'}}
                      onClick={() => navigate(`/`)}
                    >
                      수정
                    </button>
                    <button 
                       style={{background:"none", width:'35px', border:'none', padding:'0px', color:'red'}}
                      onClick={() => handleDeleteProject(proj.project_id)}
                    >
                      삭제
                    </button>
                  </Box>
                </Box>
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                  <Chip label={urgencyMap[proj.urgency] || "없음"} color={urgencyColor(proj.urgency)} size="small" />

                </Stack>

                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  {proj.title}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>카테고리:</strong>  {categoryMap[proj.category] || "없음"}
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
                  <strong>요구사항:</strong> <br />
                  {proj.description}
                </Typography>

                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" fontWeight="bold" gutterBottom>
                    진행률
                  </Typography>

                  {/* 🔹 현재 진행률 표시용 Bar */}
                  <LinearProgress
                    variant="determinate"
                    value={proj.progress}
                    sx={{
                      height: 10,
                      borderRadius: 5,
                      mb: 1,
                      backgroundColor: "#e0e0e0",
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: "#42a5f5", // 파란색
                      },
                    }}
                  />
                  <Typography sx={{ fontSize: '14px' }}>{proj.progress}%</Typography>
                  <Slider
                    value={progressMap[proj.project_id] ?? proj.progress}
                    onChange={(e, newVal) => {
                      setProgressMap((prev) => ({
                        ...prev,
                        [proj.project_id]: newVal,
                      }));
                    }}
                    onChangeCommitted={(e, newVal) => {
                      handleProgressChange(proj.project_id, newVal);
                      setProgressMap((prev) => ({
                        ...prev,
                        [proj.project_id]: undefined,
                      }));
                    }}
                    step={5}
                    min={0}
                    max={100}
                    valueLabelDisplay="auto"
                    sx={{ mt: 1 }}
                  />
                </Box>
                <Box>
                  <Typography variant="body2">상태</Typography>
                  <Combo
                    groupId="PROJECT_STATUS"
                    defaultValue={proj.status}
                    onSelectionChange={(val) => handleStatusChange(proj.project_id, val)}
                    sx={{ minWidth: 50 }}
                  />
                </Box>
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" fontWeight="bold" gutterBottom>
                    멤버 리스트
                  </Typography>
                </Box>
                <Button
                  variant="contained"
                  fullWidth
                  sx={{ mt: 2 }}
                  onClick={() => navigate(`/admin/project/${proj.project_id}`)}
                >
                  프로젝트 채널
                </Button>
              </Paper>
            </Grid>
          );
        })}
      </Grid>
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
              <DialogTitle>프로젝트 삭제 확인</DialogTitle>
              <DialogContent>
                <DialogContentText>
                  정말로 이 프로젝트를 삭제하시겠습니까?
                </DialogContentText>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setDeleteDialogOpen(false)}>취소</Button>
                <Button onClick={handleDeleteProject} color="error" variant="contained">
                  삭제 확인
                </Button>
              </DialogActions>
            </Dialog>
    </Box>

    
  );
}
