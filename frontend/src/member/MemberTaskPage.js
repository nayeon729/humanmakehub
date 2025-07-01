import React, { useState, useEffect } from "react";
import { Box, Typography, Paper, Stack, Button, Grid } from "@mui/material";
import { useNavigate } from "react-router-dom"; // ✅ 추가
import axios from "axios";

export default function MemberDashboard() {
  const [tasks, setTasks] = useState([]);
  const [requests, setRequests] = useState([]);
  const navigate = useNavigate(); // ✅ 추가
  const BASE_URL = "http://localhost:8000";

  useEffect(() => {
    fetchTasks();
    fetchJoinRequests();
  }, []);

  const fetchTasks = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/tasks/mine`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setTasks(res.data);
    } catch (error) {
      console.error("내 작업 목록 불러오기 실패", error);
    }
  };

  const fetchJoinRequests = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/join_requests/mine`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setRequests(res.data);
    } catch (error) {
      console.error("참여 요청 불러오기 실패", error);
    }
  };

  const handleJoinRequest = async (requestId, action) => {
    try {
      await axios.put(`${BASE_URL}/join_requests/${requestId}/${action}`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      alert(`요청이 ${action === 'accept' ? '수락' : '거절'}되었습니다.`);

      // ✅ 수락했으면 작업목록 다시 불러오기
      if (action === "accept") {
        await fetchTasks();
      }

      // ✅ 그리고 요청 목록도 다시 불러오기
      await fetchJoinRequests();
    } catch (error) {
      console.error("참여 요청 처리 실패", error);
    }
  };

  const handleTaskClick = (projectId) => {
    navigate(`/pm/project/${projectId}/tasks`); // ✅ 프로젝트 클릭 시 PM Task 관리 페이지로 이동
  };

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        팀원 대시보드
      </Typography>

      <Stack spacing={4}>
        {/* 내 작업 목록 */}
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            📋 내 작업 목록
          </Typography>
          {tasks.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              현재 할당된 작업이 없습니다.
            </Typography>
          ) : (
            <Stack spacing={1}>
              {tasks.map((task) => (
                <Box
                  key={task.id}
                  sx={{ cursor: "pointer" }}
                  onClick={() => handleTaskClick(task.project_id)} // ✅ 클릭 시 프로젝트로 이동
                >
                  <Typography variant="subtitle1">{task.title}</Typography>
                  <Typography variant="caption" color="text.secondary">{task.status}</Typography>
                </Box>
              ))}
            </Stack>
          )}
        </Paper>

        {/* 완료된 작업 통계 */}
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            📊 완료된 작업 통계
          </Typography>
          <Typography>완료한 작업 수: {tasks.filter(task => task.status === "완료").length}개</Typography>
        </Paper>

        {/* 프로젝트 참여 요청 */}
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            ✉️ 프로젝트 참여 요청
          </Typography>
          {requests.filter(req => req.status === "대기 중").length === 0 ? (  // ✅ 여기 수정
            <Typography variant="body2" color="text.secondary">
              대기 중인 참여 요청이 없습니다.
            </Typography>
          ) : (
            <Grid container spacing={2}>
              {requests.filter(req => req.status === "대기 중").map((req) => ( // ✅ 여기 수정
                <Grid item xs={12} sm={6} md={4} key={req.id}>
                  <Paper sx={{ p: 2, display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                    <Typography variant="subtitle1" fontWeight="bold">
                      {req.project_title}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ mb: 1 }}>
                      요청 상태: {req.status}
                    </Typography>

                    <Stack direction="row" spacing={1}>
                      <Button
                        size="small"
                        variant="contained"
                        color="success"
                        onClick={() => handleJoinRequest(req.id, "accept")}
                      >
                        수락
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        onClick={() => handleJoinRequest(req.id, "reject")}
                      >
                        거절
                      </Button>
                    </Stack>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          )}
        </Paper>
      </Stack>
    </Box>
  );
}
