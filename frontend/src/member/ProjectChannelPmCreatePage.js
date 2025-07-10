import React, { useState, useEffect } from "react";
import {
  Box, TextField, Typography, Button, MenuItem, Paper, FormControl, InputLabel, Select
} from "@mui/material";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import chatting from "../assets/chatting.png";


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
    <Box sx={{ flex: 1, p: 3 }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        <img src={chatting} alt="채팅" width={40} height={40} style={{ verticalAlign: "middle", marginRight: 8 }} />
        {projectTitle} 글 작성
      </Typography>

      <Paper sx={{
        p: 3, 
        mt: 2, 
        backgroundColor: "#fff",
        mt: 2,
        borderRadius: 2,
        boxShadow: "4px 4px 8px rgba(0, 0, 0, 0.1)",
        "& fieldset": { border: "none" },
        borderTop: "1px solid #ddd",
        borderLeft: "1px solid #ddd",
      }}>
        <Box sx={{ mb: 5 }}>
          <Typography variant="body2" fontWeight="bold">
            제목*
          </Typography>
          <TextField
            fullWidth
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            variant="outlined"
            InputProps={{
              notched: false,
              sx: {
                border: "none",
              },
            }}
            sx={{
              backgroundColor: "#fff",
              mt: 2,
              borderRadius: 2,
              boxShadow: "4px 4px 8px rgba(0, 0, 0, 0.1)",
              "& fieldset": { border: "none" },
              borderTop: "1px solid #ddd",
              borderLeft: "1px solid #ddd",
            }}
          />
        </Box>

        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" fontWeight="bold">
            내용*
          </Typography>
          <TextField
            multiline
            rows={15}
            fullWidth
            value={content}
            onChange={(e) => setContent(e.target.value)}
            variant="outlined"
            InputProps={{
              notched: false,
              sx: {
                border: "none",
              },
            }}
            sx={{
              backgroundColor: "#fff",
              mt: 2,
              borderRadius: 2,
              boxShadow: "4px 4px 8px rgba(0, 0, 0, 0.1)",
              "& fieldset": { border: "none" },
              borderTop: "1px solid #ddd",
              borderLeft: "1px solid #ddd",
            }}
          />
        </Box>

        <Button variant="contained" fullWidth onClick={handleSubmit}
          sx={{
            borderRadius: "15px",
            mt: 3,
          }}>
          글 등록
        </Button>
      </Paper>
    </Box>
  );
}
