import React, { useState, useEffect } from "react";
import {
    Box, Typography, Paper, LinearProgress, Select, MenuItem,
    Slider, Grid, Chip, Stack, Button, Dialog, DialogTitle,
    DialogContent, DialogContentText, DialogActions,
} from "@mui/material";
import axios from "../common/axiosInstance"
import { useNavigate, useParams } from "react-router-dom";
import Combo from "../components/Combo";


export default function ProjectChannelViewPage() {
    const { project_id, channel_id } = useParams();
    console.log("🧭 useParams channel_id:", channel_id);
    const [channel, setChannel] = useState([]);
    const [images, setImages] = useState([]);
    const [projectTitle, setProjectTitle] = useState("");
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const BASE_URL = process.env.REACT_APP_API_URL;
    const navigate = useNavigate();

    useEffect(() => {
        fetchChannel(channel_id);
    }, [channel_id]);
    useEffect(() => {
        if (project_id) {
            fetchProjectTitle(project_id);
        }
    }, [project_id]);
    const fetchChannel = async (channelId) => {
        try {
            const token = sessionStorage.getItem("token");
            const res = await axios.get(`${BASE_URL}/admin/projectchannel/${channelId}/view`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setProjectTitle(res.data.project_title);
            setChannel(res.data.channel);
            setImages(res.data.images);
            console.log("pjtitle:", res.data.Project_title);
            console.log("✅ 요청 받은 channel_id:", channel_id);
            console.log("📦 channel:", res.data.channel);
            console.log("🖼 images:", res.data.images);
        } catch (error) {
            console.error("채널 불러오기 실패", error);
        }
    };
    const fetchProjectTitle = async (projectId) => {
        try {
            const token = sessionStorage.getItem("token");
            const res = await axios.get(`${BASE_URL}/admin/project/${projectId}/projecttitle`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setProjectTitle(res.data.title);
        } catch (err) {
            console.error("❌ 프로젝트 제목 가져오기 실패:", err);
        }
    };
    const handleDeleteNotice = async (notice_id) => {
        try {
            const token = sessionStorage.getItem("token");
            await axios.delete(`${BASE_URL}/admin/notices/${notice_id}/delete`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchNotice();
            setDeleteDialogOpen(false);
            alert("✅ 공지가 삭제(표시)되었습니다.")
            navigate("/notice/list");
        } catch (error) {
            console.error("❌ 공지 삭제 실패", error);
            alert("❌ 공지 삭제에 실패했습니다.");

        }
    };


    return (
        <>
            <Box sx={{ p: 2 }}>
                <Typography variant="h4" fontWeight="bold" gutterBottom>
                    💬 {projectTitle}
                </Typography>

                <Paper sx={{ p: 3, pt: 0, borderRadius: 2 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                        <Box display="flex" direction="row">
                            <Typography variant="h5" fontWeight="bold" gutterBottom sx={{ mt: 3 }}>
                                {channel.title}
                            </Typography>
                        </Box>
                    </Stack>
                    <hr style={{ border: "none", height: "1px", backgroundColor: "#ccc", opacity: 0.5 }} />
                    <Box mt={3}>
                        {images.length > 0 && (
                            <>
                                {/* <Typography variant="subtitle1" fontWeight="bold">첨부 이미지</Typography> */}
                                <Stack direction="row" spacing={2} flexWrap="wrap">
                                    {images.map((img, idx) => (
                                        <img
                                            key={idx}
                                            src={img.file_path.replace("C:/Users/admin/uploads", `${BASE_URL}/static`)}
                                            alt={`file-${idx}`}
                                            style={{
                                                width:'100%',

                                                borderRadius: "8px",
                                                // objectFit: "cover"
                                                //이미지를 찌그러뜨리지 않고, 잘라서라도 꽉 채우고 싶을 때
                                            }}
                                        />
                                    ))}
                                </Stack>
                            </>
                        )}
                    </Box>
                    <Typography variant="body1" mt={2} sx={{ whiteSpace: "pre-line" }}>
                        {channel.content}
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