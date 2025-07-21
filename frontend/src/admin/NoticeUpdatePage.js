import React, { useState, useEffect } from "react";
import {
    Box, TextField, Typography, Button, MenuItem, Paper
} from "@mui/material";
import axios from "../common/axiosInstance"
import { useNavigate, useParams } from "react-router-dom";
import Combo from "../components/Combo";
import { useAlert } from "../components/CommonAlert";
import CampaignIcon from '@mui/icons-material/Campaign';
import Tooltip from "@mui/material/Tooltip";

export default function AdminNoticeCreatePage() {
    const { noticeId } = useParams();
    const [title, setTitle] = useState("");
    const [targetType, setTargetType] = useState("");
    const [content, setContent] = useState("");
    const navigate = useNavigate();
    const { showAlert } = useAlert();

    const BASE_URL = process.env.REACT_APP_API_URL; // 서버 주소
    useEffect(() => {
        if (noticeId) {
            fetchNotice(noticeId);
        }
    }, [noticeId]);

    const fetchNotice = async (notice_id) => {
        try {
            const token = sessionStorage.getItem("token");
            const res = await axios.get(`${BASE_URL}/admin/notices/${notice_id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = res.data;
            setTitle(data.title);
            setTargetType(data.target_type);
            setContent(data.content);
        } catch (error) {
            console.error("공지 불러오기 실패", error);
        }
    };

    const handleUpdate = async () => {
        if (!title || !targetType || !content) {
            showAlert("모든 필수 항목을 입력해주세요.");
            return;
        }
        try {
            const token = sessionStorage.getItem("token");
            await axios.put(`${BASE_URL}/admin/notices/${noticeId}/update`, {
                title,
                target_type: targetType,
                content
            }, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            showAlert("✅ 공지사항이 수정되었습니다.");
            navigate(`/admin/notice/${noticeId}`);
        } catch (error) {
            console.error("❌ 공지사항 수정 실패", error);
            showAlert("공지사항 수정에 실패했습니다.");
        }
    };

    return (
        <Box sx={{ p: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
                <Tooltip
                    title={
                        <Typography sx={{ fontSize: 13, color: "#fff" }}>
                            This little budf is <b>really cute</b> 🐤
                        </Typography>
                    }
                    placement="right"
                    arrow
                >
                    <Box sx={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
                        <CampaignIcon sx={{ fontSize: 40, mr: "4px" }} />
                        <Typography
                            variant="h4"
                            fontWeight="bold"
                            gutterBottom
                            sx={{ mb: 0, cursor: "help", }}
                        >
                            공지 사항 수정
                        </Typography>
                    </Box>
                </Tooltip>
            </Box>
            <Paper sx={{ p: 3, mt: 2 }}>
                <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" fontWeight={600}>제목</Typography>
                    <TextField
                        fullWidth
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        sx={{ mb: 2 }}
                    />
                </Box>
                <Box sx={{ mb: 5 }}>
                    <Typography variant="body2" fontWeight={600}>분류</Typography>
                    <Combo
                        groupId="NOTICE_TYPE"
                        value={targetType}
                        defaultValue={targetType}
                        onSelectionChange={(val) => setTargetType(val)}
                        sx={{ minWidth: 50 }}
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
                <Box sx={{ textAlign: 'center' }}>
                    <Button variant="contained" fullWidth onClick={handleUpdate} sx={{ width: '250px', height: '45px', fontSize: '16', borderRadius: '20px' }}>
                        글 수정
                    </Button>
                </Box>
            </Paper>
        </Box>
    );
}
