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
            setUserId(data.create_id);
            setContent(data.content);

            const existingImgs = (res.data.images || []).map(img => ({
                type: "existing",
                file_id: img.file_id,
                previewUrl: img.previewUrl || img.file_path || img.image_url,
            }));
            setImages(existingImgs);
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
        const formData = new FormData();
        formData.append("title", title);
        formData.append("content", content);
        formData.append("pm_id", pmId);
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
            await axios.put(`${BASE_URL}/member/projectchannel/${channel_id}/update`, formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "multipart/form-data"
                },
            });
            showAlert("✅ 글이 수정되었습니다.");
            const role = sessionStorage.getItem("userRole");
            if (role === "R03" || role === "R04") {
                navigate(`/admin/channel/${project_id}/pm/${userId}`);
            } else {
                navigate(`/member/channel/${project_id}/pm/${userId}`);
            }
        } catch (error) {
            console.error("❌ 글 수정 실패", error);
            showAlert("글 수정에 실패했습니다.");
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
