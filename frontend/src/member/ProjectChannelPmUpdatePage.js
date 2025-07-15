import React, { useState, useEffect } from "react";
import {
    Box, TextField, Typography, Button, MenuItem, Paper, FormControl, Select
} from "@mui/material";
import axios from "../common/axiosInstance"
import { useNavigate, useParams } from "react-router-dom";
import chatting from "../assets/chatting.png";
import { useAlert } from "../components/CommonAlert";

export default function ProjectChannelUpdatePage() {
    const { channel_id, project_id } = useParams();
    const [title, setTitle] = useState("");
    const [userId, setUserId] = useState("");
    const [content, setContent] = useState("");
    const [members, setMembers] = useState([]);
    const [pmId, setPmId] = useState("");
    const [projectTitle, setProjectTitle] = useState("");

    const navigate = useNavigate();
    const { showAlert } = useAlert();

    const BASE_URL = process.env.REACT_APP_API_URL; // 서버 주소
    useEffect(() => {
        if (channel_id) {
            fetchChannel(channel_id);
        }
    }, [channel_id]);

    useEffect(() => {
        console.log("✅ members 변경:", members);
    }, [members]);
    const fetchChannel = async (channel_id) => {
        try {
            const token = sessionStorage.getItem("token");
            const res = await axios.get(`${BASE_URL}/member/projectchannel/${channel_id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = res.data;
            setTitle(data.title);
            setUserId(data.create_id);
            setContent(data.content);
        } catch (error) {
            console.error("글 불러오기 실패", error);
        }
    };

    useEffect(() => {
        const fetchMembers = async () => {
            try {
                const token = sessionStorage.getItem("token");
                const res = await axios.get(`${BASE_URL}/member/project/${project_id}/members`, {
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

    const handleUpdate = async (channel_id) => {
        if (!title || !content) {
            showAlert("모든 필수 항목을 입력해주세요.");
            return;
        }
        try {
            const token = sessionStorage.getItem("token");
            await axios.put(`${BASE_URL}/member/projectchannel/${channel_id}/update`, {
                title,
                user_id: userId,
                content
            }, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            showAlert("✅ 공지사항이 수정되었습니다.");
            navigate(`/member/channel/${project_id}/pm/${userId}`);
        } catch (error) {
            console.error("❌ 공지사항 수정 실패", error);
            showAlert("공지사항 수정에 실패했습니다.");
        }
    };
    useEffect(() => {
        const fetchProjectTitle = async () => {
            try {
                const res = await axios.get(`${BASE_URL}/member/project/${project_id}/projecttitle`, {
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
    return (
        <Box sx={{ flex: 1, p: 3 }}>
            <Typography variant="h4" gutterBottom fontWeight="bold">
                <img src={chatting} alt="채팅" width={40} height={40} style={{ verticalAlign: "middle", marginRight: 8 }} />
                {projectTitle} 글 수정
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

                <Button variant="contained" fullWidth onClick={() => handleUpdate(channel_id)}
                    sx={{
                        borderRadius: "15px",
                        mt: 3,
                    }}>
                    글 수정
                </Button>
            </Paper>
        </Box>
    );
}
