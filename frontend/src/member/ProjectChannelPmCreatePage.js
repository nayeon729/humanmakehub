import React, { useState, useEffect } from "react";
import {
  Box, TextField, Typography, Button, MenuItem, Paper, FormControl, InputLabel, Select, Stack
} from "@mui/material";
import axios from "../common/axiosInstance"
import { useNavigate, useParams } from "react-router-dom";
import chatting from "../assets/chatting.png";
import { useAlert } from "../components/CommonAlert";
import Tooltip from "@mui/material/Tooltip";
import TextsmsOutlinedIcon from '@mui/icons-material/TextsmsOutlined';
import HelpIcon from '@mui/icons-material/Help';

export default function ProjectChannelCreatePage() {
  const [title, setTitle] = useState("");
  const [userId, setUserId] = useState("");
  const [content, setContent] = useState("");
  const [members, setMembers] = useState([]);
  const [pmId, setPmId] = useState("");
  const [teamMemberId, setTeamMemberId] = useState("");
  const [projectTitle, setProjectTitle] = useState("");
  const { project_id } = useParams();
  const navigate = useNavigate();
  const { showAlert } = useAlert();
  const [images, setImages] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);

  const BASE_URL = process.env.REACT_APP_API_URL; // 서버 주소





  const handleSubmit = async () => {
    if (!title || !content) {
      showAlert("모든 필수 항목을 입력해주세요.");
      return;
    }
     if (images.length > 5) {
    showAlert("❌ 이미지는 최대 5개까지만 첨부할 수 있어요!");
    return;
  }
    const formData = new FormData();
    formData.append("title", title);
    formData.append("content", content);
    formData.append("pm_id", pmId);
    formData.append("teamMemberId", parseInt(teamMemberId));


    images.forEach((img) => {
      formData.append("files", img);
    });
    try {
      const token = sessionStorage.getItem("token");
      await axios.post(`${BASE_URL}/member/projectchannel/${project_id}/create`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      showAlert("글이 등록되었습니다.");
      navigate(`/member/channel/${project_id}/pm/${userId}`); // 공지사항 목록 페이지로 이동
    } catch (error) {
      console.error("글 등록 실패", error);
      showAlert("글 등록 중 오류가 발생했습니다.");
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
        setUserId(sessionStorage.getItem("user_id"));
      } catch (err) {
        console.error("프로젝트 제목 불러오기 실패", err);
      }
    };

    fetchProjectTitle();
  }, [project_id]);

  useEffect(() => {
    if (userId != "") {
      const getTeamMemberId = async () => {
        try {
          const res = await axios.get(`${BASE_URL}/common/teamMemberId/${project_id}/${userId}`, {
            headers: {
              Authorization: `Bearer ${sessionStorage.getItem("token")}`,
            },
          });
          setTeamMemberId(res.data.team_member_id);
        } catch (err) {
          console.error("프로젝트 팀멤버아이디 조회 실패", err);
        }
      }
      getTeamMemberId();
    }
  }, [project_id, userId]);

  useEffect(() => {
    if (!teamMemberId) return; // 값 없으면 무시
    fetchMessages();
  }, [teamMemberId])


  const fetchMessages = async () => {
    try {
      const token = sessionStorage.getItem("token");
      const res = await axios.get(
        `${BASE_URL}/member/project/${project_id}/user/${userId}/${teamMemberId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setPmId(res.data.pm_id);
    } catch (err) {
      console.error("pm_id 불러오기 실패", err);
    }
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    const imageFiles = selectedFiles.filter(file => file.type.startsWith("image/"));

    if (imageFiles.length !== selectedFiles.length) {
      showAlert("❌ 이미지 파일만 첨부할 수 있어요!");
    }
    // 기존 이미지 + 새로 선택한 이미지 합치기
    const updatedFiles = [...images, ...selectedFiles];
    setImages(updatedFiles);

    const newPreviews = selectedFiles.map(file => URL.createObjectURL(file));
    setPreviewUrls(prev => [...prev, ...newPreviews]);
  };
  const handleRemoveImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setPreviewUrls((prev) => prev.filter((_, i) => i !== index));
  };


  return (
    <Box sx={{ p: 2, pt: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Stack sx={{ display: 'flex', flexDirection: 'row' }}>
          <Typography
            variant="h4"
            fontWeight="bold"
            gutterBottom
            sx={{ mb: 0 }}
          >
            {projectTitle} 글 작성
          </Typography>
          <Tooltip
            title={
              <Typography sx={{ fontSize: 13, color: "#fff" }}>
                PM과 소통하는 글을 작성하는 페이지입니다!
              </Typography>
            }
            placement="right"
            arrow
          >
            <HelpIcon sx={{ fontSize: 22, mt: "2px", mr: "4px" }} />
          </Tooltip>
        </Stack>
      </Stack>

      <Paper sx={{ p: 3, mt: 2 }}>
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2">
            제목*
          </Typography>
          <TextField
            fullWidth
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            sx={{ mb: 2 }}
          />
        </Box>
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="body2">이미지 첨부</Typography>

            <label htmlFor="file-upload" style={{
              display: "inline-block",
              padding: "0px 10px",
              backgroundColor: "#FFB43B",
              color: "#fff",
              borderRadius: "15px",
              cursor: "pointer",
              fontWeight: "900",
              fontSize: "14px",
              transition: "background-color 0.3s",
              width: '10px',
              marginLeft: '5px',
            }}>
              +
              <input
                id="file-upload"
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileChange}
                style={{ display: "none" }}
              />
            </label>
          </Box>
          <Box sx={{ display: "flex", gap: 2, mt: 2, flexWrap: "wrap" }}>
            {previewUrls.map((url, index) => (
              <Box key={index} sx={{ position: "relative" }}>
                <img
                  src={url}
                  alt="preview"
                  width="120"
                  height="120"
                  style={{ objectFit: "cover", borderRadius: "8px" }}
                />
                <Button
                  size="small"
                  color="error"
                  onClick={() => handleRemoveImage(index)}
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
            sx={{ mb: 2 }}
          />
        </Box>
        <Box sx={{ textAlign: 'center' }}>
          <Button variant="contained" fullWidth onClick={handleSubmit}
            sx={{ height: '45px', width: '250px', fontSize: '16px', borderRadius: '20px' }}>
            글 등록
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}
