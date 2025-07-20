import React, { useState, useEffect } from "react";
import {
  Box, Typography, Paper, Grid, Chip, Stack, Button, IconButton, Dialog, DialogTitle,
  DialogContent, DialogContentText, DialogActions, Tabs, Tab, Pagination
} from "@mui/material";
import axios from "../common/axiosInstance"
import { useNavigate } from "react-router-dom";
import AddIcon from '@mui/icons-material/Add';
import pjadd from '../icon/pjadd.png';
import folder from'../icon/folder.png';
import { useAlert } from "../components/CommonAlert";
import Tooltip from "@mui/material/Tooltip";
import FolderIcon from '@mui/icons-material/Folder';

export default function AdminProjectManagementPage() {
  const [projects, setProjects] = useState([]);
  const [pmDialogOpen, setPmDialogOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const BASE_URL = process.env.REACT_APP_API_URL;
  const navigate = useNavigate();
  const { showAlert } = useAlert();
  const [role, setRole] = useState("");
  const [tab, setTab] = useState("all");
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;

  useEffect(() => {
    const role = sessionStorage.getItem("role");
    setRole(role);
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const token = sessionStorage.getItem("token");
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
      const token = sessionStorage.getItem("token");
      await axios.put(`${BASE_URL}/admin/projects/assign-pm`, {
        project_id: project_id
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      // 다시 프로젝트 불러오기 (리렌더링)
      fetchProjects();
      showAlert('해당 프로젝트의 PM이 되었습니다.');
    } catch (error) {
      console.error("PM 지정 실패", error);
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
  const statusLabel = {
    null : "PM 미지정",
    "검토 중" : "검토 중",
    W01: "대기중",
    W02: "진행중",
    W03: "완료",
    W04: "기존PM해지 새PM임명중",
  };

  const urgencyColor = (urgency) => {
    if (urgency === "U01") return "#46D828";
    if (urgency === "U02") return "#FFBD52";
    if (urgency === "U03") return "#E53434";
    return "default";
  };


  const visibleProjects = (
    tab === "all"
      ? projects
      : tab === "W00"
        ? projects.filter(
            (proj) => proj.status === "W00" || proj.status === null || proj.status === "W04"
          )
        : projects.filter(
            (proj) => proj.status === tab
          )
  );

  const paginatedProjects = visibleProjects.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const totalPages = Math.ceil(visibleProjects.length / itemsPerPage);

  return (
    <>
      <Box sx={{ p: 2, pt:3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
          <Tooltip
                    title={
                      <Typography sx={{ fontSize: 16, color: "#fff" }}>
                        This little budf is <b>really cute</b> 🐤
                      </Typography>
                    }
                    placement="right"
                    arrow
                  >
          <Stack direction="row" alignItems="center" justifyContent='center' spacing={1}>
            <FolderIcon sx={{ fontSize: 40, mr: "4px"  }} />
            <Typography 
            variant="h4"
              fontWeight="bold"
              gutterBottom
              sx={{ mb: 0, cursor: "help", }}> 전체 프로젝트</Typography>
          </Stack>
          </Tooltip>
          <IconButton onClick={() => navigate("/admin/create")}>
            <img src={pjadd} alt="추가" style={{ width: 35, height: 30}} />
          </IconButton>
        </Stack>
        <Tabs value={tab} onChange={(e, newVal) => setTab(newVal)} sx={{ mb: 2 }}>
          <Tab label="전체" value="all" />
          <Tab label="PM미지정" value="W00" />
          <Tab label="검토 중" value="검토 중" />
          <Tab label="대기중" value="W01" />
          <Tab label="진행중" value="W02" />
          <Tab label="완료" value="W03" />
        </Tabs>

        <Grid container spacing={3}>
          {paginatedProjects.map((proj) => {
            const dateObj = new Date(proj.create_dt);
            const formattedDate = `${dateObj.getFullYear()}.${(dateObj.getMonth() + 1)
              .toString()
              .padStart(2, "0")}.${dateObj.getDate().toString().padStart(2, "0")}`;
            const isManaged = proj.pm_id && proj.pm_id !== null && proj.pm_id !== "미지정";
            return (
              <Grid item xs={12} sm={6} md={4} key={proj.project_id}>
                <Paper elevation={3} sx={{ p: 3, borderRadius: 2, width: 400}}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                    <Chip label={urgencyMap[proj.urgency] || "없음"} sx={{backgroundColor:urgencyColor(proj.urgency), color:'white'}} size="small" />
                    <Typography variant="caption" color="text.secondary">
                      진행도 : {statusLabel[proj.status] || "알 수 없음"}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      접수일: {formattedDate}
                    </Typography>
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
                    <strong>Phone:</strong> {proj.client_phone}
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    <strong>예상 기간:</strong> {proj.estimated_duration}일
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    <strong>예상 예산:</strong> {proj.budget.toLocaleString()}원
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    <strong>요구사항:</strong> <br />
                    </Typography>
                    <Box sx={{ overflowX: 'hidden', overflowY: 'auto', whiteSpace: 'pre-wrap', border: '1px solid #D9D9D9', borderRadius: '5px', p: 1, width: '380px', height: '100px' }}>
                      {proj.description}
                    </Box>
                  <Stack
                    direction="row"
                    justifyContent={role === "R04" ? "space-between" : "center"}
                    alignItems="center"
                    spacing={2}
                    mb={1}
                    mt={2}
                  >
                    {role === "R04" ? (
                      <>
                        <Button
                          variant="contained"
                          sx={{
                            borderRadius: "20px",
                            height: "45px",
                            width: "250px",
                            fontSize: "16px",
                          }}
                          onClick={() => {
                            setSelectedProjectId(proj.project_id);
                            setPmDialogOpen(true);
                          }}
                          disabled={isManaged}
                        >
                          {isManaged ? `관리자(PM) : ${proj.pm_id}` : "관리하기"}
                        </Button>

                        <Button
                          variant="contained"
                          sx={{
                            borderRadius: "20px",
                            height: "45px",
                            width: "250px",
                            fontSize: "16px",
                          }}
                          onClick={() => navigate(`/admin/channel/${proj.project_id}/common`)}
                          disabled={!isManaged}
                        >
                          프로젝트채널
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant="contained"
                        sx={{
                          borderRadius: "20px",
                          height: "45px",
                          width: "250px",
                          fontSize: "16px",
                        }}
                        onClick={() => {
                          setSelectedProjectId(proj.project_id);
                          setPmDialogOpen(true);
                        }}
                        disabled={isManaged}
                      >
                        {isManaged ? `관리자(PM) : ${proj.pm_id}` : "관리하기"}
                      </Button>
                    )}
                  </Stack>
                </Paper>
              </Grid>
            );
          })}
        </Grid>
      </Box>
      {/* Pagination */}
      <Box mt={2} display="flex" justifyContent="center">
        <Pagination
          count={totalPages}
          page={currentPage}
          onChange={(e, value) => setCurrentPage(value)}
          shape="rounded"        // ● 동그란 스타일
          color="primary"        // ● 파란색 강조
          siblingCount={1}       // ● 현재 페이지 주변 1개씩
          boundaryCount={1}      // ● 양 끝 페이지 1개씩
        />
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
