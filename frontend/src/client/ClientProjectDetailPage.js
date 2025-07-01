import React, { useEffect, useState, useRef } from "react";

import { Box, Typography, Paper, Divider, Button, TextField, Stack } from "@mui/material";
import { useParams } from "react-router-dom";
import axios from "axios";

function DetailItem({ label, value }) {
  return (
    <Box sx={{ display: "flex", alignItems: "center" }}>
      <Typography variant="subtitle2" sx={{ fontWeight: "bold", minWidth: "90px" }}>
        {label}:
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {value}
      </Typography>
    </Box>
  );
}

export default function ClientProjectDetailPage() {
  const { projectId } = useParams();
  const [project, setProject] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");

  const BASE_URL = "http://localhost:8000";
  const username = localStorage.getItem("username");

  useEffect(() => {
    if (projectId) {
      fetchProject();
      fetchMessages();
    }
  }, [projectId]);

  const fetchProject = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/projects/${projectId}`);
      setProject(res.data);
    } catch (error) {
      console.error("프로젝트 조회 실패", error);
    }
  };

  const fetchMessages = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/messages/${projectId}`);
      setMessages(res.data);
    } catch (error) {
      console.error("메시지 조회 실패", error);
    }
  };

  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    try {
      const token = localStorage.getItem("token");
      await axios.post(`${BASE_URL}/messages`, {
        sender_id: username,
        receiver_id: 0,
        project_id: parseInt(projectId),
        content: newMessage
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setNewMessage("");
      fetchMessages();
    } catch (error) {
      console.error("메시지 전송 실패", error);
    }
  };

  if (!project) return <Typography>Loading...</Typography>;

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        📄 {project.title}
      </Typography>

      <Typography variant="caption" color="text.secondary">
        등록일: {new Date(project.created_at).toLocaleDateString()}
      </Typography>

      <Divider sx={{ my: 2 }} />

      <Typography variant="h6" fontWeight="bold" gutterBottom>
        💬 프로젝트 설명
      </Typography>
      <Typography variant="body1" color="text.primary" sx={{ mb: 3 }}>
        {project.description}
      </Typography>

      <Divider sx={{ my: 2 }} />

      <Typography variant="h6" fontWeight="bold" gutterBottom>
        📋 상세 정보
      </Typography>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
          gap: 2,
          mt: 2,
        }}
      >
        <DetailItem label="상태" value={project.status} />
        <DetailItem label="카테고리" value={project.category} />
        <DetailItem label="예상 기간" value={`${project.estimated_duration}일`} />
        <DetailItem label="예산" value={`${project.budget.toLocaleString()}원`} />
        <DetailItem label="긴급도" value={project.urgency} />
        <DetailItem label="PM 이름" value={project.pm || "미지정"} />
        <DetailItem label="진행률" value={`${project.progress || 0}%`} />
      </Box>

      <Divider sx={{ my: 4 }} />

      {/* 💬 채팅창 영역 */}
      <Paper sx={{ p: 3, backgroundColor: "#fafafa", borderRadius: 3, boxShadow: 1 }}>
        <Typography variant="h6" fontWeight="bold" gutterBottom>
          💬 프로젝트 채팅
        </Typography>

        <Box
          sx={{
            maxHeight: 450,
            overflowY: "auto",
            mb: 2,
            p: 2,
            backgroundColor: "#fff",
            borderRadius: 2,
            border: "1px solid #e0e0e0",
          }}
        >
          {messages.length === 0 ? (
            <Typography variant="body2" color="text.secondary" align="center">
              아직 메시지가 없습니다.
            </Typography>
          ) : (
            messages.map((msg, idx) => {
              const isMine = msg.sender_id === username;
              const messageTime = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

              return (
                <Box
                  key={idx}
                  sx={{
                    display: "flex",
                    justifyContent: isMine ? "flex-end" : "flex-start",
                    mb: 1.5,
                  }}
                >
                  <Box
                    sx={{
                      backgroundColor: isMine ? "#1976d2" : "#f1f1f1",
                      color: isMine ? "#fff" : "#333",
                      p: 2,
                      pr: 6, // ✅ 오른쪽 패딩 추가
                      borderRadius: 3,
                      minWidth: "120px", // ✅ 최소 너비 설정
                      maxWidth: "65%",
                      boxShadow: 2,
                      wordBreak: "break-word",
                      position: "relative",
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        fontSize: "0.75rem",
                        fontWeight: "bold",
                        mb: 0.5,
                        opacity: isMine ? 0.9 : 0.7,
                      }}
                    >
                      {isMine ? "나" : msg.sender_id}
                    </Typography>

                    <Typography variant="body1" sx={{ mb: 1 }}>
                      {msg.content}
                    </Typography>

                    <Typography
                      variant="caption"
                      sx={{
                        position: "absolute",
                        bottom: 8,
                        right: 12,
                        fontSize: "0.65rem",
                        opacity: 0.7,
                        color: isMine ? "#d0e3f8" : "gray",
                      }}
                    >
                      {messageTime}
                    </Typography>
                  </Box>
                </Box>
              );
            })
          )}

          {/* ✅ 여기에 최하단 ref 추가 */}
          <div ref={messagesEndRef} />
        </Box>

        {/* 메시지 입력창 */}
        <Stack direction="row" spacing={1}>
          <TextField
            fullWidth
            size="small"
            placeholder="메시지를 입력하세요"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") sendMessage(); }}
            sx={{
              backgroundColor: "#fff",
              borderRadius: 2,
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
              },
            }}
          />
          <Button
            variant="contained"
            color="primary"
            onClick={sendMessage}
            sx={{ borderRadius: 2 }}
          >
            전송
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
}
