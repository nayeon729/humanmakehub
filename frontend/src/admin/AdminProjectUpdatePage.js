import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  TextField,
  Typography,
  Stack,
  InputAdornment,
  Paper,
  useTheme,
  useMediaQuery,
  Dialog,
  DialogTitle,
  DialogContent,
  Pagination
} from "@mui/material";
import axios from "../common/axiosInstance"
import { useParams, useNavigate } from "react-router-dom";
import Combo from "../components/Combo"; // 공통코드용 Combo 컴포넌트
import LooksOneRoundedIcon from '@mui/icons-material/LooksOneRounded';
import LooksTwoRoundedIcon from '@mui/icons-material/LooksTwoRounded';
import Looks3RoundedIcon from '@mui/icons-material/Looks3Rounded';
import Looks4RoundedIcon from '@mui/icons-material/Looks4Rounded';
import Folder from "../assets/folder.png"
import { useAlert } from "../components/CommonAlert";
import Tooltip from "@mui/material/Tooltip";
import FolderIcon from '@mui/icons-material/Folder';

const BASE_URL = process.env.REACT_APP_API_URL;

export default function AdminProjectUpdatePage() {
  const { project_id } = useParams();
  const navigate = useNavigate();
  const { showAlert } = useAlert();
  const [formData, setFormData] = useState({
    projectName: "",
    projectType: "",
    projectContent: "",
    estimatedDuration: "",
    budget: "",
    ugencyLevel: "",
    user_id: "",
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

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const token = sessionStorage.getItem("token");
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
      const token = sessionStorage.getItem("token");
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

      showAlert("프로젝트가 성공적으로 수정되었습니다!");
      navigate("/admin/projects/all");
    } catch (err) {
      console.error("수정 실패", err);
      showAlert("수정 중 오류 발생");
    }
  };

  return (
    <>
    <Box sx={{ p: 2, pt: 3 }}>
      <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
        <Tooltip
          title={
            <Typography sx={{ fontSize: 13, color: "#fff" }}>
              PM이 프로젝트를 수정할 수 있는 페이지입니다.
            </Typography>
          }
          placement="right"
          arrow
        >
          <Box sx={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
            <FolderIcon sx={{ fontSize: 40, mr: "4px", color: '#fde663ff' }} />
            <Typography
              variant="h4"
              fontWeight="bold"
              gutterBottom
              sx={{ mb: 0, cursor: "help", fontSize: "34px" }}
            >
              관리자 프로젝트 수정
            </Typography>
          </Box>
        </Tooltip>
      </Box>
      <Paper sx={{ p: 2, width: isMobile ? '90%' : '92%' }}>
        <Stack spacing={3}>
          <Box sx={{ display: "flex", gap: 1 }}>
            <LooksOneRoundedIcon color="primary" sx={{ fontSize: isMobile ? 25 : 32 }} />
            <Typography variant="h6" mb={2} sx={{ fontSize: isMobile ? "17px" : "20px" }}>프로젝트의 기본 정보를 입력해주세요.</Typography>
          </Box>
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

          <Box sx={{ display: "flex", gap: 1 }}>
            <LooksTwoRoundedIcon color="primary" sx={{ fontSize: isMobile ? 25 : 32 }} />
            <Typography variant="h6" mb={2} sx={{ fontSize: isMobile ? "17px" : "20px" }}>프로젝트에 대해 구체적으로 설명해주세요.</Typography>
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

          <Box sx={{ display: "flex", gap: 1 }}>
            <Looks3RoundedIcon color="primary" sx={{ fontSize: isMobile ? 25 : 32 }} />
            <Typography variant="h6" mb={2} sx={{ fontSize: isMobile ? "17px" : "20px" }}>예산과 예상 기간을 알려주세요.</Typography>
          </Box>
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

          <Box sx={{ display: "flex", gap: 1 }}>
            <Looks4RoundedIcon color="primary" sx={{ fontSize: isMobile ? 25 : 32 }} />
            <Typography variant="h6" mb={2} sx={{ fontSize: isMobile ? "17px" : "20px" }}>의뢰한 클라이언트 ID와 프로젝트의 긴급도를 알려주세요.</Typography>
            <Button
              variant="outlined"
              size="small"
              sx={{ width: "150px" }}
              onClick={() => setSearchDialogOpen(true)}
            >
              🔍 클라이언트 검색
            </Button>
          </Box>
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
