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
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [isSearchTriggered, setIsSearchTriggered] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const BASE_URL = "http://127.0.0.1:8000";

  useEffect(() => {
    fetchUsers();
  }, []);
  useEffect(() => {
    setCurrentPage(1); // 탭 바뀌면 1페이지로
  }, [tab]);
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

  const handleSearch = () => {
  const keyword = searchKeyword.trim().toLowerCase();
  setIsSearchTriggered(true);
  setCurrentPage(1);
  if (!keyword) {
    setFilteredUsers(users); // 검색어 없으면 필터링 안 함
    return;
  }

  const results = users.filter(
    (user) =>
      user.user_id.toLowerCase().includes(keyword) ||
      user.nickname.toLowerCase().includes(keyword)
  );
  setFilteredUsers(results);
  };
  
  const visibleUsers =
  tab === "all"
    ? isSearchTriggered
      ? filteredUsers
      : users
    : (isSearchTriggered ? filteredUsers : users).filter(
        (user) => user.role === tab
      );

  const paginatedUsers = visibleUsers.slice(
  (currentPage - 1) * itemsPerPage,
  currentPage * itemsPerPage
  );
  const totalPages = Math.ceil(visibleUsers.length / itemsPerPage);
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
      <Box display="flex" gap={1} mb={2}>
        <input
          type="text"
          placeholder="아이디 또는 닉네임 검색"
          value={searchKeyword}
          onChange={(e) => setSearchKeyword(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") handleSearch(); }}
          style={{
            padding: "8px",
            borderRadius: "4px",
            border: "1px solid #ccc",
            flex: 1,
          }}
        />
        <Button variant="contained" onClick={handleSearch}>
          검색
        </Button>
      </Box>
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
            {paginatedUsers.map((user) => (
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
      <Box display="flex" justifyContent="center" mt={2} gap={1}>
        {Array.from({ length: totalPages }, (_, idx) => (
          <Button
            key={idx + 1}
            variant={currentPage === idx + 1 ? "contained" : "outlined"}
            onClick={() => setCurrentPage(idx + 1)}
            size="small"
          >
            {idx + 1}
          </Button>
        ))}
      </Box>
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
