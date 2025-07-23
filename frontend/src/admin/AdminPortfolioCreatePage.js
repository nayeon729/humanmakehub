import React, { useState, useEffect } from "react";
import { Box, Typography, Button, TextField, Container, Paper, InputAdornment, Checkbox, Chip, Stack } from "@mui/material";
import { useNavigate } from "react-router-dom";
import axios from "../common/axiosInstance"
import { useAlert } from "../components/CommonAlert";
import Tooltip from "@mui/material/Tooltip";

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: "", content: "", estimated_dt: "", budget: "",
  });
  const [techStacks, setTechStacks] = useState({});
  const [selectedTechs, setSelectedTechs] = useState([]); 

  const BASE_URL = process.env.REACT_APP_API_URL;
  const token = sessionStorage.getItem("token");
  const { showAlert } = useAlert();

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
        estimated_dt: form.estimated_dt+"개월",
        budget: form.budget+"만원",
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
    <Box sx={{ py: 8 }}>
      <Container maxWidth="md">
        <Paper sx={{ p: 4, borderRadius: 4, boxShadow: 5 }}>
            <Box sx={{display:"flex",flexDirection:"column", justifyContent:"center"}}>
              <Typography variant="h5" align="center" fontWeight="bold">포트폴리오 작성</Typography>
              <Stack spacing={2} mt={3}>
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

              </Stack>
              {Object.entries(techStacks).map(([category, techs]) => (
                <Box key={category} sx={{ border: "1px solid #ddd", borderRadius: 2, p: 2, gap:1}}>
                    <Typography variant="subtitle1" fontWeight="bold" mb={1}>{category}</Typography>
                    <Stack direction="row" gap={1} flexWrap="wrap">
                    {techs.map((tech) => (
                        <Chip key={tech.code_id} label={tech.label} clickable color={selectedTechs.some((t) => t.code_id ===tech.code_id) ? "primary" : "default"} onClick={() => toggleTech(tech)} />
                    ))}
                    </Stack>
                </Box>
                ))}
                <Box sx={{display:'flex', justifyContent:'center'}}>
              <Button variant="contained" onClick={handleSubmit} sx={{mt:3, width:"200px"}}>
                작성 완료
              </Button>
              </Box>
            </Box>
        </Paper>
      </Container>
    </Box>
  );
}
