import React, { useEffect, useState } from "react";
import {
  Box, Typography, Table, TableHead, TableBody, TableRow, TableCell,
  Paper, Button, Select, MenuItem, Chip, Tabs, Tab, Dialog, DialogTitle,
  DialogContent, DialogContentText, DialogActions, Stack, TextField, Pagination
} from "@mui/material";
import axios from "../common/axiosInstance"
import Combo from "../components/Combo";
import { useNavigate } from "react-router-dom";
import AccountCircleIcon from '@mui/icons-material/AccountCircle';

export default function AdminUserManagementPage() {
  const [users, setUsers] = useState([]);
  const [tab, setTab] = useState("all");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [recoverDialogOpen, setRecoverDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [isSearchTriggered, setIsSearchTriggered] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [userGrade, setUserGrade] = useState("");
  const [userRole, setUserRole] = useState("");
  const itemsPerPage = 10;
  const BASE_URL = process.env.REACT_APP_API_URL;
  const navigate = useNavigate();

  useEffect(() => {
    fetchUsers();
  }, []);
  useEffect(() => {
    setCurrentPage(1); // 탭 바뀌면 1페이지로
  }, [tab]);
  const fetchUsers = async () => {
    try {
      const token = sessionStorage.getItem("token");
      const response = await axios.get(`${BASE_URL}/admin/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(response.data);
    } catch (error) {
      console.error("사용자 불러오기 실패", error);
      alert("사용자 정보를 불러올 수 없습니다.");
    }
  };


  const handleGradeChange = async (user_id, newGrade) => {
    const token = sessionStorage.getItem("token");
    const user = users.find(u => u.user_id === user_id);
    if (!user || user.grade === newGrade) return;
    if (!token) {
      alert("로그인 세션이 만료되었습니다. 다시 로그인해주세요.");
      return;
    }
    if (!newGrade) {
      alert("새 등급이 유효하지 않습니다.");
      return;
    }
    try {
      await axios.put(
        `${BASE_URL}/admin/users/${user_id}/grade`,
        { grade: newGrade },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        }
      );
      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user.user_id === user_id ? { ...user, grade: newGrade } : user
        )
      );
      alert("✅ 등급이 성공적으로 수정되었습니다.");
    } catch (error) {
      console.error("❌ 등급 수정 실패", error);
      const errorMsg = error.response?.data?.detail || "알 수 없는 서버 오류입니다.";
      alert("❌ 등급 수정 실패: " + errorMsg);
    }
  };


  const handleRoleChange = async (user_id, newRole) => {
    const token = sessionStorage.getItem("token");
    const user = users.find(u => u.user_id === user_id);
    if (!user || user.role === newRole) return;
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
        `${BASE_URL}/admin/users/${user_id}/role`,
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
      const token = sessionStorage.getItem("token");
      await axios.delete(`${BASE_URL}/admin/users/${selectedUserId}/delete`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchUsers();
      setDeleteDialogOpen(false);
      alert("✅ 사용자가 삭제(표시)되었습니다.");
    } catch (error) {
      console.error("❌ 사용자 삭제 실패", error);
      alert("❌ 사용자 삭제에 실패했습니다.");
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


  const handleRecoverUser = async () => {
    if (!selectedUserId) return;
    try {
      const token = sessionStorage.getItem("token");
      await axios.put(`${BASE_URL}/admin/users/${selectedUserId}/recover`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchUsers(); // 다시 리스트 새로고침
      setRecoverDialogOpen(false);
      alert("✅ 사용자가 복구되었습니다.");
    } catch (error) {
      console.error("❌ 사용자 복구 실패", error);
      alert("❌ 사용자 복구에 실패했습니다.");
    }
  };


  const visibleUsers = (
    tab === "all"
      ? isSearchTriggered
        ? filteredUsers
        : users
      : (isSearchTriggered ? filteredUsers : users).filter(
        (user) => user.role === tab
      )
  );

  const paginatedUsers = visibleUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const totalPages = Math.ceil(visibleUsers.length / itemsPerPage);
  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: "flex", gap:1}}>
        <AccountCircleIcon sx={{ fontSize: 40 }} />
      <Typography variant="h4" fontWeight="bold" gutterBottom>
       사용자 관리
      </Typography>
      </Box>

      <Tabs value={tab} onChange={(e, newVal) => setTab(newVal)} sx={{ mb: 2 }}>
        <Tab label="전체" value="all" />
        <Tab label="PM" value="R03" />
        <Tab label="멤버" value="R02" />
        <Tab label="클라이언트" value="R01" />
      </Tabs>
      <Stack direction="row" spacing={1} mb={2}alignItems={"center"}  justifyContent='center'>
        <TextField
          placeholder="아이디 또는 닉네임 검색"
          value={searchKeyword}
          onChange={(e) => setSearchKeyword(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSearch();
          }}
          sx={{ width: '400px', boxShadow: '3px 3px 6px gray', borderRadius: '5px' }}
          size="small"
        />
        <Button variant="outlined" onClick={handleSearch} sx={{ backgroundColor: '#2879E3', color: 'white', height: '35px', }}>
          검색
        </Button>
      </Stack>
      <Paper sx={{ mt: 2, p: 2 }}>
        <Table>
          <TableHead>
            <TableRow >
              <TableCell sx={{ textAlign: 'center' }}>아이디</TableCell>
              <TableCell sx={{ textAlign: 'center' }}>닉네임</TableCell>
              <TableCell sx={{ textAlign: 'center' }}>등급</TableCell>
              <TableCell sx={{ textAlign: 'center' }}>역할</TableCell>
              <TableCell sx={{ textAlign: 'center' }}>이메일</TableCell>
              <TableCell sx={{ textAlign: 'center' }}>관리</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedUsers.map((user) => (
              <TableRow key={user.user_id}>
                <TableCell sx={{ textAlign: 'center' }}>{user.user_id}</TableCell>
                <TableCell sx={{ textAlign: 'center' }}><Typography
                  sx={{
                    cursor: "pointer",
                    textDecoration: "none",
                    "&:hover": { color: "primary.dark" }
                  }}
                  onClick={() => navigate(`/admin/users/${user.user_id}?readonly=1`)}
                >
                  {user.nickname}
                </Typography></TableCell>
                <TableCell sx={{ textAlign: 'center' }}>
                  {user.role === "R02" ? (  // R02는 member
                    <Box>
                      <Combo
                        groupId="USER_GRADE"
                        defaultValue={user.grade}
                        onSelectionChange={(val) => handleGradeChange(user.user_id, val)}
                        sx={{ minWidth: 50 }}
                      />

                    </Box>
                  ) : (
                    <Typography />
                  )}
                </TableCell>
                <TableCell sx={{ textAlign: 'center' }}>
                  <Box>
                    <Combo
                      groupId="USER_ROLE"
                      defaultValue={user.role}
                      onSelectionChange={(val) => handleRoleChange(user.user_id, val)}
                      sx={{ minWidth: 50 }}
                    />
                  </Box>
                </TableCell >
                <TableCell sx={{ textAlign: 'center' }}>{user.email}</TableCell>
                <TableCell align="center">
                  {user.del_yn === 'Y' ? (
                    <Button
                      variant="outlined"
                      color={user.del_yn === 'Y' ? "success" : "error"}
                      size="small"
                      onClick={() => {
                        setSelectedUserId(user.user_id);
                        setRecoverDialogOpen(true);
                      }}
                    >
                      복구
                    </Button>
                  ) : (
                    <Button
                      variant="outlined"
                      color="error"
                      size="small"
                      onClick={() => {
                        setSelectedUserId(user.user_id);
                        setDeleteDialogOpen(true); // 삭제 확인 다이얼로그
                      }}
                    >
                      정지
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
      <Box mt={2} display="flex" justifyContent="center">
        <Pagination
          count={totalPages}
          page={currentPage}
          onChange={(e, value) => setCurrentPage(value)}
          shape="rounded"        // ● 동그란 스타일
          color="primary"        // ● 파란색 강조
          siblingCount={1}       // ● 현재 페이지 주변 1개씩
          boundaryCount={1}      // ● 양 끝 페이지 1개씩
        />
      </Box>
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>사용자 삭제 확인</DialogTitle>
        <DialogContent>
          <DialogContentText>
            정말로 이 사용자를 삭제하시겠습니까?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>취소</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            삭제 확인
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={recoverDialogOpen} onClose={() => setRecoverDialogOpen(false)}>
        <DialogTitle>사용자 복구 확인</DialogTitle>
        <DialogContent>
          <DialogContentText>
            정말로 이 사용자를 복구하시겠습니까?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>취소</Button>
          <Button onClick={handleRecoverUser} color="primary" variant="contained">
            복구 확인
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
