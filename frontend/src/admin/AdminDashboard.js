import React, { useState, useEffect } from "react";
import { Box, Grid, Paper, Typography, List, ListItem, ListItemText, useTheme, useMediaQuery } from "@mui/material";
import GroupsIcon from "@mui/icons-material/Groups";
import WorkspacesIcon from "@mui/icons-material/Workspaces";
import { useNavigate } from "react-router-dom";
import axios from "../common/axiosInstance"
import AlertCard from "../components/AlertCard";
import { useAlert } from "../components/CommonAlert";
import Tooltip from "@mui/material/Tooltip";
import BeenhereIcon from '@mui/icons-material/Beenhere';

export default function AdminDashboard() {

  const [stats, setStats] = useState({
    user: 0,
    project: 0,
  });
  const categoryColors = {
    project: "#1976d2",   // 파랑 (예: 프로젝트 알림)
    ask: "#ff9800",   // 주황 (예: 문의사항 알림)
    commonChat: "#89d665",   // 주황 (예: 문의사항 알림)
    chat: "#9065d6ff",
    default: "#9e9e9e",   // 회색 (기본)
  };
  const navigate = useNavigate();
  const BASE_URL = process.env.REACT_APP_API_URL;
  const [alerts, setAlerts] = useState([]);
  const { showAlert } = useAlert();

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

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
      try {
        const token = sessionStorage.getItem("token");
        const res = await axios.get(`${BASE_URL}/common/alerts`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setAlerts(res.data);
      } catch (error) {
        if (error.response?.status !== 401) {
          console.error("알림 목록 불러오기 실패", error);
        }
      }
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
    <Box sx={{ p: 2, pt: 3 }}>
      <Box sx={{ display: "flex", alignItems: "center" }}>
        <Tooltip
          title={
            <Typography sx={{ fontSize: 13, color: "#fff" }}>
              관리자만 접근 가능한 대시보드입니다.<br/>
              회원 수와 프로젝트 수, 알림 등을 한눈에 <br/>확인할 수 있어요!
            </Typography>
          }
          placement="right"
          arrow
        >
          <Box sx={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
            <BeenhereIcon color='primary' sx={{ fontSize: "40px", mr: "4px" }} />
            <Typography
              variant="h4"
              fontWeight="bold"
              gutterBottom
              sx={{ mb: 0, cursor: "help", }}
            >
              관리자 대시보드
            </Typography>
          </Box>
        </Tooltip>
      </Box>

      <Grid container spacing={3} mt={1}>
        {cards.map((card, idx) => (
          <Grid item xs={12} sm={6} md={3} key={idx}>
            <Paper sx={{ py: 8, borderRadius: 2, textAlign: "center", boxShadow: 2, minWidth: isMobile?'375px':'470px' }}>
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
            onClose={() => handleCloseshowAlert(alert.alert_id)}
            color={color}
          />
        )
      })}
    </Box>
  );
}
