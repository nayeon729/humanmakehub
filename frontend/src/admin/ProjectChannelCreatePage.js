import React, { useState, useEffect } from "react";
import {
  Box, TextField, Typography, Button, MenuItem, Paper, FormControl, InputLabel, Select
} from "@mui/material";
import axios from "../common/axiosInstance"
import { useNavigate, useParams } from "react-router-dom";
import { useAlert } from "../components/CommonAlert";


export default function ProjectChannelCreatePage() {
  const [title, setTitle] = useState("");
  const [userId, setUserId] = useState("");
  const [teamMemberId, setTeamMemberId] = useState("");
  const [content, setContent] = useState("");
  const [members, setMembers] = useState([]);
  const [pmId, setPmId] = useState("");
  const [projectTitle, setProjectTitle] = useState("");
  const { project_id } = useParams();
  const navigate = useNavigate();
  const { showAlert } = useAlert();
   const [images, setImages] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);

  const BASE_URL = process.env.REACT_APP_API_URL; // 서버 주소

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const token = sessionStorage.getItem("token");
        const res = await axios.get(`${BASE_URL}/admin/project/${project_id}/members`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setMembers(res.data.members ?? []);
        setPmId(res.data.pm_id);
      } catch (err) {
        console.error("멤버 불러오기 실패", err);
      }
    };
    fetchMembers();
  }, [project_id]);

  const handleSubmit = async () => {
    if (!title || !userId || !content) {
      alert("모든 필수 항목을 입력해주세요.");
      return;
    }

    const formData = new FormData();
    formData.append("title", title);
    formData.append("user_id", String(userId));
    formData.append("content", content);
    formData.append("value_id", teamMemberId == "공용" ? Number(project_id) : Number(teamMemberId));
    formData.append("category", teamMemberId == "공용" ? "board01" : "board02");

    images.forEach((img) => {
      formData.append("files", img);
    });


    try {
      const token = sessionStorage.getItem("token");
      const res = await axios.post(
        `${BASE_URL}/admin/projectchannel/${project_id}/create-with-file`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      alert("글이 등록되었습니다.");
      if (teamMemberId == "공용") {
        navigate(`/admin/channel/${project_id}/common`);
      } else {
        navigate(`/admin/channel/${project_id}/member/${userId}`);
      }
    } catch (error) {
      console.error("글 등록 실패", error);
      alert("글 등록 중 오류가 발생했습니다.");
    }
  };

  useEffect(() => {
    const fetchProjectTitle = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/admin/project/${project_id}/projecttitle`, {
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem("token")}`,
          },
        });
        setProjectTitle(res.data.title);
      } catch (err) {
        console.error("프로젝트 제목 불러오기 실패", err);
      }
    };

    fetchProjectTitle();
  }, [project_id]);

  useEffect(() => {
    const getTeamMemberId = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/common/teamMemberId/${project_id}/${userId}`, {
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem("token")}`,
          },
        });
        console.log("project_id", project_id);
        console.log("userId", userId);
        console.log("res", res.data.team_member_id);
        console.log("type", typeof (res.data.team_member_id));
        setTeamMemberId(res.data.team_member_id);
      } catch (err) {
        console.error("프로젝트 팀멤버아이디 조회 실패", err);
      }
    }
    getTeamMemberId();
  }, [userId])

const handleFileChange = (e) => {
  const selectedFiles = Array.from(e.target.files);

  // 기존 이미지 + 새로 선택한 이미지 합치기
  const updatedFiles = [...images, ...selectedFiles];
  setImages(updatedFiles);

  const newPreviews = selectedFiles.map(file => URL.createObjectURL(file));
  setPreviewUrls(prev => [...prev, ...newPreviews]);
};

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" gutterBottom fontWeight="bold">
        💬 {projectTitle} 글 작성
      </Typography>

      <Paper sx={{ p: 3, mt: 2 }}>
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2">제목</Typography>
          <TextField
            fullWidth
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            sx={{ mb: 2 }}
          />
        </Box>
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2">채널</Typography>
          <FormControl fullWidth>
            <Select
              labelId="member-select-label"
              id="member-select"
              displayEmpty
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
            >
              <MenuItem value="" disabled>
                채널을 선택해주세요
              </MenuItem>

              {pmId && (
                <MenuItem value={pmId} >
                  공용
                </MenuItem>
              )}
              {Array.isArray(members) && members.length > 0 ? (
                members
                  .filter((member) => member.user_id !== pmId)
                  .map((member) => (
                    <MenuItem key={member.user_id} value={member.user_id}>
                      {member.nickname}
                    </MenuItem>
                  ))
              ) : (
                <MenuItem disabled>멤버 없음</MenuItem>
              )}
            </Select>
          </FormControl>
        </Box>
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2">이미지 첨부</Typography>
          <input type="file" multiple accept="image/*" onChange={handleFileChange}/>
          <Box sx={{ display: "flex", gap: 2, mt: 2, flexWrap: "wrap" }}>
            {previewUrls.map((url, index) => (
              <img key={index} src={url} alt="preview" width="120" height="120" style={{ objectFit: "cover", borderRadius: "8px" }} />
            ))}
          </Box>
        </Box>
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2">내용</Typography>
          <TextField
            multiline
            rows={8}
            fullWidth
            value={content}
            onChange={(e) => setContent(e.target.value)}
            sx={{ mb: 2 }}
          />
        </Box>
        <Box sx={{ textAlign: 'center' }}>
          <Button variant="contained" fullWidth onClick={handleSubmit} sx={{ height: '45px', width: '250px', fontSize: '16px', borderRadius: '20px' }}>
            글 등록
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}
