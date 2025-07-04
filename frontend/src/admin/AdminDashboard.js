import React, { useState, useEffect } from "react";
import { Box, Grid, Paper, Typography, List, ListItem, ListItemText } from "@mui/material";
import GroupsIcon from "@mui/icons-material/Groups";
import WorkspacesIcon from "@mui/icons-material/Workspaces";
import PaidIcon from "@mui/icons-material/Paid";
import ReportProblemIcon from "@mui/icons-material/ReportProblem";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    user: 0,
    project: 0,
  });
  const navigate = useNavigate();
  const BASE_URL = "http://127.0.0.1:8000";

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(`${BASE_URL}/admin/stats`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setStats(response.data);
      } catch (error) {
        console.error("대시보드 통계 불러오기 실패", error);
      }
    };

    fetchStats();
  }, []);

  const cards = [
    {
      icon: <GroupsIcon sx={{ fontSize: 40, color: "#1976d2" }} />,
      title: "회원 수",
      count: `${stats.user} 명`,
    },
    {
      icon: <WorkspacesIcon sx={{ fontSize: 40, color: "#43a047" }} />,
      title: "프로젝트 수",
      count: `${stats.project} 건`,
    },
   

  ];

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        🛡️ 관리자 대시보드
      </Typography>

      <Grid container spacing={2} mt={1}>
        {cards.map((card, idx) => (
          <Grid item xs={12} sm={6} md={3} key={idx}>
            <Paper sx={{ p: 10, px:24, borderRadius: 2, textAlign: "center", boxShadow: 2 }}>
              {card.icon}
              <Typography variant="subtitle1" fontWeight={600} mt={1}>
                {card.title}
              </Typography>
              <Typography variant="h6" fontWeight="bold" mt={1}>
                {card.count}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Paper sx={{ mt: 4, p: 2, backgroundColor: "#f5f5f5", borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom>
          🔔 시스템 알림
        </Typography>
        <List>
          <ListItem>
            <ListItemText
              primary="프로젝트 승인 대기"
              secondary={`클라이언트가 신청한 승인 대기 프로젝트 ${stats.pendingProjects || 0} 건이 있습니다.`}
            />
          </ListItem>
        </List>
      </Paper>
    </Box>
  );
}
