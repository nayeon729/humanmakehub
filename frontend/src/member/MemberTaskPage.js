import React, { useState, useEffect } from "react";
import { Box, Grid, Paper, Typography, List, ListItem, ListItemText } from "@mui/material";
import GroupsIcon from "@mui/icons-material/Groups";
import WorkspacesIcon from "@mui/icons-material/Workspaces";
import PaidIcon from "@mui/icons-material/Paid";
import ReportProblemIcon from "@mui/icons-material/ReportProblem";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import AccountCircleIcon from '@mui/icons-material/AccountCircle';

export default function MemberDashboard() {
  const [stats, setStats] = useState({
    user: 0,
    project: 0,
  });
  const navigate = useNavigate();
  const BASE_URL = "http://127.0.0.1:8000";

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
         개발자 대시보드
      </Typography>


      <Paper sx={{ mt: 4, p: 2, backgroundColor: "#f5f5f5", borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom>
          🔔 시스템 알림
        </Typography>
        <List>
          <ListItem>
        
          </ListItem>
        </List>
      </Paper>
    </Box>
  );
}
