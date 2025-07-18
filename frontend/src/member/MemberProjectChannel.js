// 프로젝트 채널 공용
import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Stack,
  Paper,
} from "@mui/material";
import axios from "../common/axiosInstance"
import { useNavigate, useParams } from "react-router-dom";
import chatting from "../assets/chatting.png";
import ImageIcon from '@mui/icons-material/Image';

export default function MemberProjectChannel() {
  const [posts, setPosts] = useState([]);
  const navigate = useNavigate();
  const { project_id } = useParams();
  const [myUserId, setMyUserId] = useState("");
  const [projectTitle, setProjectTitle] = useState("");
  console.log("프로젝트 id:" + project_id);
  const BASE_URL = process.env.REACT_APP_API_URL;

  useEffect(() => {
    const id = sessionStorage.getItem("user_id");
    if (id) setMyUserId(id);
  }, []);
  const fetchPosts = async () => {
    try {
      const token = sessionStorage.getItem("token");
      const res = await axios.get(`${BASE_URL}/member/project/common/${project_id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPosts(res.data.items);
    } catch (error) {
      console.error("공통 채널 게시글 불러오기 실패", error);
    }
  };

  useEffect(() => {
    if (project_id) fetchPosts();
  }, [project_id]);

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


  return (
    <Box sx={{ flex: 1, p: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          <img src={chatting} alt="채팅" width={40} height={40} style={{ verticalAlign: "middle", marginRight: 8 }} />
          {projectTitle}
        </Typography>
      </Stack>

      {/* 📃 게시글 리스트 */}
      <Box mt={2}>
        {posts.map((post) => (
          <Paper
            key={post.channel_id}
            sx={{
              backgroundColor: "#fff",
              p: 1.5,
              mt: 2,
              borderRadius: 2,
              position: "relative",
              boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
            }}
            onClick={() => navigate(`/member/channel/${project_id}/view/${post.channel_id}`)}
          >
            {/* <Chip label={post.nickname} size="small" /> */}
            <Typography variant="subtitle1" fontWeight="bold"
              sx={{
                fontSize: "25px",
              }}>
              {post.title}
              {Number(post.has_image) === 1 && (
                  <ImageIcon sx={{ fontSize: 18, color: '#999', ml: '3px', pb: '5px' }} />
                )}
            </Typography>
            <Typography variant="body2"
              sx={{
                color: "black",
                mt: 0.5,
                whiteSpace: "pre-line",
              }}>
              {post.content.length > 100 ? post.content.slice(0, 100) + "..." : post.content}
            </Typography>
            <Stack direction="row" justifyContent="space-between" mt={1}>

              <Typography variant="caption"
                sx={{
                  position: "absolute",
                  top: 8,
                  right: 12,
                  color: "black",
                  fontSize: "0.75rem",
                }}>
                {post.create_dt.slice(0, 10).replace(/-/g, ".")}
              </Typography>
            </Stack>
          </Paper>
        ))}
      </Box>
    </Box>
  );
}
