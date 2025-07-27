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
import Tooltip from "@mui/material/Tooltip";
import TextsmsOutlinedIcon from '@mui/icons-material/TextsmsOutlined';
import Pagination from "@mui/material/Pagination";
import HelpIcon from '@mui/icons-material/Help';

export default function ProjectChannelMemberPage() {
  const { project_id, user_id } = useParams();
  const [messages, setMessages] = useState([]);
  const [pmId, setPmId] = useState("");
  const [myUserId, setMyUserId] = useState("");
  const [projectTitle, setProjectTitle] = useState("");
  const navigate = useNavigate();
  const [teamMemberId, setTeamMemberId] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 10;
  const BASE_URL = process.env.REACT_APP_API_URL;

  const context = useOutletContext() || {};
  const setIsChecked = context.setIsChecked || (() => { });
  const { showAlert } = useAlert();
  const [pmCheck, setPmCheck] = useState(false);

  useEffect(() => {
    const id = sessionStorage.getItem("user_id");
    if (id) {
      setMyUserId(id);
    }

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

  const fetchMessages = async (page = 1) => {
    try {
      const token = sessionStorage.getItem("token");
      const res = await axios.get(
        `${BASE_URL}/admin/project/${project_id}/user/${user_id}/${teamMemberId}`,
        {
          params: {
            page,
            page_size: pageSize
          },
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setMessages(res.data.items);
      setPmId(res.data.pm_id);
      setTotalCount(res.data.total);
      setCurrentPage(page);
    } catch (err) {
      console.error("게시글 불러오기 실패", err);
    }
  };

  useEffect(() => {
    if (!teamMemberId) return; // 값 없으면 무시
    fetchMessages(currentPage);
  }, [teamMemberId, currentPage])

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

  messages.map((msg) => {
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
          setIsChecked(true);
        } catch (error) {
          console.error("알람체크 실패", error);
        }
      }
      messagesCheck();
    }
  }, [messages, user_id])

  return (
    <Box sx={{ p: 2, pt: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Stack sx={{ display: 'flex', flexDirection: 'row' }}>
            <Typography
              variant="h4"
              fontWeight="bold"
              gutterBottom
              sx={{ mb: 0}}
            >
              {projectTitle}
            </Typography>
            <Tooltip
              title={
                <Typography sx={{ fontSize: 13, color: "#fff" }}>
                  PM과 팀원의 일대일로 소통할 수 있는 채널입니다!
                </Typography>
              }
              placement="right"
              arrow
            >
              <HelpIcon sx={{ fontSize: 22, mt: "2px", mr: "4px" }} />
            </Tooltip>
          </Stack>
        </Stack>
        {pmCheck && (
          <IconButton color="primary" onClick={() => navigate(`/admin/channel/${project_id}/create/${user_id}`)}>
            <img src={add} style={{ width: '30px', hight: '30px' }} />
          </IconButton>
        )}
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
                  {Number(msg.has_image) > 0 && (
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

