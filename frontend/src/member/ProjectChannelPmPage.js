import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useOutletContext } from "react-router-dom";
import axios from "axios";
import {
  Box,
  Typography,
  Paper,
  Stack,
  Avatar,
  Divider,
  IconButton,
  Button,
  Chip
} from "@mui/material";
import chatting from "../assets/chatting.png";
import create from "../assets/create.png";

export default function ProjectChannelPmPage() {
  const { project_id, user_id } = useParams();
  const [messages, setMessages] = useState([]);
  const [pmId, setPmId] = useState("");
  const [myUserId, setMyUserId] = useState("");
  const [projectTitle, setProjectTitle] = useState("");
  const navigate = useNavigate();
  const [teamMemberId, setTeamMemberId] = useState("");
  const BASE_URL = process.env.REACT_APP_API_URL;
  const context = useOutletContext() || {};
  const setIsChecked = context.setIsChecked || (() => {}); // 이 부분!

  useEffect(() => {
    const id = localStorage.getItem("user_id");
    if (id) {
      setMyUserId(id);
    }
  }, []);
  const fetchMessages = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(
        `${BASE_URL}/member/project/${project_id}/user/${user_id}/${teamMemberId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setMessages(res.data?.items ?? []);
      setPmId(res.data.pm_id);
      console.log("응답 확인 👉", res.data);
    } catch (err) {
      console.error("게시글 불러오기 실패", err);
    }
  };

  useEffect(() => {
    if(messages != []) {
      const messagesCheck = async () => {
          try {
            const token = localStorage.getItem("token");
            await axios.post(`${BASE_URL}/common/alertsCheck`, {
              user_id: pmId,
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
  },[messages, pmId])

  useEffect(() => {
    if (!teamMemberId) return; // 값 없으면 무시
    fetchMessages();
  },[teamMemberId])

  useEffect(() => {
    const getTeamMemberId = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/common/teamMemberId/${project_id}/${user_id}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        console.log("project_id" , project_id);
        console.log("userId", user_id);
        console.log("res", res.data.team_member_id);
        console.log("type", typeof(res.data.team_member_id));
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
      fetchMessages();
      alert("✅ 프로젝트가 삭제(표시)되었습니다.")
    } catch (error) {
      console.error("❌ 프로젝트 삭제 실패", error);
      alert("❌ 프로젝트 삭제에 실패했습니다.");
    }
  };

  return (
    <Box sx={{ flex: 1, p: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          <img src={chatting} alt="채팅" width={40} height={40} style={{ verticalAlign: "middle", marginRight: 8 }} />
          {projectTitle}
        </Typography>
        <IconButton
          onClick={() => navigate(`/member/channel/${project_id}/create`)}
          sx={{ p: 0.5 }}
        >
          <img
            src={create} alt="글쓰기" width={40} height={40} style={{ verticalAlign: "middle", marginRight: 8 }} />
        </IconButton>
      </Stack>

      <Stack spacing={2}>
        {messages.map((msg) => (
          <Paper key={msg.channel_id}
            sx={{
              backgroundColor: "#fff",
              p: 1.5,
              mt: 2,
              borderRadius: 2,
              position: "relative",
              boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
            }}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Chip
                color={msg.create_id === pmId ? "primary" : "warning"}
                label={msg.create_id === pmId ? "PM" : msg.nickname}
              />
              <Typography mt={1} sx={{ fontSize: '24px', fontWeight: '700' }}>
                {msg.title}
                </Typography>
              <Typography variant="body2" color="text.secondary"
                sx={{
                  position: "absolute",
                  top: 8,
                  right: 12,
                  color: "black",
                  fontSize: "0.75rem",
                }}>
                {msg.create_dt.slice(0, 10).replace(/-/g, ".")}
              </Typography>
            </Stack>

            <Typography variant="body2"
              sx={{
                color: "black",
                mt: 0.5,
                whiteSpace: "pre-line",
              }}>
              {msg.content}
            </Typography>
            {msg.create_id === myUserId && (
              <Stack direction="row" spacing={1} mt={1}
                sx={{
                  position: "absolute",
                  bottom: 8,
                  right: 12,
                }}>
                <Button onClick={() => navigate(`/member/channel/${project_id}/update/${msg.channel_id}`)}>
                  수정
                </Button>
                <Button onClick={() => handleDelete(msg.channel_id)}
                  sx={{
                    color: "red",
                  }}>
                  삭제
                </Button>
              </Stack>
            )}
          </Paper>
        ))}
      </Stack>
    </Box>
  );
};

