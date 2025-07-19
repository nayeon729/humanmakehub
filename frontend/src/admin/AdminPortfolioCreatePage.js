import React, { useState, useEffect } from "react";
import { Box, Typography, Button, TextField, Container, Paper, InputAdornment, Checkbox, Chip, Stack, FormControlLabel } from "@mui/material";
import { useNavigate } from "react-router-dom";
import axios from "../common/axiosInstance"
import { useAlert } from "../components/CommonAlert";


export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: "", content: "", estimated_dt: "", budget: "", link: "", linkPublic: false,
  });
  const [techStacks, setTechStacks] = useState({});
  const [selectedTechs, setSelectedTechs] = useState([]);

  const BASE_URL = process.env.REACT_APP_API_URL;
  const token = sessionStorage.getItem("token");
  const { showAlert } = useAlert();
  const [portfolioError, setPortfolioError] = useState(false);
  const isValidHostname = (hostname) => {
    // 숫자만 (ex: 652165165) → ❌
    if (/^[0-9]+$/.test(hostname)) return false;

    // 점(.)이 없음 → ❌ (ex: "localhost"도 거름)
    if (!hostname.includes(".")) return false;

    // IPv4 주소 (0~255 범위 숫자들) → ❌
    if (/^(\d{1,3}\.){3}\d{1,3}$/.test(hostname)) return false;

    // 여기를 통과하면 도메인처럼 생긴 걸로 판단 → ✅
    return true;
  };

  const normalizeLink = (url) => {
    if (!url || typeof url !== "string") return "";

    const trimmed = url.trim();

    try {
      const parsed = new URL(trimmed);
      if (!isValidHostname(parsed.hostname)) return ""; // 유효하지 않으면 거름
      return parsed.href;
    } catch (e) {
      const fixed = `https://${trimmed}`;
      try {
        const parsed = new URL(fixed);
        if (!isValidHostname(parsed.hostname)) return "";
        return parsed.href;
      } catch {
        return "";
      }
    }
  };

  useEffect(() => {
    axios.get(`${BASE_URL}/user/tech-stacks`)
      .then(res => {
        setTechStacks(res.data);
        console.log("res.data", res.data);
      })
      .catch(err => {
        console.error("기술 스택 불러오기 실패", err);
      });
  }, []);

  const handleFormChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const toggleTech = (tech) => {
    setSelectedTechs((prev) => {
      const exists = prev.some((t) => t.code_id === tech.code_id);
      if (exists) {
        return prev.filter((t) => t.code_id !== tech.code_id);
      } else {
        return [...prev, tech];
      }
    });
  };


  const handleSubmit = async () => {
    const normalizedLink = normalizeLink(form.link);
    if (form.link && !normalizedLink) {
      return showAlert("올바른 URL 형식으로 입력해주세요.");
    }

    try {
      if (!form.title) {
        return showAlert("제목을 입력해주세요");
      }
      if (!form.content) {
        return showAlert("내용을 입력해주세요.");
      }
      if (!form.estimated_dt) {
        return showAlert("예상기간을 입력해주세요.");
      }
      if (!form.budget) {
        return showAlert("예상금액을 입력해주세요.");
      }
      const payload = {
        title: form.title,
        content: form.content,
        estimated_dt: form.estimated_dt + "개월",
        budget: form.budget + "만원",
        link: normalizedLink,
        checking: form.linkPublic,
        skills: selectedTechs.map((tech) => ({
          code_id: tech.code_id,
          code_name: tech.label,
          parent_code: tech.parent_code,
        }))
      };

      await axios.post(`${BASE_URL}/admin/portfolioCreate`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      showAlert("포트폴리오 작성완료!");
      navigate("/admin/portfolioList");
    } catch (error) {
      console.error("포트폴리오 작성실패", error);
      showAlert("포트폴리오 작성실패: " + (error.response?.data?.detail || "서버 오류"));
    }
  };

  return (
    <Box sx={{ background: "#f0f4f8", py: 8 }}>
      <Container maxWidth="md">
        <Paper sx={{ p: 4, borderRadius: 4, boxShadow: 5 }}>
          <>
            <Typography variant="h5" align="center" fontWeight="bold">포트폴리오 작성</Typography>
            <Stack spacing={2} mt={3} mb={2}>
              <TextField
                fullWidth
                label="제목"
                name="title"
                value={form.title}
                onChange={handleFormChange}
              />

              <TextField
                fullWidth
                label="내용"
                name="content"
                value={form.content}
                onChange={handleFormChange}
              />

              <TextField
                fullWidth
                label="예상기간"
                name="estimated_dt"
                value={form.estimated_dt}
                onChange={handleFormChange}
                InputProps={{
                  endAdornment: <InputAdornment position="end">개월</InputAdornment>,
                }}
              />

              <TextField
                fullWidth
                label="예상예산"
                name="budget"
                value={form.budget}
                onChange={handleFormChange}
                InputProps={{
                  endAdornment: <InputAdornment position="end">만원</InputAdornment>,
                }}
              />

              <Stack direction="row" spacing={1}>
                <TextField
                  fullWidth
                  label="포트폴리오 URL"
                  value={form.link}
                  error={portfolioError}
                  helperText={
                    portfolioError ? "올바른 URL 형식으로 입력해주세요." : ""
                  }
                  placeholder="ex) www.yourportfolio.com"
                  onChange={(e) => {
                    const val = e.target.value;
                    const normalized = normalizeLink(val);

                    setForm({ ...form, link: val });

                    // 유효하지 않은 경우에만 에러 표시
                    setPortfolioError(val !== "" && normalized === "");
                  }}
                />
                <FormControlLabel
                sx={{ width: "13%" }}
                  control={
                    <Checkbox
                      checked={form.linkPublic || false}
                      onChange={(e) =>
                        setForm({ ...form, linkPublic: e.target.checked })
                      }
                    />
                  }
                  label="포트폴리오 링크 공개"
                />

              </Stack>

            </Stack>
            {Object.entries(techStacks).map(([category, techs]) => (
              <Box key={category} sx={{ border: "1px solid #ddd", borderRadius: 2, p: 2 }}>
                <Typography variant="subtitle1" fontWeight="bold" mb={1}>{category}</Typography>
                <Stack direction="row" gap={1} flexWrap="wrap">
                  {techs.map((tech) => (
                    <Chip key={tech.code_id} label={tech.label} clickable color={selectedTechs.some((t) => t.code_id === tech.code_id) ? "primary" : "default"} onClick={() => toggleTech(tech)} />
                  ))}
                </Stack>
              </Box>
            ))}
            <Button variant="contained" size="large" onClick={handleSubmit}>
              작성 완료
            </Button>
          </>
        </Paper>
      </Container>
    </Box>
  );
}
