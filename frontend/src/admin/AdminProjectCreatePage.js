import React, { useState, useEffect } from "react";
import {
  Box, Button, TextField, Typography, Stack, InputAdornment, Paper, Dialog, DialogTitle,
  DialogContent, Pagination
} from "@mui/material";
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
import HelpIcon from '@mui/icons-material/Help';

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

  const [searchKeyword, setSearchKeyword] = useState("");
  const [clientList, setClientList] = useState([]);
  const [searchDialogOpen, setSearchDialogOpen] = useState(false);

  const [currentPage, setCurrentPage] = useState(1); // 현재 페이지
  const [itemsPerPage] = useState(5); // 한 페이지당 아이템 개수 (백엔드의 page_size와 일치시킵니다)
  const [totalClients, setTotalClients] = useState(0); // 전체 클라이언트 수

  useEffect(() => {
    if (searchDialogOpen) {
      setSearchKeyword("");
      handleClientSearch();
    }
  }, [searchDialogOpen, currentPage]);


  const handleClientSearch = async () => {
    try {
      const token = sessionStorage.getItem("token");
      const res = await axios.post(`${BASE_URL}/admin/client/filter`, {
        keyword: searchKeyword,
        page: currentPage,
        page_size: itemsPerPage
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setClientList(res.data.users || []);
      setTotalClients(res.data.total || 0);
    } catch (err) {
      console.error("클라이언트 검색 실패", err);
      showAlert("클라이언트 검색 실패");
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    if(formData.projectName.length>30){
      return showAlert('프로젝트 제목은 30까지 입력 할 수 있습니다.')
    }
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
      <Box sx={{ p: 2, pt: 3 }}>
        <Stack sx={{display:'flex', flexDirection:'row', mb:'20px'}}>
          <Typography
                variant="h4"
                fontWeight="bold"
                gutterBottom
                sx={{ mb: 0, fontSize: "34px" }}
              >
                관리자 프로젝트 생성
              </Typography>
          <Tooltip
            title={
              <Typography sx={{ fontSize: 13, color: "#fff" }}>
                PM이 직접 고객을 지정하여 프로젝트를 생성할 수 있는 페이지입니다.
              </Typography>
            }
            placement="right"
            arrow
          >
            <HelpIcon sx={{color:'gray', fontSize:22, mt:"2px",mr: "4px"}} />  
          </Tooltip>
        </Stack>
        <Paper sx={{ p: 2, width: isMobile ? '90%' : '92%' }}>
          <Stack spacing={3}>
            {/* 1. 기본 정보 */}
            <Box sx={{ display: "flex", gap: 1 }}>
              <LooksOneRoundedIcon color="primary" sx={{ fontSize: isMobile ? 25 : 32 }} />
              <Typography variant="h6" mb={0} sx={{ fontSize: isMobile ? "17px" : "20px" }} >프로젝트의 기본 정보를 입력해주세요.</Typography>
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
              <Typography variant="h6" mb={0} sx={{ fontSize: isMobile ? "17px" : "20px" }} >프로젝트에 대해 구체적으로 설명해주세요.</Typography>
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
              <Typography variant="h6" mb={0} sx={{ fontSize: isMobile ? "17px" : "20px" }} >예산과 예상 기간을 알려주세요.</Typography>
            </Box>
            <TextField
              label="예상 기간"
              name="estimatedDuration"
              value={formData.estimatedDuration}
              onChange={handleChange}
              fullWidth
              required
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
              required
              InputProps={{
                endAdornment: <InputAdornment position="end">원</InputAdornment>,
              }}
            />

            {/* 4. 긴급도 */}
            <Box sx={{ display: "flex", gap: 1 }}>
              <Looks4RoundedIcon color="primary" sx={{ fontSize: isMobile ? 25 : 32 }} />
              <Typography variant="h6" mb={0} sx={{ fontSize: isMobile ? "17px" : "20px" }} >의뢰한 클라이언트 ID와 프로젝트의 긴급도를 알려주세요.</Typography>
              <Button
                variant="outlined"
                size="small"
                sx={{ width: "150px" }}
                onClick={() => setSearchDialogOpen(true)}
              >
                🔍 클라이언트 검색
              </Button>
            </Box>


            {/* 클라이언트 ID 입력 */}
            <TextField
              label="클라이언트 ID"
              name="user_id"
              value={formData.user_id}
              onChange={handleChange}
              fullWidth
              // required
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

      <Dialog open={searchDialogOpen} onClose={() => setSearchDialogOpen(false)}>
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          클라이언트 검색
          <button onClick={() => setSearchDialogOpen(false)} style={{ color: "#e01f1f", width: "30px", p: 0, m: 0, border: 'none', backgroundColor: 'transparent', fontWeight: '800', fontSize: '20px' }}>
            X
          </button>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
            <TextField
              placeholder="아이디"
              fullWidth
              size="small"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
            />
            <Button variant="contained" onClick={handleClientSearch}>검색</Button>
          </Box>

          {clientList.length === 0 && (
            <Typography sx={{ textAlign: "center", color: "#888" }}>검색 결과가 없습니다</Typography>
          )}

          <Box sx={{ maxHeight: 300, overflowY: "auto" }}>
            {clientList.map((client) => (
              <Box key={client.user_id} sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                <Typography
                  sx={{
                    cursor: "pointer",
                    textDecoration: "none",
                    "&:hover": { color: "primary.dark" }
                  }}
                  onClick={() => window.open(`/admin/client/${client.user_id}?readonly=1`, "_blank")}
                >{client.user_id}</Typography>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => {
                    setFormData((prev) => ({ ...prev, user_id: client.user_id }));
                    setSearchDialogOpen(false);
                    showAlert(`클라이언트 ${client.user_id} 지정 완료`);
                  }}
                >
                  지정
                </Button>
              </Box>
            ))}
          </Box>
          {totalClients > 0 && (
            <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
              <Pagination
                count={Math.ceil(totalClients / itemsPerPage)} // 전체 페이지 수 계산
                page={currentPage}
                onChange={(event, value) => setCurrentPage(value)}
                shape="rounded"
                color="primary"
              />
            </Box>
          )}
        </DialogContent>
      </Dialog>

    </>
  );
}
