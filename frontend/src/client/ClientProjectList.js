/**
 * 파일명: ClientProjectList.js
 * 설명: 클라이언트(고객)의 프로젝트 목록을 조회하여 카드 형식으로 표시하는 페이지.
 * 주요 기능:
 *   - /client/list 경로로 로그인된 사용자의 프로젝트 목록을 조회
 *   - 각 프로젝트의 긴급도, 상태, 카테고리, 예산, 기간, 설명 등 출력
 *   - 상태/긴급도 별로 Chip 컬러 매핑, 진행률은 LinearProgress로 시각화
 * 비고:
 *   - 긴급도(U01~U03), 상태(W01~W03)에 따른 색상표 설정 포함
 */

import React, { useState, useEffect } from "react";
import { Box, Typography, Paper, Grid, Button, LinearProgress, Chip } from "@mui/material";
import axios from "../common/axiosInstance"
import Folder from "../assets/folder.png"
import { useAlert } from "../components/CommonAlert";

const ClientProjectList = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const BASE_URL = process.env.REACT_APP_API_URL;
  const { showAlert } = useAlert();
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const token = sessionStorage.getItem("token");  // 토큰 가져오기
        if (!token) {
          showAlert("로그인 후 사용 가능합니다.");
          return;
        }

        const response = await axios.post(
          `${BASE_URL}/client/list`,  // 프로젝트 목록 요청
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setProjects(response.data.projects);  // 프로젝트 목록 설정
        setLoading(false);
      } catch (error) {
        console.error("프로젝트 목록을 가져오는 데 실패했습니다.", error);
        setLoading(false);
        showAlert("프로젝트 목록을 가져오는 데 실패했습니다.");
      }
    };

    fetchProjects();
  }, []);

  const urgencyMap = {
    U01: { label: "여유", color: "#46D828" },
    U02: { label: "보통", color: "#FFBD52" },
    U03: { label: "높음", color: "#E53434" },
  };

  const statusMap = {
    W01: { label: "대기중", color: "#90CAF9" },
    W02: { label: "진행중", color: "#81C784" },
    W03: { label: "완료", color: "#A1887F" },
  };

  if (loading) {
    return <Typography variant="h6">로딩 중...</Typography>
  }

  return (
    <Box sx={{ display: "block", justifyContent: "center", py: 4 }}>
      <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
        <img src={Folder} alt="" style={{ height: "35px" }} />
        <Typography variant="h4" fontWeight="bold" gutterBottom>프로젝트 목록</Typography>
      </Box>
      <Box sx={{ justifyContent: 'center', alignItems: 'center' }}>
        <Grid container spacing={5} sx={{}} >
          {projects.map((project) => (
            <Grid item xs={12} sm={6} md={4} key={project.id} sx={{ width: '410px' }}>
              <Paper elevation={2} sx={{ px: 3, py: 4 }}>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                    <Chip
                      label={`긴급도: ${urgencyMap[project.urgency]?.label || "없음"}`}
                      sx={{
                        backgroundColor: urgencyMap[project.urgency]?.color || "#ccc",
                        color: "#fff",
                        fontWeight: "bold",
                        height: 24
                      }}
                      size="small"
                    />
                    <Typography color="text.secondary">작성일: {project.create_date}</Typography>
                  </Box>
                  <Typography sx={{ fontSize: "20px", fontWeight: "600" }}>{project.title}</Typography>
                  <Typography ><strong>카테고리:</strong> {project.category_name}</Typography>
                  <Typography ><strong>예상 기간:</strong> {project.estimated_duration}일</Typography>
                  <Typography ><strong>예산:</strong> {project.budget.toLocaleString()}원</Typography>
                  <Typography ><strong>요구사항</strong></Typography>
                  <Box sx={{border:"1px solid grey", borderRadius:"5px", height:"100px", padding:"5px"}}>
                    <Typography >{project.description}</Typography>
                  </Box>
                  <Box sx={{ display: "flex"}}>
                    <Typography><strong>진행상황</strong></Typography>
                    <Chip
                      label={statusMap[project.status]?.label || "대기중"}
                      sx={{
                        backgroundColor: statusMap[project.status]?.color || "#ddd",
                        color: "#fff",
                        fontWeight: "bold",
                        height: 24,
                        marginLeft:"10px"
                      }}
                      size="small"
                    />
                  </Box>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={project.progress || 0}  // progress가 없으면 0으로 처리
                  sx={{ mt: 2, mb: 1 }}
                />
                <Typography color="text.secondary">{project.progress || 0}%</Typography>


              </Paper>
            </Grid>

          ))}
        </Grid>
      </Box>
    </Box>
  );
};

export default ClientProjectList;
