import React, { useState, useEffect } from "react";
import { Box, Grid, Paper, Typography, List, ListItem, ListItemText, Button, Chip } from "@mui/material";

import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function getAskList() {
  const navigate = useNavigate();
  const BASE_URL = process.env.REACT_APP_API_URL;
  const [askList, setAskList] = useState([]);
  const token = sessionStorage.getItem("token");

  useEffect(() => {
    getAskList();
  }, []);

  const getAskList = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/admin/askList`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      console.log("response", response);
      if (response?.request?.status == 200) {
        setAskList(response?.data);
      }
    } catch (error) {
      console.error("문의사항목록 불러오기 실패", error);
    }
  };

  const handleConfirm = async (ask_id) => {
    try {
      const payload = {
        ask_id: ask_id,
      };

      await axios.post(`${BASE_URL}/admin/askCheck`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      alert("문의사항 체크완료!");
      getAskList();
    } catch (error) {
      console.error("문의사항 체크실패", error);
      alert("문의사항 체크실패: " + (error.response?.data?.detail || "서버 오류"));
    }
  };



  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        문의사항 목록
      </Typography>
      {askList && askList.map((list, index) => {
        return (

          <Paper key={index} sx={{ my: 2, p: 2, border: '1px solid #ddd', borderRadius: 2, width: "400px" }}>
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <Typography sx={{ color: "gray", fontWeight: "bold" }}>{list.del_yn == 'Y' ? "확인완료" : "보류"}</Typography>
              <Button onClick={() => handleConfirm(list.ask_id)} sx={{marginRight:"-10px"}}>확인</Button>
            </Box>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <Typography ><strong>이름:</strong> {list?.username}</Typography>
              <Typography><strong>회사:</strong> {list?.company}</Typography>
              <Typography><strong>이메일:</strong> {list?.email}</Typography>
              <Typography><strong>연락처:</strong> {list?.phone}</Typography>

            </Box>
            {list?.category && Array.isArray(list.category) && (
              <Box sx={{ mb: 1 }} >
                <Typography variant="subtitle1" fontWeight="bold" >문의 항목</Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {list.category.map((cat, i) => (
                    <Chip key={i} label={cat} />
                  ))}
                </Box>
              </Box>
            )}
            <Typography><strong>문의 내용</strong></Typography>
            <Box sx={{border:"1px solid gray",borderRadius:"5px", p:1, height:"100px" }}>
              <Typography>{list?.description}</Typography>
            </Box>
          </Paper>
        );
      })}

    </Box>
  );
}
