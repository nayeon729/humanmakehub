import React, { useState, useEffect } from "react";
import {
    Box, Typography, Paper, Stack, Button, Dialog, DialogTitle,
    DialogContent, DialogContentText, DialogActions,
} from "@mui/material";
import axios from "../common/axiosInstance"
import { useNavigate, useParams } from "react-router-dom";
import { useAlert } from "../components/CommonAlert";


export default function ProjectChannelViewPage() {
    const { project_id, channel_id } = useParams();
    console.log("🧭 useParams channel_id:", channel_id);
    const [myUserId, setMyUserId] = useState("");
    const [channel, setChannel] = useState([]);
    const [images, setImages] = useState([]);
    const [projectTitle, setProjectTitle] = useState("");
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const { showAlert } = useAlert();
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
    useEffect(() => {
        const id = sessionStorage.getItem("user_id");
        if (id) {
            setMyUserId(id);
        }
    }, []);
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
    const handleDelete = async (channel_id) => {
        const confirmed = window.confirm("정말 삭제하시겠습니까?");
        if (!confirmed) return;
        try {
            const token = sessionStorage.getItem("token");
            await axios.delete(`${BASE_URL}/admin/projectchannel/${channel_id}/delete`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchMessages();
            showAlert("✅ 프로젝트가 삭제(표시)되었습니다.")
        } catch (error) {
            console.error("❌ 프로젝트 삭제 실패", error);
            showAlert("❌ 프로젝트 삭제에 실패했습니다.");
        }
    };


    return (
        <>
            <Box sx={{ p: 2 }}>
                <Typography variant="h4" fontWeight="bold" gutterBottom>
                    💬 {projectTitle}
                </Typography>

                <Paper sx={{ p: 3, pt: 0, borderRadius: 2 }}>
                    
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Box>
                        <Typography variant="h5" fontWeight="bold" gutterBottom sx={{ mt: 3 }}>
                            {channel.title}
                        </Typography>
                        </Box>
                        <Box>
                            {channel.create_id === myUserId && (
                                <Box mt={5} sx={{ display: "flex", flexDirection: "row", mr:'-5px' }}>
                                    <Button
                                        sx={{ color: '#1976d2', fontSize: '12px', minWidth: '20px' }}
                                        onClick={() => navigate(`/admin/channel/${project_id}/update/${channel.channel_id}`)}>
                                        수정
                                    </Button>
                                    <Button
                                        sx={{ color: '#d32f2f', fontSize: '12px', minWidth: '20px' }}
                                        onClick={() => handleDelete(channel.channel_id)}>
                                        삭제
                                    </Button>
                                </Box>
                            )}
                            </Box>
                    </Stack>
                    <hr style={{ border: "none", height: "1px", backgroundColor: "#ccc", opacity: 0.5 }} />
                    <Box sx={{display:'flex', justifyContent:'end'}}>
                    <Typography variant="caption" color="text.secondary">
                        {channel.create_dt?.slice(0, 10).replace(/-/g, ".")}
                    </Typography>
                    </Box>
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
                                                width: '100%',

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
                
            </Box>

        </>
    );
}