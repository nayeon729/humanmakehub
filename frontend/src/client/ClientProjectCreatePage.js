// src/pages/client/ProjectCreatePage.js
import React, { useState } from "react";
import {
  Box, Typography, TextField, Button, Paper, Container, CircularProgress, MenuItem, Divider
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function ProjectCreatePage() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("IT 개발");
  const [estimatedDuration, setEstimatedDuration] = useState("");
  const [budget, setBudget] = useState("");
  const [urgency, setUrgency] = useState("보통");
  const [loading, setLoading] = useState(false);

  const BASE_URL = "http://localhost:8000";

  const handleCreateProject = async () => {
    if (!title.trim() || !description.trim() || !estimatedDuration || !budget) {
      alert("필수 항목을 모두 입력해주세요.");
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `${BASE_URL}/client/projects`,
        {
          title,
          description,
          category,
          estimated_duration: parseInt(estimatedDuration),
          budget: parseInt(budget),
          urgency
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("✅ 프로젝트 등록이 완료되었습니다!");
      navigate("/client/dashboard");
    } catch (error) {
      console.error("프로젝트 등록 실패", error);
      alert("등록 실패: " + (error.response?.data?.detail || "서버 오류"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 8 }}>
      <Paper sx={{ p: 5, borderRadius: 3, boxShadow: 5 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          🎯 새 프로젝트 등록
        </Typography>

        <Divider sx={{ my: 3 }} />

        {/* 프로젝트 기본 정보 */}
        <Typography variant="h6" fontWeight="bold" gutterBottom>
          1️⃣ 프로젝트 기본 정보를 입력해주세요
        </Typography>

        <TextField
          fullWidth
          label="프로젝트 제목 (예: 쇼핑몰 구축)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          margin="normal"
          required
        />

        <TextField
          fullWidth
          select
          label="프로젝트 카테고리"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          margin="normal"
          required
        >
          {["IT 개발", "디자인", "마케팅", "컨설팅", "번역/통역", "영상/편집"].map((option) => (
            <MenuItem key={option} value={option}>
              {option}
            </MenuItem>
          ))}
        </TextField>

        {/* 프로젝트 상세 설명 */}
        <Typography variant="h6" fontWeight="bold" mt={5} gutterBottom>
          2️⃣ 프로젝트에 대해 구체적으로 설명해주세요
        </Typography>

        <TextField
          fullWidth
          label="상세 설명 (예: 어떤 기능이 필요한지, 목표는 무엇인지)"
          multiline
          rows={6}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          margin="normal"
          required
        />

        {/* 예산 및 기간 */}
        <Typography variant="h6" fontWeight="bold" mt={5} gutterBottom>
          3️⃣ 예산과 예상 기간을 알려주세요
        </Typography>

        <TextField
          fullWidth
          label="예상 기간 (일)"
          value={estimatedDuration}
          onChange={(e) => setEstimatedDuration(e.target.value)}
          margin="normal"
          required
          type="number"
        />

        <TextField
          fullWidth
          label="예상 예산 (원)"
          value={budget}
          onChange={(e) => setBudget(e.target.value)}
          margin="normal"
          required
          type="number"
        />

        {/* 긴급도 선택 */}
        <TextField
          fullWidth
          select
          label="긴급도"
          value={urgency}
          onChange={(e) => setUrgency(e.target.value)}
          margin="normal"
          required
        >
          <MenuItem value="높음">높음</MenuItem>
          <MenuItem value="보통">보통</MenuItem>
          <MenuItem value="낮음">낮음</MenuItem>
        </TextField>

        {/* 등록 버튼 */}
        <Button
          variant="contained"
          color="primary"
          fullWidth
          sx={{ mt: 5 }}
          size="large"
          onClick={handleCreateProject}
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} color="inherit" /> : "🚀 프로젝트 등록하기"}
        </Button>
      </Paper>
    </Container>
  );
}
