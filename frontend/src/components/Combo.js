// Combo.js
import React, { useState, useEffect } from "react";
import { Box } from "@mui/material"; 
import axios from "axios";
import CommonComboBox from "./CommonComboBox";

// Combo 컴포넌트가 sx prop을 받도록 정의
export default function Combo ({ groupId, onSelectionChange, defaultValue = "", sx }) {
  // 상태 추가: items, selected, isLoading
  const [items, setItems] = useState([]); 
  const [selected, setSelected] = useState(""); 
  const [isLoading, setIsLoading] = useState(false); 

   useEffect(() => {
    if (!groupId) return;
    setIsLoading(true);
    axios
      .get(`http://127.0.0.1:8000/common/codes/${groupId}`)
      .then((res) => {
        const formattedItems = res.data.map((item) => ({
          value: item.code_id,
          label: item.code_name,
        }));
        setItems(formattedItems);
      })
      .catch((err) => {
        console.error("공통 코드 가져오기 실패:", err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [groupId]);

  useEffect(() => {
    if (defaultValue && items.length > 0) {
      const found = items.find((item) => item.value === defaultValue);
      if (found) {
        setSelected(found.value);
        onSelectionChange?.(found.value);
      }
    } else if (!defaultValue && items.length > 0) {
      setSelected("");
      onSelectionChange?.("");
    }
  }, [defaultValue, items]);

  const handleComboBoxChange = (newValue) => {
    setSelected(newValue);
    onSelectionChange?.(newValue);
  };

  const getPlaceholder = () => {
    if (groupId === "TECH_STACK") return "기술 스택";
    if (groupId === "USER_GRADE") return "등급";
    if (groupId === "USER_ROLE") return "역할";
    if (groupId === "NOTICE_TYPE") return "분류";
    if (groupId === "PROJECT_TYPE") return "프로젝트 카테고리"
    if (groupId === "URGENCY_LEVEL") return "긴급도"
    return "선택하세요";
  };

  const hide_label_groups =["USER_ROLE", "PROJECT_STATUS","USER_GRADE"]
   const shouldCreateLabel = !hide_label_groups.includes(groupId);  // 예시: USER_ROLE에선 라벨을 생성하지 않음

  return (
    <Box>
      <CommonComboBox
        options={items}
        value={selected}
        onChange={handleComboBoxChange}
        placeholder={getPlaceholder()}
        disabled={isLoading}
        sx={sx}
        label={shouldCreateLabel ? getPlaceholder():""}
      />
    </Box>
  );
}