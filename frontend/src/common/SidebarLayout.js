import React from "react";
import { Outlet, Link } from "react-router-dom";
import { Box, Typography, List, ListItem, ListItemButton, ListItemText } from "@mui/material";
import { useLocation } from "react-router-dom";


export default function SidebarLayout({ role }) {
  const location = useLocation();
  // 역할별 메뉴 설정
  const menuItems = {
    'PM(Admin)': [
      { text: "대시보드", path: "/admin/dashboard" },
      { text: "사용자 관리", path: "/admin/users" },
      { text: "전체 프로젝트", path: "/admin/projects/all"},
      { text: "프로젝트 관리", path: "/admin/projects" },
      { text: "문의사항 목록", path: "/admin/askList" },
      { text: "포트폴리오 목록", path: "/admin/portfolioList" },
      { text: "공지사항", path: "/admin/notice/list" },
    ],
    Developer: [
      { text: "대시보드", path: "/member/tasks" },
      { text: "회원정보", path: "/member/userinfo" },
      { text: "프로젝트 목록", path: "/member/projectlist" },
      { text: "공지사항", path: "/member/notice" },
    ],
    client: [
      { text: "대시보드", path: "/client/dashboard" },
      { text: "회원정보", path: "/client/userinfo" },
      { text: "프로젝트 생성", path: "/client/create" },
      { text: "프로젝트 목록", path: "/client/list" },
      { text: "공지사항", path: "/client/notice/list" },
    ],
  };

  const menus = menuItems[role] || [];

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      {/* 사이드바 */}
      <Box sx={{ minWidth: 200, bgcolor: "#f5f5f5", p: 2, boxShadow: 2 }}>
        <Typography variant="h6" fontWeight="bold" mb={2}>
          {role.toUpperCase()}
        </Typography>
        <List>
          {menus.map((item, index) => {
            const isActive = location.pathname === item.path;
            return (
              <ListItem key={index} disablePadding>
                <ListItemButton
                  component={Link}
                  to={item.path}
                  sx={{
                    backgroundColor: isActive ? "#D9D9D9" : "transparent",
                    fontWeight: isActive ? "bold" : "normal",
                  }}
                >
                  <ListItemText primary={item.text} />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      </Box>

      {/* 본문 */}
      <Box sx={{ flexGrow: 1, p: 4 }}>
        <Outlet />
      </Box>
    </Box>
  );
}
