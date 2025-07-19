import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  LinearProgress,
  Chip,
  Stack,
  IconButton,
} from "@mui/material";
import CreateIcon from "@mui/icons-material/Create";
import { useNavigate } from "react-router-dom";
import axios from "../common/axiosInstance"
import Tooltip from "@mui/material/Tooltip";

const MemberProjectList = () => {
  const navigate = useNavigate();
  const [myUserId, setMyUserId] = useState("");
  const [portfolio, setPortfolio] = useState([]);
  const [loading, setLoading] = useState(true);

  const BASE_URL = process.env.REACT_APP_API_URL;

  const getValidLink = (url) => {
    if (!url) return "";
    return url.startsWith("http://") || url.startsWith("https://")
      ? url
      : `https://${url}`;
  };

  useEffect(() => {
    const id = sessionStorage.getItem("user_id");
    if (id) setMyUserId(id);

    getPortfolio();
  }, []);

  const getPortfolio = () => {
    axios.get(`${BASE_URL}/user/portfoliotest`)
      .then(res => {
        console.log("res", res);
        console.log("res.data", res.data);
        setPortfolio(res?.data?.portfolios || []);
        setLoading(false);
      })
      .catch(err => {
        console.error("포트폴리오목록 불러오기 실패", err);
        setLoading(false);
      });
  }


  const handleDelete = (portfolio_id) => {
    const confirmDelete = window.confirm("정말 이 포트폴리오를 삭제하시겠습니까?");
    if (!confirmDelete) return; // ❌ 아니오 누르면 중단

    const token = sessionStorage.getItem("token");
    axios.post(`${BASE_URL}/admin/portfolioDelete/${portfolio_id}`, {}, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => {
        console.log("res", res);
        console.log("res.data", res.data);
        getPortfolio();
      })
      .catch(err => {
        console.error(`${portfolio_id}아이디 포트폴리오 삭제 실패`, err);
        setLoading(false);
      });
  }

  if (loading) return <Typography variant="h6">로딩 중...</Typography>;

  return (
    <Box sx={{ flex: 1, p: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <Tooltip
            title={
              <Typography sx={{ fontSize: 16, color: "#fff" }}>
                This little budf is <b>really cute</b> 🐤
              </Typography>
            }
            placement="right"
            arrow
          >
            {/* <Box sx={{ display: "flex", alignItems: "center", cursor: "pointer" }}> */}
              <Typography
                variant="h4"
                fontWeight="bold"
                gutterBottom
                sx={{ mb: 0, cursor: "help", }}
              >
                포트폴리오 목록
              </Typography>
            {/* </Box> */}
          </Tooltip>
        </Box>
        <IconButton color="primary" onClick={() => navigate("/admin/portfolioCreate")}>
          <CreateIcon />
        </IconButton>
      </Stack>

      {/* 📃 게시글 리스트 */}
      <Box mt={2}>
        {portfolio.map((post) => (
          <Paper
            key={post.portfolio_id}
            sx={{ p: 2, mb: 2, borderRadius: 2, border: "1px solid #ddd" }}
          >
            <Typography variant="subtitle1" fontWeight="bold">
              {post.title}
            </Typography>
            <Typography variant="body2" sx={{ color: "gray" }}>
              {post.content.length > 100 ? post.content.slice(0, 100) + "..." : post.content}
            </Typography>
            <div style={{
              display: "flex",
              gap: 8,
              flexWrap: "wrap",
              marginBottom: 8
            }}>
              {post?.tags && (
                <>
                  {post.tags.map((tag, i) => (
                    <span
                      key={i}
                      style={{
                        fontSize: "clamp(11px, 2.3vw, 12px)",
                        backgroundColor: "#e3f2fd",
                        color: "#1976d2",
                        padding: "4px 10px",
                        borderRadius: 20
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </>
              )}
            </div>
            <div style={{
              fontSize: "clamp(13px, 2.4vw, 14px)",
              color: "#222",
              fontWeight: 600
            }}>
              {post.estimated_dt} · {post.budget}
            </div>

            {post.link && (
              <Typography
                component="a"
                href={getValidLink(post.link)}
                target="_blank"
                rel="noopener noreferrer"
                sx={{
                  mt: 1,
                  display: "inline-block",
                  color: "#1976d2",
                  textDecoration: "underline",
                  fontSize: 14,
                  wordBreak: "break-all"
                }}
              >
                {getValidLink(post.link)}
              </Typography>

            )}


            <Stack direction="row" justifyContent="space-between" mt={1}>
              <Typography variant="caption" sx={{ color: "gray" }}>
                {new Date(post.create_dt).toLocaleDateString("ko-KR")}
              </Typography>
            </Stack>
            {post.create_id === myUserId && (
              <Stack direction="row" spacing={1} mt={1}>
                <Button onClick={() => navigate(`/admin/portfolioUpdate/${post.portfolio_id}`)}>
                  수정
                </Button>
                <Button onClick={() => handleDelete(post.portfolio_id)}>
                  삭제
                </Button>
              </Stack>
            )}
          </Paper>
        ))}
      </Box>
    </Box>
  );
};

export default MemberProjectList;
