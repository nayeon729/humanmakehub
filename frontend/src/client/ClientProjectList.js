import React, { useState, useEffect } from "react";
import { Box, Typography, Paper, Grid, Button, LinearProgress } from "@mui/material";
import axios from "axios";

const ClientProjectList = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const token = localStorage.getItem("token");  // 토큰 가져오기
        if (!token) {
          alert("로그인 후 사용 가능합니다.");
          return;
        }

        const response = await axios.post(
          "http://127.0.0.1:8000/client/list",  // 프로젝트 목록 요청
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
        alert("프로젝트 목록을 가져오는 데 실패했습니다.");
      }
    };

    fetchProjects();
  }, []);

  if (loading) {
    return <Typography variant="h6">로딩 중...</Typography>;
  }

  return (
    <Box sx={{ display: "block", justifyContent: "center", py: 4 }}>
      <Typography variant="h5" mb={4}>프로젝트 목록</Typography>
    <Box sx={{justifyContent: 'center', alignItems: 'center' }}>
      <Grid container spacing={5} sx={{ }} >
        {projects.map((project) => (
          <Grid item xs={12} sm={6} md={4} key={project.id} sx={{width:'300px'}}>
            <Paper sx={{ padding: 3 }}>
              <Typography variant="body2" color="text.secondary">긴급도: {project.urgency_level}</Typography>
              <Typography variant="body2" color="text.secondary">작성일: {project.create_date}</Typography>  
              <Typography variant="h6">{project.title}</Typography>
              <Typography variant="body1" color="text.secondary">카테고리: {project.category_name}</Typography>
              <Typography variant="body2" color="text.secondary">예상 기간: {project.estimated_duration}일</Typography>
              <Typography variant="body2" color="text.secondary">예산: {project.budget}원</Typography>
              <Typography variant="h6">진행상황</Typography>
              <LinearProgress
                variant="determinate"
                value={project.progress || 0}  // progress가 없으면 0으로 처리
                sx={{ mt: 2 }}
              />

            </Paper>
          </Grid>
          
        ))}
      </Grid>
      </Box>
    </Box>
  );
};

export default ClientProjectList;
