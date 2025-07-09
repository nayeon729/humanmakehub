import React, { useState, useEffect } from "react";
import {
  Box, Typography, Paper, LinearProgress, Select, MenuItem,
  Slider, Grid, Chip, Stack, Button, Dialog, DialogTitle,
  DialogContent, DialogContentText, DialogActions,
} from "@mui/material";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Combo from "../components/Combo";


export default function AdminProjectManagementPage() {
  const [projects, setProjects] = useState([]);
  const [projectStatus, setProjectStatus] = useState("");
  const [progressMap, setProgressMap] = useState({});
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState("");

  const [invitedMemberMap, setInvitedMemberMap] = useState({});
  const [memberMap, setMemberMap] = useState({});

  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedRanks, setSelectedRanks] = useState([]);
  const [selectedPositions, setSelectedPositions] = useState([]);
  const [filteredDevelopers, setFilteredDevelopers] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);


  const BASE_URL = "http://127.0.0.1:8000"
  const navigate = useNavigate();

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (inviteModalOpen) {
      handleSearch();
    }
  }, [inviteModalOpen]);

  const fetchProjects = async () => {
    try {
      const pm_id = localStorage.getItem("user_id");
      const token = localStorage.getItem("token");
      const res = await axios.get(`${BASE_URL}/admin/my-projects`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const cleanedProjects = res.data.map((proj) => ({
        ...proj,
        pm: proj.pm || "",
        urgency: proj.urgency,
        status: proj.status ?? 0,
        progress: proj.progress ?? 0
      }));
      setProjects(cleanedProjects);
      for (const proj of cleanedProjects) {
        fetchInvitedMembers(proj.project_id);
        fetchProjectMembers(proj.project_id);
      }
    } catch (error) {
      console.error("프로젝트 불러오기 실패", error);
    }
  };

  const fetchInvitedMembers = async (project_id) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${BASE_URL}/admin/project/${project_id}/invited-members`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setInvitedMemberMap((prev) => ({
        ...prev,
        [project_id]: res.data.invited || []
      }));
    } catch (err) {
      console.error("❌ 초대 멤버 불러오기 실패", err);
    }
  };

  const fetchProjectMembers = async (project_id) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${BASE_URL}/admin/project/${project_id}/members/without-pm`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setMemberMap((prev) => ({
        ...prev,
        [project_id]: res.data.members || []
      }));
    } catch (err) {
      console.error(`❌ 멤버 불러오기 실패 (project_id=${project_id})`, err);
    }
  };

  const handleProgressChange = async (project_id, newProgress) => {
    const token = localStorage.getItem("token");
    const proj = projects.find(p => p.project_id === project_id);
    if (!proj || proj.progress === newProgress) return;
    if (!token) {
      alert("로그인 세션이 만료되었습니다. 다시 로그인해주세요.");
      return;
    }
    if (!newProgress) {
      alert("새 상태가 유효하지 않습니다.");
      return;
    }
    try {
      await axios.put(
        `${BASE_URL}/admin/projects/${project_id}`,
        { progress: newProgress },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        }
      );
      setProjects((prevProjects) =>
        prevProjects.map((project) =>
          project.project_id === project_id ? { ...project, progress: newProgress } : project
        )
      );
      alert("✅ 진행률이 성공적으로 수정되었습니다.");
    } catch (error) {
      console.error("❌ 진행률 수정 실패", error);
      const errorMsg = error.response?.data?.detail || "알 수 없는 서버 오류입니다.";
      alert("❌ 진행률 수정 실패: " + errorMsg);
    }
  };

  const handleStatusChange = async (project_id, newStatus) => {
    const token = localStorage.getItem("token");
    const proj = projects.find(p => p.project_id === project_id);
    if (!proj || proj.status === newStatus) return;
    if (!token) {
      alert("로그인 세션이 만료되었습니다. 다시 로그인해주세요.");
      return;
    }
    if (!newStatus) {
      alert("새 상태가 유효하지 않습니다.");
      return;
    }
    try {
      await axios.put(
        `${BASE_URL}/admin/projects/${project_id}`,
        { status: newStatus },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        }
      );
      setProjects((prevProjects) =>
        prevProjects.map((project) =>
          project.project_id === project_id ? { ...project, status: newStatus } : project
        )
      );
      alert("✅ 상태이 성공적으로 수정되었습니다.");
    } catch (error) {
      console.error("❌ 상태 수정 실패", error);
      const errorMsg = error.response?.data?.detail || "알 수 없는 서버 오류입니다.";
      alert("❌ 상태 수정 실패: " + errorMsg);
    }
  };


  const handleDeleteProject = async (project_id) => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${BASE_URL}/admin/projects/${project_id}/delete`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchProjects();
      setDeleteDialogOpen(false);
      alert("✅ 프로젝트가 삭제(표시)되었습니다.")
    } catch (error) {
      console.error("❌ 프로젝트 삭제 실패", error);
      alert("❌ 프로젝트 삭제에 실패했습니다.");
    }
  };

  const urgencyMap = {
    U01: "긴급도: 여유",
    U02: "긴급도: 보통",
    U03: "긴급도: 높음",
  }
  const categoryMap = {
    A01: "웹 개발",
    A02: "앱 개발 ",
    A03: "데이터 분석",
    A04: "AI 솔루션",
    A05: "전산 시스템 구축",
    A06: "쇼핑몰 구축",
    A07: "플랫폼 구축",
    A08: "기타"
  }
  const urgencyColor = (urgency) => {
    if (urgency === "U01") return "success";
    if (urgency === "U02") return "primary";
    if (urgency === "U03") return "warning";
    return "default";
  }
  const handleCheckboxChange = (state, setState, value) => {
    setState((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };
  const rankMap = { S: "H01", A: "H02", B: "H03", C: "H04" };
  const positionMap = { 프론트: "T01", 백엔드: "T02", 모바일: "T03" };
  const convertedRanks = selectedRanks.map((r) => rankMap[r]);
  const convertedPositions = selectedPositions.map((p) => positionMap[p]);
  const handleSearch = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(`${BASE_URL}/admin/members/filter`, {
        ranks: convertedRanks,
        positions: convertedPositions,
        keyword: searchKeyword
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFilteredDevelopers(res.data);
    } catch (error) {
      console.error("개발자 검색 실패", error);
      alert("개발자 목록을 불러오지 못했습니다.");
    }
  };

  const handleAddMember = async (member_id) => {
    try {
      const token = localStorage.getItem("token");
      const pm_id = localStorage.getItem("user_id");
      await axios.post(`${BASE_URL}/admin/project/${selectedProjectId}/invite`, {
        member_id: member_id,
        pm_id: pm_id
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      alert("초대 완료!");
    } catch (err) {
      console.error(err.response?.data?.detail || "초대 실패");
      alert(err.response?.data?.detail || "초대에 실패했습니다.");
    }
  };

  const handleRemoveMember = async (projectId, userId) => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${BASE_URL}/admin/project/${projectId}/member/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("✅ 팀원 참여가 종료되었습니다.");

      // 최신 멤버 리스트 다시 불러오기
      await fetchProjectMembers(projectId);
    } catch (err) {
      console.error("❌ 팀원 삭제 실패", err);
      alert("팀원 삭제에 실패했습니다.");
    }
  };

  const handlePmApprove = async (projectId, requestId) => {
    try {
      const token = localStorage.getItem("token");
      await axios.post(`${BASE_URL}/admin/project/${projectId}/approve/${requestId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert("✅ 승인 완료");
      await fetchProjectMembers(projectId);       // 팀원 갱신
      await fetchInvitedMembers(projectId);       // 대기 리스트 갱신
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.detail || "승인 중 오류 발생");
    }
  };

  const handlePmReject = async (projectId, requestId) => {
    try {
      const token = localStorage.getItem("token");
      await axios.post(`${BASE_URL}/admin/project/${projectId}/reject/${requestId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert("❌ 미승인 처리 완료");
      await fetchInvitedMembers(projectId);
    } catch (err) {
      console.error(err);
      alert("미승인 처리 실패");
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        📂 프로젝트 관리
      </Typography>

      <Grid container spacing={3}>
        {projects.map((proj) => {
          const formattedDate = new Date(proj.create_dt).toLocaleDateString("ko-KR");
          return (
            <Grid item xs={12} sm={6} md={4} key={proj.project_id}>
              <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
                <Box mb={1}
                  sx={{ display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <Box sx={{ display: "flex", flex: '4' }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'flex' }}>
                      접수일: {formattedDate}
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", flex: '1', flexDirection: "row", marginLeft: "10px" }}>
                    <button
                      style={{ background: "none", width: '35px', border: 'none', padding: '0px', color: 'blue' }}
                      onClick={() => navigate(`/admin/update/${proj.project_id}`)}
                    >
                      수정
                    </button>
                    <button
                      style={{ background: "none", width: '35px', border: 'none', padding: '0px', color: 'red' }}
                      onClick={() => handleDeleteProject(proj.project_id)}
                    >
                      삭제
                    </button>
                  </Box>
                </Box>
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                  <Chip label={urgencyMap[proj.urgency] || "없음"} color={urgencyColor(proj.urgency)} size="small" />

                </Stack>

                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  {proj.title}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>카테고리:</strong>  {categoryMap[proj.category] || "없음"}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>고객:</strong> {proj.client_id}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>회사명:</strong> {proj.client_company}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>Email:</strong> {proj.client_email}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>예상 기간:</strong> {proj.estimated_duration}일
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>예산:</strong> {proj.budget}원
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>요구사항:</strong> <br />
                  {proj.description}
                </Typography>
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" fontWeight="bold" gutterBottom>
                    멤버 리스트
                    <Button
                      variant="outlined"
                      size="small"
                      sx={{ ml: 1 }}
                      onClick={() => {
                        setInviteModalOpen(true)
                        setSelectedProjectId(proj.project_id)
                      }}
                    >
                      + 개발자 초대
                    </Button>
                  </Typography>
                </Box>
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" fontWeight="bold">초대된 멤버 (대기 중)</Typography>
                  <Box sx={{ maxHeight: 100,minHeight:100, overflowY: "auto", mt: 1 ,border: "1px solid #eee", borderRadius: 1,p:1}}>
                    {invitedMemberMap[proj.project_id]?.map((member) => {
                      if (member.status === 'N' && member.checking === 'N') {
                        return (
                          <Box key={member.user_id} sx={{ display: "flex", justifyContent: "space-between" }}>
                            <Typography>{member.nickname}</Typography>
                            <Chip label="응답 대기" size="small" />
                          </Box>
                        );
                      }

                      if (member.status === 'Y' && member.checking === 'Y') {
                        return (
                          <Box key={member.user_id} sx={{ display: "flex", justifyContent: "space-between" }}>
                            <Typography>{member.nickname}</Typography>
                            <Button size="small" onClick={() => handlePmApprove(proj.project_id, member.request_id)}>승인</Button>
                            <Button size="small" color="error" onClick={() => handlePmReject(proj.project_id, member.request_id)}>미승인</Button>
                          </Box>
                        );
                      }

                      // status N + checking Y 는 거절된 상태 → 화면 표시 안함
                      return null;
                    })}
                  </Box>
                </Box>
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" fontWeight="bold" gutterBottom>
                    참여 멤버
                  </Typography>

                  <Box
                    sx={{
                      minHeight: 100,
                      maxHeight: 100,
                      overflowY: "auto",
                      border: "1px solid #eee",
                      borderRadius: 1,
                      p:1,
                      backgroundColor: "#fafafa" // (선택) 배경 구분
                    }}
                  >
                    {memberMap[proj.project_id]?.map((member) => (
                      <Box
                        key={member.user_id}
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          mb: 1,
                        }}
                      >
                        <Typography>{member.nickname}</Typography>
                        <Button
                          size="small"
                          variant="outlined"
                          color="error"
                          onClick={() => handleRemoveMember(proj.project_id, member.user_id)}
                        >
                          참여 종료
                        </Button>
                      </Box>
                    ))}
                  </Box>
                </Box>
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" fontWeight="bold" gutterBottom>
                    진행률
                  </Typography>

                  {/* 🔹 현재 진행률 표시용 Bar */}
                  <LinearProgress
                    variant="determinate"
                    value={proj.progress}
                    sx={{
                      height: 10,
                      borderRadius: 5,
                      mb: 1,
                      backgroundColor: "#e0e0e0",
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: "#42a5f5", // 파란색
                      },
                    }}
                  />
                  <Typography sx={{ fontSize: '14px' }}>{proj.progress}%</Typography>
                  <Slider
                    value={progressMap[proj.project_id] ?? proj.progress}
                    onChange={(e, newVal) => {
                      setProgressMap((prev) => ({
                        ...prev,
                        [proj.project_id]: newVal,
                      }));
                    }}
                    onChangeCommitted={(e, newVal) => {
                      handleProgressChange(proj.project_id, newVal);
                      setProgressMap((prev) => ({
                        ...prev,
                        [proj.project_id]: undefined,
                      }));
                    }}
                    step={5}
                    min={0}
                    max={100}
                    valueLabelDisplay="auto"
                    sx={{ mt: 1 }}
                  />
                </Box>
                <Box>
                  <Typography variant="body2">상태</Typography>
                  <Combo
                    groupId="PROJECT_STATUS"
                    defaultValue={proj.status}
                    onSelectionChange={(val) => handleStatusChange(proj.project_id, val)}
                    sx={{ minWidth: 50 }}
                  />
                </Box>

                <Button
                  variant="contained"
                  fullWidth
                  sx={{ mt: 2 }}
                  onClick={() => navigate(`/admin/channel/${proj.project_id}/common`)}
                >
                  프로젝트 채널
                </Button>
              </Paper>
            </Grid>
          );
        })}
      </Grid>
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>프로젝트 삭제 확인</DialogTitle>
        <DialogContent>
          <DialogContentText>
            정말로 이 프로젝트를 삭제하시겠습니까?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>취소</Button>
          <Button onClick={handleDeleteProject} color="error" variant="contained">
            삭제 확인
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog open={inviteModalOpen} onClose={() => setInviteModalOpen(false)}>
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          개발자 초대
          <button onClick={() => setInviteModalOpen(false)} style={{ color: "red", width: "30px", p: 0, m: 0, border: 'none', backgroundColor: 'transparent' }}>
            ❌
          </button>
        </DialogTitle>
        <DialogContent>
          {/* 🔍 검색 영역 */}
          <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
            <input
              type="text"
              placeholder="닉네임 검색"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              style={{ flex: 1, padding: 8, border: "1px solid #ccc", borderRadius: 4 }}
            />
            <Button variant="contained" onClick={() => handleSearch()}>검색</Button>
          </Box>

          {/* ✅ 필터링 옵션 */}
          <Box sx={{ display: "flex", gap: 5, mb: 2 }}>
            <Box>
              <Typography fontWeight="bold">등급</Typography>
              {["S", "A", "B", "C"].map((rank) => (
                <label key={rank}>
                  <input
                    type="checkbox"
                    value={rank}
                    onChange={(e) =>
                      handleCheckboxChange(selectedRanks, setSelectedRanks, e.target.value)
                    }
                  />{" "}
                  {rank}
                </label>
              ))}
            </Box>
            <Box>
              <Typography fontWeight="bold">포지션</Typography>
              {["프론트", "백엔드", "모바일"].map((pos) => (
                <label key={pos}>
                  <input
                    type="checkbox"
                    value={pos}
                    onChange={(e) =>
                      handleCheckboxChange(selectedPositions, setSelectedPositions, e.target.value)
                    }
                  />{" "}
                  {pos}
                </label>
              ))}
            </Box>
          </Box>

          {/* 👤 개발자 리스트 */}
          <Box sx={{ maxHeight: "310px", overflowY: "auto", mb: 2 }}>
            {filteredDevelopers.map((dev) => (
              <Box
                key={dev.user_id}
                sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}
              >
                <Typography>{dev.nickname}</Typography>
                <Button variant="outlined" size="small" onClick={() => handleAddMember(dev.user_id)}>초대하기</Button>
              </Box>
            ))}
          </Box>

          {/* 페이지네이션 (가라용) */}
          <Box display="flex" justifyContent="center" gap={1}>
            {[1].map((num) => (
              <Button
                key={num}
                size="small"
                variant={currentPage === num ? "contained" : "outlined"}
                onClick={() => setCurrentPage(num)}
              >
                {num}
              </Button>
            ))}
          </Box>
        </DialogContent>
      </Dialog>
    </Box>


  );
}
