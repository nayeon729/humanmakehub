import React, { useState, useEffect } from "react";
import { Box, Typography, List, ListItem, ListItemText, Stack } from "@mui/material";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import DevIcon from "../assets/dev-icon.png";
import AlertCard from "../components/AlertCard";

export default function MemberDashboard() {
  const [stats, setStats] = useState({
    user: 0,
    project: 0,
  });
  const navigate = useNavigate();
  const BASE_URL = "http://127.0.0.1:8000";
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    const fetchAlerts = async () => {
      const token = localStorage.getItem("token"); // 또는 sessionStorage.getItem()
      const res = await axios.get("http://127.0.0.1:8000/common/alerts", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAlerts(res.data);
    };
    fetchAlerts();
  }, []);

  const handleCloseAlert = async (alertId) => {
    try {
      const token = localStorage.getItem("token");
      await axios.put(`${BASE_URL}/common/alerts/${alertId}/delete`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAlerts((prev) => prev.filter((a) => a.alert_id !== alertId)); // 상태에서 제거
    } catch (error) {
      console.error("알림 삭제 실패", error);
    }
  };

  return (
    <Box sx={{ p: 2 }}>


      <Typography variant="h4" fontWeight="bold" gutterBottom>
        <img src={DevIcon} alt="개발자" width={40} height={40} style={{ verticalAlign: "middle", marginRight: 8 }} />
        개발자 대시보드
      </Typography>

      {alerts.map((alert) => (
        <AlertCard
          key={alert.alert_id}
          title={alert.title}
          description={alert.message}
          confirmText="바로가기"
          onConfirm={() => window.location.href = alert.link}
          onClose={() => handleCloseAlert(alert.alert_id)}
        />
      ))}

      <ListItem>
      </ListItem>
    </Box>
  );
}
