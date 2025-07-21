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
import Tooltip from "@mui/material/Tooltip";
import SmsIcon from '@mui/icons-material/Sms';
import Pagination from "@mui/material/Pagination";

export default function ProjectChannelCommonPage() {
  const [posts, setPosts] = useState([]);
  const navigate = useNavigate();
  const { project_id } = useParams();
  const [myUserId, setMyUserId] = useState("");
  const [projectTitle, setProjectTitle] = useState("");
  const BASE_URL = process.env.REACT_APP_API_URL;
  const { showAlert } = useAlert();
  const [pmCheck, setPmCheck] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 7;

  useEffect(() => {
    const fetchPmCheck = async () => {
      const id = sessionStorage.getItem("user_id");
      if (id) setMyUserId(id);

      try {
        const token = sessionStorage.getItem("token");
        const user_id = sessionStorage.getItem("user_id");
        const res = await axios.get(`${BASE_URL}/admin/project/pmCheck/${project_id}/${user_id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setPmCheck(res.data.pmCheck);
      } catch (error) {
        console.error("PM확인 실패", error);
      }
    };

    fetchPmCheck(); // 내부에서 호출
  }, []);
  const fetchPosts = async (page = 1) => {
    try {
      const token = sessionStorage.getItem("token");
      const res = await axios.get(`${BASE_URL}/admin/project/common/${project_id}`, {
        params: {
          page: page,
          page_size: pageSize
        },
        headers: { Authorization: `Bearer ${token}` },
      });
      setPosts(res.data.items);
      setTotalCount(res.data.total);
      setCurrentPage(page);
    } catch (error) {
      console.error("공통 채널 게시글 불러오기 실패", error);
    }
  };

  useEffect(() => {
    if (project_id) fetchPosts(currentPage);
  }, [project_id, currentPage]);

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
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <Tooltip
            title={
              <Typography sx={{ fontSize: 13, color: "#fff" }}>
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
                {projectTitle}
              </Typography>
            </Box>
          </Tooltip>
        </Box>
        {pmCheck && (
          <IconButton
            color="primary"
            onClick={() => navigate(`/admin/channel/${project_id}/create/${myUserId}`)}
          >
            <img src={add} style={{ width: '40px', height: '40px' }} />
          </IconButton>
        )}
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
      <Box display="flex" justifyContent="center" mt={3}>
        <Pagination
          count={Math.ceil(totalCount / pageSize)}
          page={currentPage}
          onChange={(e, value) => fetchPosts(value)}
          shape="rounded"
          color="primary"
          siblingCount={1}
          boundaryCount={1}
        />
      </Box>
    </Box>
  );
}
