import React, { useState, useEffect } from "react";
import {
  Box, Typography, Paper, LinearProgress, Select, MenuItem,
  Slider, Grid, Chip, Stack, Button
} from "@mui/material";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Combo from "../components/Combo";


// 🔄 생략된 import 및 useState 등은 그대로 유지

export default function MemberProjectList() {
  const [projects, setProjects] = useState([]);
  const [progressMap, setProgressMap] = useState({});
  const BASE_URL = "http://127.0.0.1:8000";
  const navigate = useNavigate();

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${BASE_URL}/member/my-projects`, {
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
      console.error("❌ 프로젝트 불러오기 실패", error);
    }
  };

  const urgencyMap = {
    U01: "긴급도: 여유",
    U02: "긴급도: 보통",
    U03: "긴급도: 높음",
  };
  const urgencyColor = (urgency) => {
    if (urgency === "U01") return "success";
    if (urgency === "U02") return "warning";
    if (urgency === "U03") return "error";
    return "default";
  };

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" fontWeight="bold" mb={4}>
        📂 프로젝트 목록
      </Typography>

      <Grid container spacing={3}>
        {projects.map((proj) => {
          const formattedDate = new Date(proj.create_dt).toLocaleDateString("ko-KR");

          return (
            <Grid item xs={12} sm={6} md={4} key={proj.project_id}>
              <Paper elevation={4} sx={{ p: 3, borderRadius: 2 }}>
                {/* 상단: 긴급도 + 날짜 */}
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                  <Chip label={urgencyMap[proj.urgency] || "없음"} color={urgencyColor(proj.urgency)} />
                  <Typography variant="caption" color="text.secondary">
                    접수일: {formattedDate}
                  </Typography>
                </Stack>

                {/* 프로젝트 제목 */}
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  {proj.title}
                </Typography>

                {/* 상세 정보 */}
                <Typography variant="body2">카테고리: {proj.category || "웹개발"}</Typography>
                <Typography variant="body2">예상 기간: {proj.estimated_duration}일</Typography>
                <Typography variant="body2" gutterBottom>
                  예상 예산: {proj.budget.toLocaleString()}원
                </Typography>

                {/* 요구사항 */}
                <Typography variant="body2" gutterBottom>
                  <strong>요구사항</strong><br />
                  {proj.description}
                </Typography>

                {/* 진행 상태 */}
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" fontWeight="bold" mb={1}>
                    진행 상황 <Chip label="진행 중" color="primary" size="small" />
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={proj.progress}
                    sx={{
                      height: 10,
                      borderRadius: 5,
                      mb: 1,
                      backgroundColor: "#e0e0e0",
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: "#1976d2"
                      },
                    }}
                  />
                  <Typography fontSize={14}>{proj.progress}%</Typography>
                </Box>

                {/* 프로젝트 채널 버튼 */}
                <Button
                  variant="contained"
                  fullWidth
                  sx={{ mt: 3, fontWeight: "bold", fontSize: "16px", py: 1.5 }}
                  onClick={() => navigate(`/member/project/${proj.project_id}`)}
                >
                  📘 프로젝트 채널
                </Button>
              </Paper>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
}
