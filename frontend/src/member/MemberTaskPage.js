import React, { useState, useEffect } from "react";
import { Box, Grid, Paper, Typography, List, ListItem, ListItemText, Stack } from "@mui/material";
import GroupsIcon from "@mui/icons-material/Groups";
import WorkspacesIcon from "@mui/icons-material/Workspaces";
import PaidIcon from "@mui/icons-material/Paid";
import ReportProblemIcon from "@mui/icons-material/ReportProblem";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import DevIcon from "../assets/dev-icon.png";
import AlertCard from "../components/AlertCard";
import GroupAddIcon from '@mui/icons-material/GroupAdd';

export default function MemberDashboard() {
  const [stats, setStats] = useState({
    user: 0,
    project: 0,
  });
  const navigate = useNavigate();
  const BASE_URL = "http://127.0.0.1:8000";
  const [showAlert, setShowAlert] = useState(true);

  return (
    <Box sx={{ p: 2 }}>

      <Typography variant="h4" fontWeight="bold" gutterBottom>
        <img src={DevIcon} alt="개발자" width={40} height={40} style={{ marginTop: 4 }} />
        개발자 대시보드
      </Typography>

      {showAlert && (
        <AlertCard
          title="시스템 알림"
          subtitle="프로젝트 초대 수신"
          description="PM이 프로젝트에 초대하였습니다. 알림 목록에서 확인 후 수락 또는 거절할 수 있습니다."
          linkUrl="/member/project/15"
          onClose={() => setShowAlert(false)}
        />
      )}

      <ListItem>
      </ListItem>
    </Box>
  );
}
