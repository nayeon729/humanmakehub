import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Box,
  Typography,
  Paper,
  Stack,
  Avatar,
  Divider,
  IconButton,
  Button,
  Chip
} from "@mui/material";
import CreateIcon from "@mui/icons-material/Create";

export default function ProjectChannelPmPage() {
  const { project_id, user_id } = useParams();
  const [messages, setMessages] = useState([]);
  const [pmId, setPmId] = useState("");
  const [myUserId, setMyUserId] = useState("");
  const [projectTitle, setProjectTitle] = useState("");
  const navigate = useNavigate();
  const BASE_URL = "http://127.0.0.1:8000";

  useEffect(() => {
    const id = localStorage.getItem("user_id");
    if (id) {
      setMyUserId(id);
    }
  }, []);
 const fetchMessages = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(
          `${BASE_URL}/member/project/${project_id}/user/${user_id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setMessages(res.data?.items ?? []);
        setPmId(res.data.pm_id);
        console.log("응답 확인 👉", res.data);
      } catch (err) {
        console.error("게시글 불러오기 실패", err);
      }
    };

  useEffect(() => {
    fetchMessages();
  }, [project_id, user_id]);
  console.log("pmId", pmId)
  messages.map((msg) => {
    console.log("user_id:", msg.user_id, "pmId:", pmId);
    return null;
  });
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
  
  const handleDelete=async(channel_id)=>{
     const confirmed = window.confirm("정말 삭제하시겠습니까?");
  if (!confirmed) return;
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${BASE_URL}/member/projectchannel/${channel_id}/delete`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchMessages();
      alert("✅ 프로젝트가 삭제(표시)되었습니다.")
    } catch (error) {
      console.error("❌ 프로젝트 삭제 실패", error);
      alert("❌ 프로젝트 삭제에 실패했습니다.");
    }
  };

  return (
    <Box sx={{ flex: 1, p: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h5" fontWeight="bold">
          💬 {projectTitle}
        </Typography>
        <IconButton color="primary" onClick={() => navigate(`/member/channel/${project_id}/create`)}>
          <CreateIcon />
        </IconButton>
      </Stack>
      <Divider sx={{ my: 2 }} />

      <Stack spacing={2}>
        {messages.map((msg) => (
          <Paper key={msg.channel_id} sx={{ p: 2 }}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Chip
                color={msg.create_id === pmId ? "primary" : "warning"}
                label={msg.create_id === pmId ? "PM" : msg.nickname}
              />
              <Typography mt={1} sx={{ fontSize: '24px', fontWeight: '700' }}>{msg.title}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ ml: "auto" }}>
                {msg.create_dt.slice(0, 10)}
              </Typography>
            </Stack>

            <Typography variant="body2" color="text.secondary">
              {msg.content}
            </Typography>
            {msg.create_id === myUserId && (
              <Stack direction="row" spacing={1} mt={1}>
                <Button onClick={() => navigate(`/member/channel/${project_id}/update/${msg.channel_id}`)}>
                  수정
                </Button>
                <Button onClick={() => handleDelete(msg.channel_id)}>
                  삭제
                </Button>
              </Stack>
            )}
          </Paper>
        ))}
      </Stack>
    </Box>
  );
};

