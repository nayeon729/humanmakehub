import React, { useState, useEffect } from "react";
import {
  Box, TextField, Typography, Button, MenuItem, Paper, FormControl, InputLabel, Select
} from "@mui/material";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";


export default function ProjectChannelCreatePage() {
  const [title, setTitle] = useState("");
  const [userId, setUserId] = useState("");
  const [content, setContent] = useState("");
  const [members, setMembers] = useState([]);
  const [pmId, setPmId] = useState("");
  const [projectTitle, setProjectTitle] = useState("");
  const { project_id } = useParams();
  const navigate = useNavigate();

  const BASE_URL = "http://127.0.0.1:8000"; // 서버 주소

  const handleSubmit = async () => {
    if (!title || !content) {
      alert("모든 필수 항목을 입력해주세요.");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      await axios.post(`${BASE_URL}/member/projectchannel/${project_id}/create`, {
        title,
        user_id: userId,
        content,
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      alert("글이 등록되었습니다.");
      navigate(`/member/channel/${project_id}/common`); // 공지사항 목록 페이지로 이동
    } catch (error) {
      console.error("글 등록 실패", error);
      alert("글 등록 중 오류가 발생했습니다.");
    }
  };
  useEffect(() => {
    const fetchProjectTitle = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/member/project/${project_id}/projecttitle`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        setProjectTitle(res.data.title);
      } catch (err) {
        console.error("프로젝트 제목 불러오기 실패", err);
      }
    };

    fetchProjectTitle();
  }, [project_id]);
  return (
    <Box sx={{ maxWidth: 600, mx: "auto", mt: 5 }}>
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

        <Button variant="contained" fullWidth onClick={handleSubmit}>
          글 등록
        </Button>
      </Paper>
    </Box>
  );
}
