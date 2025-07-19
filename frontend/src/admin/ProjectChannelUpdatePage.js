import React, { useState, useEffect } from "react";
import {
    Box, TextField, Typography, Button, MenuItem, Paper, FormControl, Select, Stack
} from "@mui/material";
import axios from "../common/axiosInstance"
import { useNavigate, useParams } from "react-router-dom";
import Combo from "../components/Combo";
import { useAlert } from "../components/CommonAlert";
import Tooltip from "@mui/material/Tooltip";
import SmsIcon from '@mui/icons-material/Sms';

export default function ProjectChannelUpdatePage() {
    const { channel_id, project_id } = useParams();
    const [title, setTitle] = useState("");
    const [userId, setUserId] = useState("");
    const [content, setContent] = useState("");
    const [members, setMembers] = useState([]);
    const [pmId, setPmId] = useState("");
    const [projectTitle, setProjectTitle] = useState("");
    const [existingImages, setExistingImages] = useState([]);
    const [images, setImages] = useState([]);
    const [previewUrls, setPreviewUrls] = useState([]);
    const [deletedImageIds, setDeletedImageIds] = useState([]);

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
            const res = await axios.get(`${BASE_URL}/admin/projectchannel/${channel_id}/view`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            const data = res.data.channel;
            setTitle(data.title);
            setUserId(data.user_id);
            setContent(data.content);

            // 이미지 세팅
            const existingImgs = (res.data.images || []).map(img => ({
                type: "existing",
                file_id: img.file_id,
                previewUrl: img.previewUrl || img.file_path || img.image_url,
            }));
            setImages(existingImgs);
        } catch (error) {
            console.error("글+이미지 불러오기 실패", error);
        }
    }

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
        const formData = new FormData();
        formData.append("title", title);
        formData.append("user_id", userId);
        formData.append("content", content);
        // 삭제된 기존 이미지 id
        deletedImageIds.forEach(id => {
            formData.append("delete_ids", id);  // FastAPI에서는 List[str]로 받기
        });

        // 새 이미지 추가
        images.forEach(img => {
            if (img.type === "new") {
                formData.append("files", img.file);
            }
        });
        try {
            const token = sessionStorage.getItem("token");
            await axios.put(`${BASE_URL}/admin/projectchannel/${channel_id}/update`, formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "multipart/form-data"
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

    const handleDeleteExistingImage = (file_id) => {
        setExistingImages(prev => prev.filter(img => img.file_id !== file_id));
        setDeletedImageIds(prev => [...prev, file_id]);
    };

    const handleImageChange = (e) => {
        const files = Array.from(e.target.files);
        const imageFiles = files.filter(file => file.type.startsWith("image/"));

        if (imageFiles.length !== files.length) {
            alert("❌ 이미지 파일만 첨부할 수 있어요!");
            return;
        }

        const newItems = imageFiles.map(file => ({
            type: "new",
            file,
            previewUrl: URL.createObjectURL(file)
        }));

        setImages(prev => [...prev, ...newItems]);
        setPreviewUrls(prev => [...prev, ...imageFiles.map(file => URL.createObjectURL(file))]);
    };

    const handleDeleteImage = (index) => {
        const img = images[index];

        // 기존 이미지면 삭제 리스트에 추가
        if (img.type === "existing" && img.file_id) {
            setDeletedImageIds(prev => [...prev, img.file_id]);
        }

        // 이미지 리스트에서 제거
        setImages(prev => prev.filter((_, i) => i !== index));
    };
    return (
        <Box sx={{ p: 2 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box sx={{ display: "flex", alignItems: "center" }}>
                    <Tooltip
                        title={
                            <Typography sx={{ fontSize: 16, color: "#fff" }}>
                                This little budf is <b>really cute</b> 🐤
                            </Typography>
                        }
                        placement="right"
                        arrow
                    >
                        <Box sx={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
                            <SmsIcon sx={{ fontSize: "40px", mr: "4px" }} />
                            <Typography
                                variant="h4"
                                fontWeight="bold"
                                gutterBottom
                                sx={{ mb: 0, cursor: "help", }}
                            >
                                {projectTitle}글 수정
                            </Typography>
                        </Box>
                    </Tooltip>
                </Box>
            </Stack>
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
                    <Typography variant="body2">이미지 첨부</Typography>
                    <label htmlFor="file-upload" style={{
                        display: "inline-block",
                        padding: "10px 20px",
                        backgroundColor: "#FFB43B",
                        color: "#fff",
                        borderRadius: "15px",
                        cursor: "pointer",
                        fontWeight: "bold",
                        fontSize: "14px",
                        transition: "background-color 0.3s"
                    }}>
                        이미지 선택하기
                        <input
                            id="file-upload"
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={handleImageChange}
                            style={{ display: "none" }}
                        />
                    </label>
                    <Box sx={{ display: "flex", gap: 2, mt: 2, flexWrap: "wrap" }}>
                        {images.map((img, index) => (
                            <Box key={index} sx={{ position: "relative" }}>
                                <img
                                    src={img.previewUrl}
                                    alt={`img-${index}`}
                                    width={120}
                                    height={120}
                                    style={{ objectFit: "cover", borderRadius: "8px" }}
                                />
                                <Button
                                    size="small"
                                    color="error"
                                    onClick={() => handleDeleteImage(index)}
                                    sx={{
                                        position: "absolute",
                                        top: 0,
                                        right: 0,
                                        minWidth: "24px",
                                        padding: "0px 6px",
                                        fontSize: "0.7rem",
                                        fontWeight: "900",
                                        borderRadius: "0 8px 0 8px",
                                    }}
                                >
                                    ✕
                                </Button>
                            </Box>
                        ))}
                    </Box>
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
                    <Button variant="contained" fullWidth onClick={() => handleUpdate(channel_id)} sx={{ height: '45px', width: '250px', fontSize: '16px', borderRadius: '20px' }}>
                        글 수정
                    </Button>
                </Box>
            </Paper>
        </Box>
    );
}
