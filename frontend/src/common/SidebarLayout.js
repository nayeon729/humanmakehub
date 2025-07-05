import React from "react";
import { Outlet, Link } from "react-router-dom";
import { Box, Typography, List, ListItem, ListItemButton, ListItemText } from "@mui/material";

export default function SidebarLayout({ role }) {
  // 역할별 메뉴 설정
  const menuItems = {
    admin: [
      { text: "대시보드", path: "/admin/dashboard" },
      { text: "사용자 관리", path: "/admin/users" },
      { text: "전체 프로젝트", path: "/admin/projects/all"},
      { text: "프로젝트 관리", path: "/admin/projects" },
      { text: "공지사항", path: "/" },
    ],
    pm: [
      { text: "대시보드", path: "/pm/dashboard" },
      { text: "팀 빌더", path: "/pm/team" },
      { text: "프로젝트 관리", path: "/pm/projects" },
    ],
    member: [
      { text: "작업 목록", path: "/member/tasks" },
      { text: "포트폴리오 작성", path: "/member/portfolio" },
    ],
    client: [
      { text: "대시보드", path: "/client/dashboard" },
      { text: "회원정보", path: "/client/userinfo" },
      { text: "프로젝트 생성", path: "/client/create" },
      { text: "프로젝트 목록", path: "/client/list" },
      { text: "공지사항", path: "/client/noticeboard" },
    ],
  };

  const menus = menuItems[role] || [];

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      {/* 사이드바 */}
      <Box sx={{ width: 200, bgcolor: "#f5f5f5", p: 2, boxShadow: 2 }}>
        <Typography variant="h6" fontWeight="bold" mb={2}>
          {role.toUpperCase()}
        </Typography>
        <List>
          {menus.map((item, index) => (
            <ListItem key={index} disablePadding>
              <ListItemButton component={Link} to={item.path}>
                <ListItemText primary={item.text} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Box>

      {/* 본문 */}
      <Box sx={{ flexGrow: 1, p: 4 }}>
        <Outlet />
      </Box>
    </Box>
  );
}
