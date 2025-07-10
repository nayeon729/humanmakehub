import React, { useState, useEffect } from "react";
import { Box, Grid, Paper, Typography, List, ListItem, ListItemText, Button } from "@mui/material";

import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function getAskList() {
  const navigate = useNavigate();
  const BASE_URL = "http://127.0.0.1:8000";
  const [askList, setAskList] = useState([]);
  const token = localStorage.getItem("token");

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
    if(response?.request?.status == 200){
        setAskList(response?.data);
    }
    } catch (error) {
    console.error("문의사항목록 불러오기 실패", error);
    }
  };

  const handleConfirm = async (ask_id) => {
    try {
      const payload = {
        ask_id:ask_id,
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
        ㅎㅎ
      </Typography>
        {askList && askList.map((list, index) => {
            return (
                <Box key={index} sx={{ my: 2, p: 2, border: '1px solid #ddd', borderRadius: 2 }}>
                <Typography variant="h6" fontWeight="bold">이름: {list?.username}</Typography>
                <Typography>회사: {list?.company}</Typography>
                <Typography>이메일: {list?.email}</Typography>
                <Typography>연락처: {list?.phone}</Typography>
                <Typography>문의 내용: {list?.description}</Typography>

                {list?.category && Array.isArray(list.category) && (
                    <Box sx={{ mt: 1 }}>
                    <Typography variant="subtitle1" fontWeight="bold">문의 항목:</Typography>
                    <List>
                        {list.category.map((cat, i) => (
                        <ListItem key={i} sx={{ py: 0 }}>
                            <ListItemText primary={cat} />
                        </ListItem>
                        ))}
                    </List>
                    </Box>
                )}
                <Button onClick={() => handleConfirm(list.ask_id)}>확인완료</Button>
                <Typography variant="subtitle1" fontWeight="bold">{list.del_yn == 'Y' ? "확인완료" : "보류"}</Typography>
                </Box>
            );
        })}
      
    </Box>
  );
}
