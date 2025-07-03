import React, { useEffect, useState } from "react";
import {
  Box, Typography, Table, TableHead, TableBody, TableRow, TableCell,
  Paper, Button, Select, MenuItem, Chip, Tabs, Tab, Dialog, DialogTitle,
  DialogContent, DialogContentText, DialogActions
} from "@mui/material";
import axios from "axios";

export default function AdminUserManagementPage() {
  const [users, setUsers] = useState([]);
  const [tab, setTab] = useState("all");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);

  const BASE_URL = "http://127.0.0.1:8000";

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${BASE_URL}/admin/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(response.data);
    } catch (error) {
      console.error("사용자 불러오기 실패", error);
      alert("사용자 정보를 불러올 수 없습니다.");
    }
  };

  const handleRoleChange = async (user_id, newRole) => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("로그인 세션이 만료되었습니다. 다시 로그인해주세요.");
      return;
    }
    if (!newRole) {
      alert("새 역할이 유효하지 않습니다.");
      return;
    }
    try {
      await axios.put(
        `${BASE_URL}/admin/users/${user_id}`,
        { role: newRole },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        }
      );
      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user.user_id === user_id ? { ...user, role: newRole } : user
        )
      );
      alert("✅ 역할이 성공적으로 수정되었습니다.");
    } catch (error) {
      console.error("❌ 역할 수정 실패", error);
      const errorMsg = error.response?.data?.detail || "알 수 없는 서버 오류입니다.";
      alert("❌ 역할 수정 실패: " + errorMsg);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedUserId) return;
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${BASE_URL}/admin/users/${selectedUserId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers((prevUsers) => prevUsers.filter((user) => user.user_id !== selectedUserId));
      setDeleteDialogOpen(false);
      alert("사용자가 삭제되었습니다.");
    } catch (error) {
      console.error("사용자 삭제 실패", error);
      alert("사용자 삭제에 실패했습니다.");
    }
  };

  const filteredUsers = tab === "all" ? users : users.filter(user => user.role === tab);

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        👤 사용자 관리
      </Typography>

      <Tabs value={tab} onChange={(e, newVal) => setTab(newVal)} sx={{ mb: 2 }}>
        <Tab label="전체" value="all" />
        <Tab label="관리자" value="admin" />
        <Tab label="PM" value="pm" />
        <Tab label="멤버" value="member" />
        <Tab label="클라이언트" value="client" />
      </Tabs>

      <Paper sx={{ mt: 2, p: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>아이디</TableCell>
              <TableCell>닉네임</TableCell>
              <TableCell>역할</TableCell>
              <TableCell>이메일</TableCell>
              <TableCell align="center">관리</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredUsers.map((user) => (
              <TableRow key={user.user_id}>
                <TableCell>{user.user_id}</TableCell>
                <TableCell>{user.nickname}</TableCell>
                <TableCell>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Select
                      value={user.role}
                      onChange={(e) => handleRoleChange(user.user_id, e.target.value)}
                      size="small"
                    >
                      <MenuItem value="admin">admin</MenuItem>
                      <MenuItem value="pm">pm</MenuItem>
                      <MenuItem value="member">member</MenuItem>
                      <MenuItem value="client">client</MenuItem>
                    </Select>
                    <Chip
                      label={user.role}
                      size="small"
                      color={
                        user.role === "admin"
                          ? "error"
                          : user.role === "pm"
                            ? "warning"
                            : user.role === "member"
                              ? "info"
                              : "default"
                      }
                    />
                  </Box>
                </TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell align="center">
                  <Button
                    variant="outlined"
                    color="error"
                    size="small"
                    onClick={() => {
                      setSelectedUserId(user.user_id);
                      setDeleteDialogOpen(true);
                    }}
                  >
                    삭제
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>사용자 삭제 확인</DialogTitle>
        <DialogContent>
          <DialogContentText>
            정말로 이 사용자를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>취소</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            삭제 확인
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
