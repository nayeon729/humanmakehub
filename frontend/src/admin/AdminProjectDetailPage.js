import React, { useState, useEffect, useRef } from "react";
import {
    Box, Typography, Paper, TextField, Button, Select, MenuItem,
    LinearProgress, Slider, Divider, Stack
} from "@mui/material";
import axios from "axios";
import { useParams } from "react-router-dom";

export default function AdminProjectDetailPage() {
    const { id } = useParams();
    const [project, setProject] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [team, setTeam] = useState([]);
    const [tasks, setTasks] = useState([]);
    const messagesEndRef = useRef(null);
    const BASE_URL = "http://127.0.0.1:8000";

    useEffect(() => {
        fetchProject();
        fetchMessages();
        fetchTeam();
        fetchTasks();
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const fetchProject = async () => {
        try {
            const res = await axios.get(`${BASE_URL}/projects/${id}`);
            setProject(res.data);
        } catch (error) {
            console.error("❌ 프로젝트 정보 실패", error);
        }
    };

    const fetchMessages = async () => {
        try {
            const res = await axios.get(`${BASE_URL}/messages/${id}`);
            setMessages(res.data);
        } catch (error) {
            console.error("❌ 메시지 실패", error);
        }
    };

    const fetchTeam = async () => {
        try {
            const res = await axios.get(`${BASE_URL}/teams/${id}`);
            setTeam(res.data);
        } catch (error) {
            console.error("❌ 팀 정보 실패", error);
        }
    };

    const fetchTasks = async () => {
        try {
            const res = await axios.get(`${BASE_URL}/tasks/${id}`);
            setTasks(res.data);
        } catch (error) {
            console.error("❌ 작업 실패", error);
        }
    };

    const handleSendMessage = async () => {
        if (!newMessage.trim()) return;
        try {
            const sender_id = localStorage.getItem("username") || "admin";
            await axios.post(`${BASE_URL}/messages`, {
                sender_id,
                receiver_id: 0,
                project_id: parseInt(id),
                content: newMessage,
            }, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`
                }
            });
            setNewMessage("");
            fetchMessages();
        } catch (error) {
            console.error("❌ 메시지 전송 실패", error);
        }
    };

    if (!project) return <Typography>로딩 중...</Typography>;

    return (
        <Box sx={{ p: 4 }}>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
                📄 프로젝트 상세 관리
            </Typography>

            {/* 프로젝트 정보 */}
            <Paper sx={{ p: 3, mb: 4 }}>
                <Typography variant="h6" fontWeight="bold" gutterBottom>📌 프로젝트 정보</Typography>
                <Box sx={{ mb: 1 }}>
                    <Typography variant="body1"><b>제목:</b> {project.title}</Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
                        {project.description}
                    </Typography>
                </Box>

                <Box sx={{ mt: 2 }}>
                    <Typography variant="body2"><b>상태:</b> {project.status}</Typography>
                    <Typography variant="body2"><b>카테고리:</b> {project.category}</Typography>
                    <Typography variant="body2"><b>예상 기간:</b> {project.estimated_duration}일</Typography>
                    <Typography variant="body2"><b>예산:</b> {Number(project.budget).toLocaleString()}원</Typography>
                    <Typography variant="body2"><b>긴급도:</b> {project.urgency}</Typography>
                    <Typography variant="body2"><b>PM:</b> {project.pm || "미지정"}</Typography>
                    <Typography variant="body2"><b>진행률:</b> {project.progress}%</Typography>
                    <Box sx={{ mt: 1 }}>
                        <LinearProgress variant="determinate" value={project.progress} sx={{ height: 8, borderRadius: 5 }} />
                    </Box>
                </Box>
            </Paper>

            {/* 팀원 목록 */}
            <Paper sx={{ p: 3, mb: 4 }}>
                <Typography variant="h6" fontWeight="bold" gutterBottom>👥 팀 구성</Typography>
                {team.length === 0 ? (
                    <Typography color="text.secondary">아직 팀원이 없습니다.</Typography>
                ) : (
                    team.map((member) => (
                        <Box key={member.id} sx={{ mb: 1 }}>
                            <Typography variant="subtitle1">{member.username} ({member.role})</Typography>
                            <Typography variant="body2" color="text.secondary">
                                전화: {member.phone || '-'}, 회사: {member.company || '-'}, 포트폴리오: {member.portfolio || '-'}
                            </Typography>
                        </Box>
                    ))
                )}
            </Paper>

            {/* 작업 목록 */}
            <Paper sx={{ p: 3, mb: 4 }}>
                <Typography variant="h6" fontWeight="bold" gutterBottom>🛠️ 작업(Task)</Typography>
                {tasks.length === 0 ? (
                    <Typography color="text.secondary">등록된 작업이 없습니다.</Typography>
                ) : (
                    tasks.map((task) => (
                        <Box key={task.id} sx={{ mb: 1, pl: 1 }}>
                            <Typography variant="subtitle2" fontWeight="bold">
                                [ {task.status} ] {task.title}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                담당자 ID: {task.assignee_id}, 진행률: {task.progress}%
                            </Typography>
                        </Box>
                    ))
                )}
            </Paper>

            {/* 💬 프로젝트 메신저 */}
            <Paper sx={{ p: 3, mb: 4 }}>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                    💬 프로젝트 메신저
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
                            const isMine = msg.sender_id === localStorage.getItem("username");
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
                                            pr: 6,
                                            borderRadius: 3,
                                            minWidth: "120px",
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
                                            {isMine ? `나 (${msg.sender_id})` : `${msg.sender_id}`}
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
                    <div ref={messagesEndRef} />
                </Box>

                {/* 입력창 */}
                <Stack direction="row" spacing={1}>
                    <TextField
                        fullWidth
                        size="small"
                        placeholder="메시지를 입력하세요"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") handleSendMessage(); }}
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
                        onClick={handleSendMessage}
                        sx={{ borderRadius: 2 }}
                    >
                        전송
                    </Button>
                </Stack>
            </Paper>
        </Box>
    );
}
