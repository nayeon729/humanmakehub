// src/pages/client/ClientDashBoard.js

import React, { useEffect, useState } from "react";
import { Box, Typography, Button, Paper, Grid, Chip, Skeleton, Stack, LinearProgress } from "@mui/material";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import AlertCard from "../components/AlertCard";

export default function ClientDashboard() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
    const [alerts, setAlerts] = useState([]);

  const BASE_URL = "http://127.0.0.1:8000";

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
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        📂 고객 대시보드
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
     
       
    </Box>
  );
}
