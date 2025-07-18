import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useOutletContext } from "react-router-dom";
import axios from "../common/axiosInstance"
import {
  Box,
  Typography,
  Paper,
  Stack,
  Avatar,
  Divider,
  IconButton,
  Button,
  Chip,
  TextField,
} from "@mui/material";
import CreateIcon from "@mui/icons-material/Create";
import add from "../assets/create.png"
import { useAlert } from "../components/CommonAlert";
import ImageIcon from '@mui/icons-material/Image';


export default function ProjectChannelMemberPage() {
  const { project_id, user_id } = useParams();
  const [messages, setMessages] = useState([]);
  const [pmId, setPmId] = useState("");
  const [myUserId, setMyUserId] = useState("");
  const [projectTitle, setProjectTitle] = useState("");
  const navigate = useNavigate();
  const [teamMemberId, setTeamMemberId] = useState("");

  const BASE_URL = process.env.REACT_APP_API_URL;

  const context = useOutletContext() || {};
  const setIsChecked = context.setIsChecked || (() => { });
  const { showAlert } = useAlert();

  useEffect(() => {
    const id = sessionStorage.getItem("user_id");
    if (id) {
      setMyUserId(id);
    }
  }, []);

  const fetchMessages = async () => {
    try {
      const token = sessionStorage.getItem("token");
      const res = await axios.get(
        `${BASE_URL}/admin/project/${project_id}/user/${user_id}/${teamMemberId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setMessages(res.data.items);
      setPmId(res.data.pm_id);
      console.log("응답 확인 👉", res.data);
    } catch (err) {
      console.error("게시글 불러오기 실패", err);
    }
  };

  useEffect(() => {
    if (!teamMemberId) return; // 값 없으면 무시
    fetchMessages();
  }, [teamMemberId])

  useEffect(() => {
    const getTeamMemberId = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/common/teamMemberId/${project_id}/${user_id}`, {
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem("token")}`,
          },
        });
        console.log("project_id", project_id);
        console.log("userId", user_id);
        console.log("res", res.data.team_member_id);
        console.log("type", typeof (res.data.team_member_id));
        setTeamMemberId(res.data.team_member_id);
      } catch (err) {
        console.error("프로젝트 팀멤버아이디 조회 실패", err);
      }
    }
    getTeamMemberId();
  }, [project_id, user_id]);

  console.log("pmId", pmId)
  messages.map((msg) => {
    console.log("user_id:", msg.user_id, "pmId:", pmId);
    return null;
  });
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



  useEffect(() => {
    if (messages != []) {
      const messagesCheck = async () => {
        try {
          const token = sessionStorage.getItem("token");
          await axios.post(`${BASE_URL}/common/alertsCheck`, {
            user_id: user_id,
            teamMemberId: teamMemberId,
          }, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          console.log("알람체크 성공");
          setIsChecked(true);
        } catch (error) {
          console.error("알람체크 실패", error);
        }
      }
      messagesCheck();
    }
  }, [messages, user_id])

  return (
    <Box sx={{ flex: 1, p: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h5" fontWeight="bold">
          💬 {projectTitle}
        </Typography>
        <IconButton color="primary" onClick={() => navigate(`/admin/channel/${project_id}/create/${user_id}`)}>
          <img src={add} style={{ width: '40px', hight: '40px' }} />
        </IconButton>
      </Stack>


      <Stack spacing={2} mt={2}>
        {messages.map((msg) => (
          <Paper key={msg.channel_id} sx={{ p: 2 }} onClick={() => navigate(`/admin/channel/${project_id}/view/${msg.channel_id}`)}>
            <Box display='flex' flexDirection="row" alignItems="center">
              <Chip
                color={msg.create_id === pmId ? "primary" : "warning"}
                label={msg.create_id === pmId ? "PM" : msg.nickname}
              />
              <Box display='flex' flexDirection='row' justifyContent='space-between' width="100%">
                <Stack direction="row" alignItems="center">
                  <Typography variant="subtitle1" fontWeight="bold" ml={1}>
                    {msg.title}
                  </Typography>
                  {Number(msg.has_image) === 1 && (
                    <ImageIcon sx={{ fontSize: 18, color: '#999', ml: '3px', pb: '5px' }} />
                  )}
                </Stack>
                <Typography variant="caption" sx={{ color: "gray" }}>
                  {msg.create_dt?.slice(0, 10).replace(/-/g, '.')}
                </Typography>
              </Box>
            </Box>

            <Typography variant="body2" color="text.secondary" mt={2}>
              {msg.content}
            </Typography>
          </Paper>
        ))}
      </Stack>
    </Box>
  );
};

