import React, { useState, useEffect } from "react";
import { Box, Grid, Paper, Typography, List, ListItem, ListItemText } from "@mui/material";
import GroupsIcon from "@mui/icons-material/Groups";
import WorkspacesIcon from "@mui/icons-material/Workspaces";
import { useNavigate } from "react-router-dom";
import axios from "../common/axiosInstance"
import AlertCard from "../components/AlertCard";

export default function AdminDashboard() {
  
  const [stats, setStats] = useState({
    user: 0,
    project: 0,
  });
  const categoryColors = {
    project: "#1976d2",   // 파랑 
    ask: "#ff9800",   // 주황
    chat: "#ff9800",   // 주황
    default: "#9e9e9e",   // 회색 (기본)
  };
  const navigate = useNavigate();
  const BASE_URL = process.env.REACT_APP_API_URL;
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = sessionStorage.getItem("token");
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

  useEffect(() => {
    const fetchAlerts = async () => {
      const token = sessionStorage.getItem("token"); // 또는 sessionStorage.getItem()
      const res = await axios.get(`${BASE_URL}/common/alerts`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAlerts(res.data);
      console.log("alerts :", res.data);
    };
    fetchAlerts();
  }, []);

  const handleCloseAlert = async (alertId) => {
    try {
      const token = sessionStorage.getItem("token");
      await axios.put(`${BASE_URL}/common/alerts/${alertId}/delete`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAlerts((prev) => prev.filter((a) => a.alert_id !== alertId)); // 상태에서 제거
    } catch (error) {
      console.error("알림 삭제 실패", error);
    }
  };

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
            <Paper sx={{ p: 10, px: 24, borderRadius: 2, textAlign: "center", boxShadow: 2 }}>
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
      {alerts.map((alert) => {
        const color = categoryColors[alert.category] || categoryColors.default;

        return (
        <AlertCard
          key={alert.alert_id}
          title={alert.title}
          description={alert.message}
          confirmText="바로가기"
          onConfirm={() => window.location.href = alert.link}
          onClose={() => handleCloseAlert(alert.alert_id)}
          color={color}
        />
        )
      })}
    </Box>
  );
}
