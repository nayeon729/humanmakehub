import React, { useState } from "react";
import {
    Box, TextField, Typography, Button, MenuItem, Paper
} from "@mui/material";
import axios from "../common/axiosInstance"
import { useNavigate } from "react-router-dom";
import Combo from "../components/Combo";
import { useAlert } from "../components/CommonAlert";
import CampaignIcon from '@mui/icons-material/Campaign';
import Tooltip from "@mui/material/Tooltip";

export default function AdminNoticeCreatePage() {
    const [title, setTitle] = useState("");
    const [targetType, setTargetType] = useState("");
    const [content, setContent] = useState("");
    const navigate = useNavigate();
    const { showAlert } = useAlert();

    const BASE_URL = process.env.REACT_APP_API_URL; // 서버 주소

    const handleSubmit = async () => {
        if (!title || !targetType || !content) {
            showAlert("모든 필수 항목을 입력해주세요.");
            return;
        }

        try {
            const token = sessionStorage.getItem("token");
            await axios.post(`${BASE_URL}/admin/notices`, {
                title,
                target_type: targetType,
                content,
            }, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            showAlert("공지사항이 등록되었습니다.");
            navigate("/admin/notice/list"); // 공지사항 목록 페이지로 이동
        } catch (error) {
            console.error("공지사항 등록 실패", error);
            showAlert("공지사항 등록 중 오류가 발생했습니다.");
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
                        <CampaignIcon color='error' sx={{ fontSize: 40, mr: "4px"}} />
                        <Typography
                            variant="h4"
                            fontWeight="bold"
                            gutterBottom
                            sx={{ mb: 0, cursor: "help", }}
                        >
                            공지 사항 작성
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
                    <Button variant="contained" fullWidth onClick={handleSubmit} sx={{ width: '250px', height: '45px', fontSize: '16px', borderRadius: '20px' }}>
                        글 등록
                    </Button>
                </Box>
            </Paper>
        </Box>
    );
}
