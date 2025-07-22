/**
 * 파일명: ClientDashboard.js
 * 설명: 클라이언트(고객) 대시보드 페이지. 알림을 조회하고 알림 카드를 표시함.
 * 주요 기능:
 *   - 공통 알림 리스트 조회 (/common/alerts)
 *   - 알림 삭제 처리 (/common/alerts/{id}/delete)
 *   - 알림 클릭 시 지정된 링크로 이동
 */

import React, { useEffect, useState } from "react";
import { Box, Typography, Button, Paper, Grid, Chip, Skeleton, Stack, LinearProgress } from "@mui/material";
import { useNavigate } from "react-router-dom";
import axios from "../common/axiosInstance"
import AlertCard from "../components/AlertCard";
import Folder from "../assets/folder.png"
import MobileFullPageLayout from "../common/MobileFullPageLayout";
import Tooltip from "@mui/material/Tooltip";
import BeenhereIcon from '@mui/icons-material/Beenhere';

export default function ClientDashboard() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState([]);

  const categoryColors = {
    project: "#1976d2",   // 파랑 (예: 프로젝트 알림)
    ask: "#ff9800",   // 주황 (예: 문의사항 알림)
    commonChat: "#89d665",   // 주황 (예: 문의사항 알림)
    chat: "#9065d6ff",
    default: "#9e9e9e",   // 회색 (기본)
  };

  const BASE_URL = process.env.REACT_APP_API_URL;

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
    <MobileFullPageLayout>
      <Box sx={{ p: 2, pt: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <Tooltip
            title={
              <Typography sx={{ fontSize: 13, color: "#fff" }}>
                고객이 의뢰한 프로젝트의 진행도에 대한<br/> 알림을 확인할 수 있는 페이지입니다.
              </Typography>
            }
            placement="right"
            arrow
          >
            <Box sx={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
              <BeenhereIcon  color='primary' sx={{ fontSize: "40px", mr: "4px" ,}} />
              <Typography
                variant="h4"
                fontWeight="bold"
                gutterBottom
                sx={{ mb: 0, cursor: "help", }}
              >
                고객 대시보드
              </Typography>
            </Box>
          </Tooltip>
        </Box>
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
    </MobileFullPageLayout>
  );
}
