import React, { useState } from "react";
import { Box, Button, TextField, Typography, Stack, InputAdornment, Paper } from "@mui/material";
import axios from "axios";
import Combo from "../components/Combo";  // 공통코드용 Combo 컴포넌트
import { useNavigate } from "react-router-dom";

const BASE_URL = process.env.REACT_APP_API_URL;

export default function AdminProjectCreatePage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    projectName: "",
    projectType: "",
    projectContent: "",
    estimatedDuration: "",
    budget: "",
    urgencyLevel: "",
    user_id: "", // ✅ 클라이언트 ID 입력 받기
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    try {
      const token = localStorage.getItem("token");

      const cleanedFormData = {
        ...formData,
        estimatedDuration: formData.estimatedDuration.replace(/[^0-9]/g, ""),
        budget: formData.budget.replace(/[^0-9]/g, ""),
      };

      const response = await axios.post(`${BASE_URL}/admin/projects`, cleanedFormData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      alert("프로젝트가 성공적으로 등록되었습니다!");
      console.log(response.data);
      navigate("/admin/projects/all");
    } catch (err) {
      console.error("프로젝트 등록 실패", err);
      alert("등록 중 오류가 발생했습니다.");
    }
  };

  return (
    <Box sx={{ display: "block", justifyContent: "center", py: 4 }}>
      <Typography variant="h5" mb={2}>관리자 프로젝트 생성</Typography>
      <Paper sx={{ p: 4, width: 600 }}>
        <Stack spacing={3}>
          {/* 1. 기본 정보 */}
          <Typography variant="h6">1. 프로젝트 기본 정보를 입력해주세요.</Typography>
          <TextField
            label="프로젝트 이름"
            name="projectName"
            value={formData.projectName}
            onChange={handleChange}
            fullWidth
            required
          />

          {/* 프로젝트 유형 */}
          <Combo
            groupId="PROJECT_TYPE"
            defaultValue=""
            onSelectionChange={(val) => setFormData((prev) => ({ ...prev, projectType: val }))}
          />

          {/* 2. 설명 */}
          <Typography variant="h6">2. 프로젝트에 대해 설명해주세요.</Typography>
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

          {/* 3. 기간 & 금액 */}
          <Typography variant="h6">3. 예산과 기간</Typography>
          <TextField
            label="예상 기간"
            name="estimatedDuration"
            value={formData.estimatedDuration}
            onChange={handleChange}
            fullWidth
            InputProps={{
              endAdornment: <InputAdornment position="end">일</InputAdornment>,
            }}
          />

          <TextField
            label="예상 금액"
            name="budget"
            value={formData.budget}
            onChange={handleChange}
            fullWidth
            InputProps={{
              endAdornment: <InputAdornment position="end">원</InputAdornment>,
            }}
          />

          {/* 4. 긴급도 */}
          <Typography variant="h6">4. 의뢰한 클라이언트 ID와 프로젝트 긴급도</Typography>

          
          {/* 클라이언트 ID 입력 */}
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
            defaultValue=""
            onSelectionChange={(val) => setFormData((prev) => ({ ...prev, urgencyLevel: val }))}
          />

          {/* 5. 제출 */}
          <Box sx={{ display: "flex", justifyContent: "center" }}>
            <Button variant="contained" onClick={handleSubmit}>프로젝트 등록</Button>
          </Box>
        </Stack>
      </Paper>
    </Box>
  );
}
