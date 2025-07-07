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
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";

export default function ProjectChannelCommonPage() {
  const [posts, setPosts] = useState([]);
  const navigate = useNavigate();
  const { project_id } = useParams();
  console.log("프로젝트 id:"+project_id);
  const BASE_URL = "http://127.0.0.1:8000";

  const fetchPosts = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${BASE_URL}/admin/project/common/${project_id}`, {
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
return (
  <Box sx={{ flex: 1, p: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h5" fontWeight="bold">
            💬 HUMANMAKEHUB
          </Typography>
          <IconButton color="primary" onClick={() => navigate(`/project/${project_id}/common/write`)}>
            <CreateIcon />
          </IconButton>
        </Stack>

        {/* 📃 게시글 리스트 */}
        <Box mt={2}>
          {posts.map((post) => (
            <Paper
              key={post.channel_id}
              sx={{ p: 2, mb: 2, borderRadius: 2, border: "1px solid #ddd" }}
              onClick={() => navigate(`/project/${project_id}/common/${post.channel_id}`)}
            >
              <Typography variant="subtitle1" fontWeight="bold">
                {post.title}
              </Typography>
              <Typography variant="body2" sx={{ color: "gray" }}>
                {post.content.length > 100 ? post.content.slice(0, 100) + "..." : post.content}
              </Typography>
              <Stack direction="row" justifyContent="space-between" mt={1}>
                <Chip label={post.nickname} size="small" />
                <Typography variant="caption" sx={{ color: "gray" }}>
                  {new Date(post.create_dt).toLocaleDateString("ko-KR")}
                </Typography>
              </Stack>
            </Paper>
          ))}
        </Box>
      </Box>
  );
}
