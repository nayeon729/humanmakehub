import React, { useState, useEffect } from "react";
import {
    Box, Typography, Paper, LinearProgress, Select, MenuItem,
    Slider, Grid, Chip, Stack, Button, Dialog, DialogTitle,
    DialogContent, DialogContentText, DialogActions,
} from "@mui/material";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import Combo from "../components/Combo";


export default function AdminNoticeViewPage() {
    const { noticeId } = useParams();
    const [notice, setNotice] = useState([]);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const BASE_URL = "http://127.0.0.1:8000";
    const navigate = useNavigate();

    useEffect(() => {
        fetchNotice(noticeId);
    }, []);

    const fetchNotice = async (notice_id) => {
        try {
            const token = localStorage.getItem("token");
            const res = await axios.get(`${BASE_URL}/admin/notices/${notice_id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setNotice(res.data);
        } catch (error) {
            console.error("공지 불러오기 실패", error);
        }
    };

    const handleDeleteNotice = async (notice_id) => {
        try {
            const token = localStorage.getItem("token");
            await axios.delete(`${BASE_URL}/admin/notices/${notice_id}/delete`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchNotice();
            setDeleteDialogOpen(false);
            alert("✅ 공지가 삭제(표시)되었습니다.")
            navigate("/admin/notice/list");
        } catch (error) {
            console.error("❌ 공지 삭제 실패", error);
            alert("❌ 공지 삭제에 실패했습니다.");

        }
    };

    const noticeTypeMap = {
        N01: "공지",
        N02: "점검"
    }


    return (
        <>
            <Box sx={{ p: 3 }}>
                <Typography variant="h4" fontWeight="bold" gutterBottom>
                    📢 공지사항
                </Typography>

                <Paper sx={{ p: 3, pt: 0, borderRadius: 2 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                        <Box display="flex" direction="row">
                        <Chip
                            label={noticeTypeMap[notice.target_type] || notice.target_type}
                            color="primary"
                            sx={{mt: 3, mr:1}}
                        />
                        <Typography variant="h5" fontWeight="bold" gutterBottom sx={{mt: 3}}>
                            {notice.title}
                        </Typography>
                        </Box>
                        <Box>
                            <Box mt={2} sx={{ display: "flex", flex: '1', flexDirection: "row"}}>
                                <button
                                    style={{ background: "none", width: '35px', border: 'none', padding: '0px', color: 'blue' }}
                                    onClick={() => navigate(`/`)}
                                >
                                    수정
                                </button>
                                <button
                                    style={{ background: "none", width: '35px', border: 'none', padding: '0px', color: 'red' }}
                                    onClick={() => setDeleteDialogOpen(true)}
                                >
                                    삭제
                                </button>
                            </Box>
                            <Box mt={1}>
                            <Typography variant="caption" color="text.secondary">
                                {notice.create_dt?.slice(0, 10)}
                            </Typography>
                            </Box>
                        </Box>
                    </Stack>
                    <hr style={{ border: "none", height: "1px", backgroundColor: "#ccc", opacity: 0.5 }} />
                    <Typography variant="body1" mt={2} sx={{ whiteSpace: "pre-line" }}>
                        {notice.content}
                    </Typography>
                </Paper>
                <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
                    <DialogTitle>공지 삭제 확인</DialogTitle>
                    <DialogContent>
                        <DialogContentText>
                            정말로 이 공지를 삭제하시겠습니까?
                        </DialogContentText>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setDeleteDialogOpen(false)}>취소</Button>
                        <Button onClick={() => handleDeleteNotice(notice.notice_id)} color="error" variant="contained">
                            삭제 확인
                        </Button>
                    </DialogActions>
                </Dialog>
            </Box>

        </>
    );
}