import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  TextField,
  Typography,
  Stack,
  InputAdornment,
  Paper
} from "@mui/material";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import Combo from "../components/Combo"; // 공통코드용 Combo 컴포넌트

const BASE_URL = "http://127.0.0.1:8000";

export default function AdminProjectUpdatePage() {
  const { project_id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    projectName: "",
    projectType: "",
    projectContent: "",
    estimatedDuration: "",
    budget: "",
    ugencyLevel: "",
    user_id: "",
  });

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${BASE_URL}/admin/projects/${project_id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        const data = res.data;
        setFormData({
          projectName: data.title,
          projectType: data.category,
          projectContent: data.description,
          estimatedDuration: data.estimated_duration,
          budget: data.budget,
          ugencyLevel: data.urgency,
          user_id: data.client_id,
        });
      } catch (err) {
        console.error("프로젝트 불러오기 실패", err);
      }
    };
    fetchProject();
  }, [project_id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    try {
      const token = localStorage.getItem("token");
      const cleanedFormData = {
        ...formData,
        estimatedDuration: String(formData.estimatedDuration).replace(/[^0-9]/g, ""),
        budget: String(formData.budget).replace(/[^0-9]/g, ""),
      };

      await axios.put(`${BASE_URL}/admin/projects/${project_id}/update`, {
        title: cleanedFormData.projectName,
        description: cleanedFormData.projectContent,
        content: cleanedFormData.projectContent,
        category: cleanedFormData.projectType,
        estimated_duration: cleanedFormData.estimatedDuration,
        budget: cleanedFormData.budget,
        urgency: cleanedFormData.ugencyLevel,
        client_id: cleanedFormData.user_id,
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert("프로젝트가 성공적으로 수정되었습니다!");
      navigate("/admin/projects/all");
    } catch (err) {
      console.error("수정 실패", err);
      alert("수정 중 오류 발생");
    }
  };

  return (
    <Box sx={{ display: "block", justifyContent: "center", py: 4 }}>
      <Typography variant="h5" mb={2}>프로젝트 수정</Typography>
      <Paper sx={{ p: 4, width: 600 }}>
        <Stack spacing={3}>
          <Typography variant="h6">1. 프로젝트 기본 정보</Typography>
          <TextField
            label="프로젝트 이름"
            name="projectName"
            value={formData.projectName}
            onChange={handleChange}
            fullWidth
            required
          />

          <Combo
            groupId="PROJECT_TYPE"
            defaultValue={formData.projectType}
            onSelectionChange={(val) => setFormData((prev) => ({ ...prev, projectType: val }))}
          />

          <Typography variant="h6">2. 설명</Typography>
          <TextField
            label="프로젝트 설명"
            name="projectContent"
            value={formData.projectContent}
            onChange={handleChange}
            fullWidth
            multiline
            minRows={3}
            required
          />

          <Typography variant="h6">3. 예산과 기간</Typography>
          <TextField
            label="예상 기간"
            name="estimatedDuration"
            value={formData.estimatedDuration}
            onChange={handleChange}
            fullWidth
            InputProps={{ endAdornment: <InputAdornment position="end">일</InputAdornment> }}
          />

          <TextField
            label="예상 금액"
            name="budget"
            value={formData.budget}
            onChange={handleChange}
            fullWidth
            InputProps={{ endAdornment: <InputAdornment position="end">원</InputAdornment> }}
          />

          <Typography variant="h6">4. 클라이언트 ID 및 긴급도</Typography>
          <TextField
            label="클라이언트 ID"
            name="user_id"
            value={formData.user_id}
            onChange={handleChange}
            fullWidth
            required
          />

          <Combo
            groupId="URGENCY_LEVEL"
            defaultValue={formData.ugencyLevel}
            onSelectionChange={(val) => setFormData((prev) => ({ ...prev, ugencyLevel: val }))}
          />

          <Box sx={{ display: "flex", justifyContent: "center" }}>
            <Button variant="contained" onClick={handleSubmit}>수정 완료</Button>
          </Box>
        </Stack>
      </Paper>
    </Box>
  );
}
