import React, { useState, useEffect } from "react";
import {
    Box, TextField, Typography, Button, MenuItem, Paper, FormControl, Select
} from "@mui/material";
import axios from "../common/axiosInstance"
import { useNavigate, useParams } from "react-router-dom";
import Combo from "../components/Combo";
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
            const res = await axios.get(`${BASE_URL}/admin/projectchannel/${channel_id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = res.data;
            setTitle(data.title);
            setUserId(data.user_id);
            setContent(data.content);
        } catch (error) {
            console.error("글 불러오기 실패", error);
        }
    };

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

    const handleUpdate = async (channel_id) => {
        if (!title || !userId || !content) {
            showAlert("모든 필수 항목을 입력해주세요.");
            return;
        }
        try {
            const token = sessionStorage.getItem("token");
            await axios.put(`${BASE_URL}/admin/projectchannel/${channel_id}/update`, {
                title,
                user_id: userId,
                content
            }, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            showAlert("✅ 공지사항이 수정되었습니다.");
            navigate(`/admin/channel/${project_id}/common`);
        } catch (error) {
            console.error("❌ 공지사항 수정 실패", error);
            showAlert("공지사항 수정에 실패했습니다.");
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
    return (
        <Box sx={{ p: 2 }}>
            <Typography variant="h5" gutterBottom fontWeight="bold">
                📢 {projectTitle}글 수정
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
                    {members.length > 0 ? (
                        <FormControl fullWidth>
                            <Select
                                labelId="member-select-label"
                                id="member-select"
                                value={userId || ""}
                                onChange={(e) => setUserId(e.target.value)}
                            >
                                {pmId && <MenuItem value={pmId}>공용</MenuItem>}
                                {members
                                    .filter((m) => m?.user_id && m.user_id !== pmId)
                                    .map((m) => (
                                        <MenuItem key={m.user_id} value={m.user_id}>
                                            {m.nickname || "이름 없음"}
                                        </MenuItem>
                                    ))}
                            </Select>
                        </FormControl>
                    ) : (
                        <Typography>멤버 정보를 불러오는 중...</Typography>
                    )}
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
                    <Button variant="contained" fullWidth onClick={() => handleUpdate(channel_id)} sx={{height:'45px', width: '250px', fontSize:'16px', borderRadius:'20px'}}>
                        글 수정
                    </Button>
                </Box>
            </Paper>
        </Box>
    );
}
