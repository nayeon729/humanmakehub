import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  Divider,
  IconButton,
  Stack,
  Paper,
  Chip,
  Button,
} from "@mui/material";
import CreateIcon from "@mui/icons-material/Create";
import axios from "../common/axiosInstance"
import { useNavigate, useParams } from "react-router-dom";
import add from "../assets/create.png"
import { useAlert } from "../components/CommonAlert";
import ImageIcon from '@mui/icons-material/Image';

export default function ProjectChannelCommonPage() {
  const [posts, setPosts] = useState([]);
  const navigate = useNavigate();
  const { project_id } = useParams();
  const [myUserId, setMyUserId] = useState("");
  const [projectTitle, setProjectTitle] = useState("");
  console.log("프로젝트 id:" + project_id);
  const BASE_URL = process.env.REACT_APP_API_URL;
  const { showAlert } = useAlert();

  useEffect(() => {
    const id = sessionStorage.getItem("user_id");
    if (id) setMyUserId(id);
  }, []);
  const fetchPosts = async () => {
    try {
      const token = sessionStorage.getItem("token");
      const res = await axios.get(`${BASE_URL}/admin/project/common/${project_id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("공통 채널 게시글 :", res.data.items);
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


  return (
    <Box sx={{ flex: 1, p: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h5" fontWeight="bold">
          💬 {projectTitle}
        </Typography>
        <IconButton color="primary" onClick={() => navigate(`/admin/channel/${project_id}/create/${myUserId}`)}>
          <img src={add} style={{ width: '40px', hight: '40px' }} />
        </IconButton>
      </Stack>

      {/* 📃 게시글 리스트 */}
      <Box mt={2}>
        {posts.map((post) => (
          <Paper
            key={post.channel_id}
            sx={{ p: 2, mb: 2, borderRadius: 2, border: "1px solid #ddd" }}
            onClick={() => navigate(`/admin/channel/${project_id}/view/${post.channel_id}`)}
          >
            {/* <Chip label={post.nickname} size="small" /> */}
            <Box display='flex' flexDirection='row' justifyContent='space-between'>
              <Typography variant="subtitle1" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center' }}>
                {post.title}
                {Number(post.has_image) === 1 && (
                  <ImageIcon sx={{ fontSize: 18, color: '#999', ml: '3px', pb: '5px' }} />
                )}
              </Typography>
              <Typography variant="caption" sx={{ color: "gray" }}>
                {post.create_dt?.slice(0, 10).replace(/-/g, '.')}
              </Typography>
            </Box>
            {/* <Typography variant="body2" sx={{ color: "gray" }}>
              {post.content}
            </Typography> */}
            <Typography variant="body2" sx={{ color: "gray" }}>
              {post.content.length > 100 ? post.content.slice(0, 100) + "..." : post.content}
            </Typography>


            <Stack direction="row" justifyContent="space-between" mt={1}>

            </Stack>
          </Paper>
        ))}
      </Box>
    </Box>
  );
}
