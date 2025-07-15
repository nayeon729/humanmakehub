import React, { useState, useEffect } from "react";
import {
    Box, Typography, Paper,
    Chip, Stack,
} from "@mui/material";
import axios from "../common/axiosInstance"
import { useNavigate, useParams } from "react-router-dom";
import Notice from "../assets/notice.png";


export default function MemberNoticeViewPage() {
    const { noticeId } = useParams();
    const [notice, setNotice] = useState([]);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [userRole, setUserRole] = useState("");
    const BASE_URL = "http://127.0.0.1:8000";
    const navigate = useNavigate();

    useEffect(() => {
        const role = sessionStorage.getItem("role");
        setUserRole(role);
    }, []);
    useEffect(() => {
        fetchNotice(noticeId);
    }, []);

    const fetchNotice = async (notice_id) => {
        try {
            const token = sessionStorage.getItem("token");
            const res = await axios.get(`${BASE_URL}/member/notices/${notice_id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setNotice(res.data);
        } catch (error) {
            console.error("공지 불러오기 실패", error);
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
                    <img src={Notice} alt="공지사항" width={40} height={40} style={{ verticalAlign: "middle", marginRight: 8 }} />
                    공지사항
                </Typography>

                <Paper sx={{ p: 3, pt: 0, borderRadius: 2 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                        <Box display="flex" direction="row">
                            <Chip
                                label={noticeTypeMap[notice.target_type] || notice.target_type}
                                color="primary"
                                sx={{ mt: 3, mr: 1 }}
                            />
                            <Typography variant="h5" fontWeight="bold" gutterBottom sx={{ mt: 3 }}>
                                {notice.title}
                            </Typography>
                        </Box>
                        <Box mt={1}>
                            <Typography variant="caption" color="text.secondary">
                                {notice.create_dt?.slice(0, 10).replace(/-/g, ".")}
                            </Typography>
                        </Box>
                    </Stack>
                    <hr style={{ border: "none", height: "1px", backgroundColor: "#ccc", opacity: 0.5 }} />
                    <Typography variant="body1" mt={2} sx={{ whiteSpace: "pre-line" }}>
                        {notice.content}
                    </Typography>
                </Paper>

            </Box>

        </>
    );
}