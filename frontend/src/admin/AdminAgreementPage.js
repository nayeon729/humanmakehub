// src/pages/admin/AdminAgreementPage.js
import React, { useEffect, useState } from "react";
import {
  Box, Typography, Table, TableHead, TableRow, TableCell, TableBody, Paper,
  Chip, Button, Select, MenuItem, CircularProgress, Dialog, DialogTitle, DialogContent
} from "@mui/material";
import axios from "../common/axiosInstance"

export default function AdminAgreementPage() {
  const [agreements, setAgreements] = useState([]);
  const [logs, setLogs] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [logOpen, setLogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const BASE_URL = process.env.REACT_APP_API_URL;

  useEffect(() => {
    fetchAgreements();
  }, []);

  const fetchAgreements = async () => {
    try {
      const token = sessionStorage.getItem("token");
      const res = await axios.get(`${BASE_URL}/agreements`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAgreements(res.data);
    } catch (err) {
      console.error("정산 제안 불러오기 실패", err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id, newStatus) => {
    if (!window.confirm(`정말로 상태를 '${newStatus}'로 변경하시겠습니까?`)) return;
    try {
      const token = sessionStorage.getItem("token");
      await axios.put(`${BASE_URL}/agreements/${id}/status`, { status: newStatus }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchAgreements();
      alert("상태가 성공적으로 변경되었습니다.");
    } catch (err) {
      console.error("상태 변경 실패", err);
      alert("상태 변경 실패");
    }
  };

  const fetchLogs = async (agreementId) => {
    try {
      const token = sessionStorage.getItem("token");
      const res = await axios.get(`${BASE_URL}/agreements/${agreementId}/logs`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setLogs(res.data);
      setSelectedId(agreementId);
      setLogOpen(true);
    } catch (err) {
      console.error("로그 불러오기 실패", err);
      alert("로그 조회 실패");
    }
  };

  const statusColors = {
    "제안대기": "default",
    "제안승인": "info",
    "팀원수락": "primary",
    "정산요청": "warning",
    "정산접수": "secondary",
    "정산진행중": "info",
    "정산완료": "success",
  };

  const statusOptions = [
    "제안승인", "정산접수", "정산진행중", "정산완료"
  ];

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        💼 관리자 정산 제안 관리
      </Typography>

      {loading ? (
        <CircularProgress />
      ) : (
        <Paper sx={{ mt: 2, p: 2 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>프로젝트 ID</TableCell>
                <TableCell>PM</TableCell>
                <TableCell>팀원</TableCell>
                <TableCell>형태</TableCell>
                <TableCell>금액</TableCell>
                <TableCell>기간</TableCell>
                <TableCell>상태</TableCell>
                <TableCell>변경</TableCell>
                <TableCell>로그</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {agreements.map((a) => (
                <TableRow key={a.id}>
                  <TableCell>{a.id}</TableCell>
                  <TableCell>{a.project_id}</TableCell>
                  <TableCell>{a.pm_id}</TableCell>
                  <TableCell>{a.member_id}</TableCell>
                  <TableCell>{a.payment_type}</TableCell>
                  <TableCell>{a.amount.toLocaleString()}원</TableCell>
                  <TableCell>{a.start_date} ~ {a.end_date}</TableCell>
                  <TableCell>
                    <Chip label={a.status} color={statusColors[a.status] || "default"} size="small" />
                  </TableCell>
                  <TableCell>
                    <Select
                      size="small"
                      value={""}
                      displayEmpty
                      onChange={(e) => handleStatusUpdate(a.id, e.target.value)}
                    >
                      <MenuItem disabled value="">상태 변경</MenuItem>
                      {statusOptions.map((status) => (
                        <MenuItem key={status} value={status}>{status}</MenuItem>
                      ))}
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Button size="small" onClick={() => fetchLogs(a.id)}>이력</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      )}

      <Dialog open={logOpen} onClose={() => setLogOpen(false)} fullWidth>
        <DialogTitle>상태 변경 로그 - 제안 ID: {selectedId}</DialogTitle>
        <DialogContent dividers>
          {logs.length === 0 ? (
            <Typography variant="body2" color="text.secondary">기록 없음</Typography>
          ) : (
            logs.map((log, index) => (
              <Typography key={index} variant="body2" sx={{ mb: 1 }}>
                [{log.changed_at}] {log.changed_by} 님이 <b>{log.old_status}</b> → <b>{log.new_status}</b> 로 변경
              </Typography>
            ))
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
} 