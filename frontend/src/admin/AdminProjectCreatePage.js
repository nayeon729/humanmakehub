import React, { useState } from "react";
import { Box, Button, TextField, Typography, Stack, InputAdornment, Paper } from "@mui/material";
import axios from "../common/axiosInstance"
import Combo from "../components/Combo";  // 공통코드용 Combo 컴포넌트
import { useNavigate } from "react-router-dom";
import LooksOneRoundedIcon from '@mui/icons-material/LooksOneRounded';
import LooksTwoRoundedIcon from '@mui/icons-material/LooksTwoRounded';
import Looks3RoundedIcon from '@mui/icons-material/Looks3Rounded';
import Looks4RoundedIcon from '@mui/icons-material/Looks4Rounded';
import Folder from "../assets/folder.png"
import { useAlert } from "../components/CommonAlert";
import Tooltip from "@mui/material/Tooltip";
import FolderIcon from '@mui/icons-material/Folder';
import { useMediaQuery, useTheme } from "@mui/material";

const BASE_URL = process.env.REACT_APP_API_URL;

export default function AdminProjectCreatePage() {
  const navigate = useNavigate();
  const { showAlert } = useAlert();
  const [formData, setFormData] = useState({
    projectName: "",
    projectType: "",
    projectContent: "",
    estimatedDuration: "",
    budget: "",
    urgencyLevel: "",
    user_id: "", // ✅ 클라이언트 ID 입력 받기
  });

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    try {
      const token = sessionStorage.getItem("token");

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

      showAlert("프로젝트가 성공적으로 등록되었습니다!");
      navigate("/admin/projects/all");
    } catch (err) {
      console.error("프로젝트 등록 실패", err);
      showAlert("등록 중 오류가 발생했습니다.");
    }
  };

  return (
    <>
      <Box sx={{ p:2, pt:3}}>
        <Box sx={{ display: "flex", alignItems: "center", mb: 3, }}>
          <Tooltip
            title={
              <Typography sx={{ fontSize: 13, color: "#fff" }}>
                PM이 직접 고객을 지정하여 프로젝트를 생성할 수 있는 페이지입니다.
              </Typography>
            }
            placement="right"
            arrow
          >
            <Stack direction="row" alignItems="center" justifyContent='center' >
              <FolderIcon sx={{ fontSize: 40, mr: "4px",color:'#fde663ff' }} />
              {/* <img src={Folder} alt="" style={{ height: "35px" }} /> */}
              <Typography
                variant="h4"
                fontWeight="bold"
                gutterBottom
                sx={{ mb: 0, cursor: "help", fontSize: "34px"}}
              >
              관리자 프로젝트 생성
              </Typography>
            </Stack>
          </Tooltip>
        </Box>
      <Paper sx={{ p: 2, width: isMobile ? '90%' : '92%' }}>
        <Stack spacing={3}>
          {/* 1. 기본 정보 */}
          <Box sx={{ display: "flex", gap: 1 }}>
            <LooksOneRoundedIcon color="primary" sx={{ fontSize: isMobile ? 25 : 32 }} />
            <Typography variant="h6" mb={0} sx= {{ fontSize: isMobile ? "17px" : "20px" }} >프로젝트의 기본 정보를 입력해주세요.</Typography>
          </Box>
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
            sx={{ maxWidth: '100%', fontSize: isMobile ? '13px' : '14px' }}
          />

          {/* 2. 설명 */}
          <Box sx={{ display: "flex", gap: 1 }}>
            <LooksTwoRoundedIcon color="primary" sx={{ fontSize: isMobile ? 25 : 32 }} />
            <Typography variant="h6" mb={0} sx= {{ fontSize: isMobile ? "17px" : "20px" }} >프로젝트에 대해 구체적으로 설명해주세요.</Typography>
          </Box>
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
          <Box sx={{ display: "flex", gap: 1 }}>
            <Looks3RoundedIcon color="primary" sx={{ fontSize: isMobile ? 25 : 32 }} />
            <Typography variant="h6" mb={0} sx= {{ fontSize: isMobile ? "17px" : "20px" }} >예산과 예상 기간을 알려주세요.</Typography>
          </Box>
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
          <Box sx={{ display: "flex", gap: 1 }}>
            <Looks4RoundedIcon color="primary" sx={{ fontSize: isMobile ? 25 : 32 }} />
            <Typography variant="h6" mb={0} sx= {{ fontSize: isMobile ? "17px" : "20px" }} >의뢰한 클라이언트 ID와 프로젝트의 긴급도를 알려주세요.</Typography>
          </Box>

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
            sx={{ maxWidth: '100%', fontSize: isMobile ? '13px' : '14px' }}
          />

          {/* 5. 제출 */}
          <Box sx={{ display: "flex", justifyContent: "center" }}>
            <Button variant="contained" onClick={handleSubmit} sx={{ fontSize: isMobile ? '13px' : '14px' }}>프로젝트 등록</Button>
          </Box>
        </Stack>
      </Paper>
    </Box >
    </>
  );
}
