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
  Chip
} from "@mui/material";
import chatting from "../assets/chatting.png";
import create from "../assets/create.png";
import { useAlert } from "../components/CommonAlert";
import ImageIcon from '@mui/icons-material/Image';
import Tooltip from "@mui/material/Tooltip";
import SmsIcon from '@mui/icons-material/Sms';
import Pagination from "@mui/material/Pagination";

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
  const setIsChecked = context.setIsChecked || (() => { }); // 이 부분!
  const { showAlert } = useAlert();
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 7;


  useEffect(() => {
    const id = sessionStorage.getItem("user_id");
    if (id) {
      setMyUserId(id);
    }
  }, []);
  const fetchMessages = async (page = 1) => {
    try {
      const token = sessionStorage.getItem("token");
      const res = await axios.get(
        `${BASE_URL}/member/project/${project_id}/user/${user_id}/${teamMemberId}`,
        {
          params: { page, page_size: pageSize },
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setMessages(res.data?.items ?? []);
      setPmId(res.data.pm_id);
      setTotalCount(res.data.total);
      setCurrentPage(page);
    } catch (err) {
      console.error("게시글 불러오기 실패", err);
    }
  };

  useEffect(() => {
    if (messages != []) {
      const messagesCheck = async () => {
        try {
          const token = sessionStorage.getItem("token");
          await axios.post(`${BASE_URL}/common/alertsCheck`, {
            user_id: pmId,
            teamMemberId: teamMemberId,
          }, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          setIsChecked(true);
        } catch (error) {
          console.error("알람체크 실패", error);
        }
      }
      messagesCheck();
    }
  }, [messages, pmId])

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

  const handleDelete = async (channel_id) => {
    const confirmed = window.confirm("정말 삭제하시겠습니까?");
    if (!confirmed) return;
    try {
      const token = sessionStorage.getItem("token");
      await axios.delete(`${BASE_URL}/member/projectchannel/${channel_id}/delete`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchMessages();
      showAlert("✅ 프로젝트가 삭제(표시)되었습니다.")
    } catch (error) {
      console.error("❌ 프로젝트 삭제 실패", error);
      showAlert("❌ 프로젝트 삭제에 실패했습니다.");
    }
  };

  return (
    <Box sx={{ p: 2, pt: 3 }}>
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
              {/* <img src={chatting} alt="채팅" width={40} height={40} style={{ verticalAlign: "middle", marginRight: 8 }} /> */}
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
            }}
            onClick={() => navigate(`/member/channel/${project_id}/view/${msg.channel_id}`)}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Chip
                color={msg.create_id === pmId ? "primary" : "warning"}
                label={msg.create_id === pmId ? "PM" : msg.nickname}
              />
              <Typography mt={1} sx={{ fontSize: '24px', fontWeight: '700' }}>
                {msg.title}
              </Typography>
              {Number(msg.has_image) > 0 && (
                <ImageIcon sx={{ fontSize: 18, color: '#999', ml: '3px', pb: '5px' }} />
              )}
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
          </Paper>
        ))}
      </Stack>
      <Box display="flex" justifyContent="center" mt={3}>
        <Pagination
          count={Math.ceil(totalCount / pageSize)}
          page={currentPage}
          onChange={(e, value) => fetchMessages(value)}
          shape="rounded"
          color="primary"
          siblingCount={1}
          boundaryCount={1}
        />
      </Box>
    </Box>
  );
};

