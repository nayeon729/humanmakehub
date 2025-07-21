/**
 * 파일명: ClientUserInfo.js
 * 설명: 클라이언트(고객)가 새 프로젝트를 등록하는 폼 컴포넌트.
 * 주요 기능:
 *   - 프로젝트명, 유형, 내용, 예상 금액 및 기간, 긴급도 입력
 *   - Combo 컴포넌트를 사용하여 공통코드(프로젝트 유형, 긴급도) 선택
 *   - axiosInstance를 사용하여 /client/projects로 POST 요청 전송
 *   - 예상 금액/기간은 숫자만 추출하여 서버에 전송
 */

import React, { useState } from "react";
import { Box, Button, TextField, Typography, Stack, InputAdornment, Paper } from "@mui/material";
import axios from "../common/axiosInstance"
import Combo from "../components/Combo";
import LooksOneRoundedIcon from '@mui/icons-material/LooksOneRounded';
import LooksTwoRoundedIcon from '@mui/icons-material/LooksTwoRounded';
import Looks3RoundedIcon from '@mui/icons-material/Looks3Rounded';
import Looks4RoundedIcon from '@mui/icons-material/Looks4Rounded';
import Folder from "../assets/folder.png"
import { useAlert } from "../components/CommonAlert";
import Tooltip from "@mui/material/Tooltip";
import FolderIcon from '@mui/icons-material/Folder';

const ClientUserInfo = () => {

  const BASE_URL = process.env.REACT_APP_API_URL;
  const [formData, setFormData] = useState({
    projectName: "",
    projectType: "",
    projectContent: "",
    projectDescription: "",
    budget: "",
    estimatedDuration: "",
    ugencyLevel: "",
  });
  const { showAlert } = useAlert();
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };

  const handleSubmit = async () => {
    try {
      const token = sessionStorage.getItem('token');

      // clean된 데이터로 설정
      const cleanedFormData = {
        ...formData,
        estimatedDuration: formData.estimatedDuration.replace(/[^0-9]/g, ""), // '일'을 제거
        budget: formData.budget.replace(/[^0-9]/g, ""), // '원'을 제거
      };

      const response = await axios.post(`${BASE_URL}/client/projects`, formData, {
        headers: {
          Authorization: `Bearer ${token}`, // JWT 토큰을 헤더에 포함시킴
        },
      });
      showAlert("프로젝트가 생성되었습니다.");
    } catch (error) {
      console.error("프로젝트 생성 실패:", error);
      showAlert("프로젝트 생성에 실패했습니다.");
    }
  };

  return (
    <Box sx={{ display: "block", justifyContent: "center", py: 4 }}>
      <Box sx={{ display: "flex", alignItems: "center" ,mb:3}}>
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
            <FolderIcon sx={{ fontSize: 40, mr: "4px", color:'#fde663ff'  }} />
            <Typography
              variant="h4"
              fontWeight="bold"
              gutterBottom
              sx={{ mb: 0, cursor: "help", }}
            >
              프로젝트 생성
            </Typography>
          </Box>
        </Tooltip>
        </Box>
      <Paper sx={{ p: 3, width: 600 }}>
        <Stack spacing={3}>
          <Box sx={{ display: "flex", gap: 1 }}>
            <LooksOneRoundedIcon color="primary" sx={{ fontSize: 32 }} />
            <Typography variant="h6" mb={2}>프로젝트의 기본 정보를 입력해주세요.</Typography>
          </Box>
          {/* 프로젝트 기본 정보 */}
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
            onSelectionChange={(val) => setFormData((prevData) => ({ ...prevData, projectType: val }))}
            sx={{ minWidth: 300 }}
          />
          <Box sx={{ display: "flex", gap: 1}}>
            <LooksTwoRoundedIcon color="primary" sx={{ fontSize: 32 }} />
            <Typography variant="h6" mb={2}>프로젝트에 대해 구체적으로 설명해주세요.</Typography>
          </Box>
          {/* 프로젝트 내용 */}
          <TextField
            label="프로젝트 내용"
            name="projectContent"
            value={formData.projectContent}
            onChange={handleChange}
            fullWidth
            required
          />
          <Box sx={{ display: "flex", gap: 1 }}>
            <Looks3RoundedIcon color="primary" sx={{ fontSize: 32 }} />
            <Typography variant="h6" mb={2}>예산과 예상 기간을 알려주세요.</Typography>
          </Box>
          {/* 예상 기간 */}
          <TextField
            label="예상 기간"
            name="estimatedDuration"
            value={formData.estimatedDuration}
            onChange={handleChange}
            fullWidth
            required
            InputProps={{
              endAdornment: <InputAdornment position="end">일</InputAdornment>
            }}
          />
          {/* 예상 금액 */}
          <TextField
            label="예상 금액"
            name="budget"
            value={formData.budget}
            onChange={handleChange}
            fullWidth
            required
            InputProps={{
              endAdornment: <InputAdornment position="end">원</InputAdornment>
            }}
          />
          <Box sx={{ display: "flex", gap: 1 }}>
            <Looks4RoundedIcon color="primary" sx={{ fontSize: 32 }} />
          <Typography variant="h6" mb={2}>프로젝트의 긴급도를 알려주세요.</Typography>
          </Box>
          {/* 프로젝트 긴급도 */}
          <Combo
            groupId="URGENCY_LEVEL"                      // ✅ 이게 핵심!
            defaultValue=""
            onSelectionChange={(val) => setFormData((prevData) => ({ ...prevData, ugencyLevel: val }))}
            sx={{ minWidth: 300 }}
          />

          {/* 제출 버튼 */}
          <Box sx={{ display: "flex", justifyContent: "center" }}>
            <Button variant="contained" onClick={handleSubmit}>프로젝트 생성</Button>
          </Box>
        </Stack>
      </Paper>
    </Box>
  );
};

export default ClientUserInfo;
