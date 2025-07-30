import React, { useState, useEffect, Component } from "react";
import { Box, Typography, List, ListItem, ListItemText, Stack } from "@mui/material";
import { useNavigate } from "react-router-dom";
import axios from "../common/axiosInstance"
import DevIcon from "../assets/dev-icon.png";
import AlertCard from "../components/AlertCard";
import Tooltip from "@mui/material/Tooltip";
import BeenhereIcon from '@mui/icons-material/Beenhere';
import HelpIcon from '@mui/icons-material/Help';


export default function MemberDashboard() {

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

  useEffect(() => {
    const fetchAlerts = async () => {
      const token = sessionStorage.getItem("token"); // 또는 sessionStorage.getItem()
      const res = await axios.get(`${BASE_URL}/common/alerts`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAlerts(res.data);
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

  return (
    <Box sx={{ p: 2, pt: 3 }}>

      <Stack sx={{ display: 'flex', flexDirection: 'row' }}>
        <Typography
          variant="h4"
          fontWeight="bold"
          gutterBottom
          sx={{ mb: 0}}
        >
          개발자 대시보드
        </Typography>
        <Tooltip
          title={
            <Typography sx={{ fontSize: 13, color: "#fff" }}>
              각종 알림을 확인할 수 있는 페이지입니다.
            </Typography>
          }
          placement="right"
          arrow
        >
          <HelpIcon sx={{color:'gray', fontSize: 22, mt: "2px", mr: "4px" }} />
        </Tooltip>
      </Stack>


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

      <ListItem>
      </ListItem>
    </Box>
  );
}
