import React, { useState } from "react";
import {
    Box, TextField, Typography, Button, MenuItem, Paper
} from "@mui/material";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Combo from "../components/Combo";

export default function AdminNoticeCreatePage() {
    const [title, setTitle] = useState("");
    const [targetType, setTargetType] = useState("");
    const [content, setContent] = useState("");
    const navigate = useNavigate();

    const BASE_URL = "http://127.0.0.1:8000"; // 서버 주소

    const handleSubmit = async () => {
        if (!title || !targetType || !content) {
            alert("모든 필수 항목을 입력해주세요.");
            return;
        }

        try {
            const token = localStorage.getItem("token");
            await axios.post(`${BASE_URL}/admin/notices`, {
                title,
                target_type:targetType,
                content,
            }, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            alert("공지사항이 등록되었습니다.");
            navigate("/admin/notice/list"); // 공지사항 목록 페이지로 이동
        } catch (error) {
            console.error("공지사항 등록 실패", error);
            alert("공지사항 등록 중 오류가 발생했습니다.");
        }
    };

    return (
        <Box sx={{ maxWidth: 600, mx: "auto", mt: 5 }}>
            <Typography variant="h5" gutterBottom fontWeight="bold">
                📢 공지 사항 작성
            </Typography>

            <Paper sx={{ p: 3, mt: 2 }}>
                <Box sx={{mb: 2}}>
                <Typography variant="body2">제목</Typography>
                <TextField
                    fullWidth
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    sx={{ mb: 2 }}
                />
                </Box>
                <Box sx={{mb: 5}}>
                    <Typography variant="body2">분류</Typography>
                    <Combo
                        groupId="NOTICE_TYPE"
                        value={targetType}
                        defaultValue={targetType}
                        onSelectionChange={(val) => setTargetType(val)}
                        sx={{ minWidth: 50 }}
                    />
                </Box>
                <Box sx={{mb: 2}}>
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
