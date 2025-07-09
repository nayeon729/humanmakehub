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
  const [myUserId, setMyUserId] = useState("");
  const [projectTitle, setProjectTitle] = useState("");
  console.log("프로젝트 id:" + project_id);
  const BASE_URL = "http://127.0.0.1:8000";

  useEffect(() => {
    const id = localStorage.getItem("user_id");
    if (id) setMyUserId(id);
  }, []);
  const fetchPosts = async () => {
    try {
      const token = localStorage.getItem("token");
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
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        setProjectTitle(res.data.title);
      } catch (err) {
        console.error("프로젝트 제목 불러오기 실패", err);
      }
    };

    fetchProjectTitle();
  }, [project_id]);

  const handleDelete = async (channel_id) => {
    const confirmed = window.confirm("정말 삭제하시겠습니까?");
    if (!confirmed) return;
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${BASE_URL}/member/projectchannel/${channel_id}/delete`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchPosts();
      alert("✅ 프로젝트가 삭제(표시)되었습니다.")
    } catch (error) {
      console.error("❌ 프로젝트 삭제 실패", error);
      alert("❌ 프로젝트 삭제에 실패했습니다.");
    }
  };

  return (
    <Box sx={{ flex: 1, p: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h5" fontWeight="bold">
          💬 {projectTitle}
        </Typography>
        {/* <IconButton color="primary" onClick={() => navigate(`/member/channel/${project_id}/create`)}>
          <CreateIcon />
        </IconButton> */}
      </Stack>

      {/* 📃 게시글 리스트 */}
      <Box mt={2}>
        {posts.map((post) => (
          <Paper
            key={post.channel_id}
            sx={{ p: 2, mb: 2, borderRadius: 2, border: "1px solid #ddd" }}
          >
            {/* <Chip label={post.nickname} size="small" /> */}
            <Typography variant="subtitle1" fontWeight="bold">
              {post.title}
            </Typography>
            <Typography variant="body2" sx={{ color: "gray" }}>
              {post.content.length > 100 ? post.content.slice(0, 100) + "..." : post.content}
            </Typography>
            <Stack direction="row" justifyContent="space-between" mt={1}>

              <Typography variant="caption" sx={{ color: "gray" }}>
                {new Date(post.create_dt).toLocaleDateString("ko-KR")}
              </Typography>
            </Stack>
            {/* {post.create_id === myUserId && (
                          <Stack direction="row" spacing={1} mt={1}>
                            <Button onClick={() => navigate(`/member/channel/${project_id}/update/${post.channel_id}`)}>
                              수정
                            </Button>
                            <Button onClick={() => handleDelete(post.channel_id)}>
                              삭제
                            </Button>
                          </Stack>
                        )} */}
          </Paper>
        ))}
      </Box>
    </Box>
  );
}
