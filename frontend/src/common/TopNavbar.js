import React, { useEffect, useState } from "react";
import { AppBar, Toolbar, Typography, Button, Box, Menu, MenuItem, ListItemIcon, ListItemText, Fade, IconButton, Drawer, List, ListItem, ListItemButton } from "@mui/material";
import { Link, useNavigate, useLocation } from "react-router-dom";
import DashboardIcon from '@mui/icons-material/Dashboard';
import GroupIcon from '@mui/icons-material/Group';
import FolderIcon from '@mui/icons-material/Folder';
import BuildIcon from '@mui/icons-material/Build';
import AssignmentIcon from '@mui/icons-material/Assignment';
import CreateIcon from '@mui/icons-material/Create';
import MenuIcon from '@mui/icons-material/Menu';
import PaidIcon from '@mui/icons-material/Paid';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';

export default function TopNavbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [role, setRole] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const storedRole = localStorage.getItem("role");
    setRole(storedRole);
  }, [location]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    setRole(null);
    navigate("/login");
  };

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const isActive = (path) => location.pathname === path;

  const toggleDrawer = (open) => (event) => {
    if (event.type === "keydown" && (event.key === "Tab" || event.key === "Shift")) {
      return;
    }
    setMobileOpen(open);
  };

  const renderMenuItems = (isMobile = false) => {
    const commonProps = (path) => ({
      component: Link,
      to: path,
      onClick: () => {
        handleMenuClose();
        if (isMobile) setMobileOpen(false);
      },
      sx: isActive(path) ? {
        borderLeft: "4px solid #1976d2",
        bgcolor: "#e3f2fd",
        fontWeight: "bold",
      } : {}
    });

    
    if (role === "admin") {
      return (
        <>
          <MenuItem {...commonProps("/admin/dashboard")}>
            <ListItemIcon><DashboardIcon fontSize="small" /></ListItemIcon>
            <ListItemText>대시보드</ListItemText>
          </MenuItem>
          <MenuItem {...commonProps("/admin/users")}>
            <ListItemIcon><GroupIcon fontSize="small" /></ListItemIcon>
            <ListItemText>회원 관리</ListItemText>
          </MenuItem>
          <MenuItem {...commonProps("/admin/projects")}>
            <ListItemIcon><FolderIcon fontSize="small" /></ListItemIcon>
            <ListItemText>프로젝트 관리</ListItemText>
          </MenuItem>
          <MenuItem {...commonProps("/admin/agreements")}>
            <ListItemIcon><PaidIcon fontSize="small" /></ListItemIcon>
            <ListItemText>정산 관리</ListItemText>
          </MenuItem>
          <MenuItem {...commonProps("/admin/reports")}>
            <ListItemIcon><ReportProblemIcon fontSize="small" /></ListItemIcon>
            <ListItemText>신고 관리</ListItemText>
          </MenuItem>
          <MenuItem {...commonProps("/admin/logs")}>
            <ListItemIcon><AssignmentIcon fontSize="small" /></ListItemIcon>
            <ListItemText>로그 보기</ListItemText>
          </MenuItem>
        </>
      );
    }

    if (role === "pm") {
      return (
        <>
          <MenuItem {...commonProps("/pm/dashboard")}>
            <ListItemIcon><DashboardIcon fontSize="small" /></ListItemIcon>
            <ListItemText>PM 대시보드</ListItemText>
          </MenuItem>
          <MenuItem {...commonProps("/pm/team")}>
            <ListItemIcon><BuildIcon fontSize="small" /></ListItemIcon>
            <ListItemText>팀 빌더</ListItemText>
          </MenuItem>
          <MenuItem {...commonProps("/pm/projects")}>
            <ListItemIcon><FolderIcon fontSize="small" /></ListItemIcon>
            <ListItemText>프로젝트 관리</ListItemText>
          </MenuItem>
          <MenuItem {...commonProps("/pm/agreements")}>
            <ListItemIcon><PaidIcon fontSize="small" /></ListItemIcon>
            <ListItemText>정산 요청</ListItemText>
          </MenuItem>
        </>
      );
    }

    if (role === "member") {
      return (
        <>
          <MenuItem {...commonProps("/member/tasks")}>
            <ListItemIcon><AssignmentIcon fontSize="small" /></ListItemIcon>
            <ListItemText>작업 목록</ListItemText>
          </MenuItem>
          <MenuItem {...commonProps("/member/portfolio")}>
            <ListItemIcon><CreateIcon fontSize="small" /></ListItemIcon>
            <ListItemText>포트폴리오 작성</ListItemText>
          </MenuItem>
          <MenuItem {...commonProps("/member/requests")}>
            <ListItemIcon><GroupIcon fontSize="small" /></ListItemIcon>
            <ListItemText>참여 요청</ListItemText>
          </MenuItem>
          <MenuItem {...commonProps("/member/agreements")}>
            <ListItemIcon><PaidIcon fontSize="small" /></ListItemIcon>
            <ListItemText>정산 내역</ListItemText>
          </MenuItem>
          <MenuItem {...commonProps("/member/profile")}>
            <ListItemIcon><AssignmentIcon fontSize="small" /></ListItemIcon>
            <ListItemText>내 프로필</ListItemText>
          </MenuItem>
        </>
      );
    }

    // {
    //   role === "client" && (
    //     <Box sx={{ display: "flex", gap: 1 }}>
    //       <Button color="inherit" component={Link} to="/client/dashboard">
    //         클라이언트 대시보드
    //       </Button>
    //       <Button color="inherit" component={Link} to="/client/create">
    //         프로젝트 등록
    //       </Button>
    //       <Button color="inherit" component={Link} to="/client/projects">
    //         내 프로젝트
    //       </Button>
    //       <Button color="inherit" component={Link} to="/client/agreements">
    //         정산 확인
    //       </Button>
    //     </Box>
    //   )
    // }

    return null;
  };

  return (
    <>
      <AppBar position="static">
        <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
          <Typography variant="h6" component={Link} to="/" sx={{ color: "inherit", textDecoration: "none" }}>
            HumanMakeHub
          </Typography>

          {/* PC 화면 */}
          <Box sx={{ display: { xs: "none", sm: "flex" }, alignItems: "center" }}>
            {role ? (
              <>
                {(role === "admin" || role === "pm" || role === "member") && (
                  <>
                    <Button
                      color="inherit"
                      onMouseEnter={handleMenuOpen}
                      onClick={handleMenuOpen}
                    >
                      {role === "admin" ? "관리자 페이지" : role === "pm" ? "PM 페이지" : "팀원 페이지"}
                    </Button>
                    <Menu
                      anchorEl={anchorEl}
                      open={Boolean(anchorEl)}
                      onClose={handleMenuClose}
                      TransitionComponent={Fade}
                      MenuListProps={{
                        onMouseLeave: handleMenuClose,
                      }}
                    >
                      {renderMenuItems(false)}
                    </Menu>
                  </>
                )}
                {role === "client" && (
                  <>
                    <Button color="inherit" component={Link} to="/client/dashboard">클라이언트 대시보드</Button>
                    <Button color="inherit" component={Link} to="/client/create">프로젝트 등록</Button>
                  </>
                )}
                <Button color="inherit" onClick={handleLogout}>로그아웃</Button>
              </>
            ) : (
              <>
                <Button color="inherit" component={Link} to="/login">로그인</Button>
                <Button color="inherit" component={Link} to="/register">회원가입</Button>
              </>
            )}
          </Box>

          {/* 모바일 화면 */}
          <Box sx={{ display: { xs: "flex", sm: "none" } }}>
            <IconButton color="inherit" onClick={toggleDrawer(true)}>
              <MenuIcon />
            </IconButton>
            <Drawer
              anchor="right"
              open={mobileOpen}
              onClose={toggleDrawer(false)}
            >
              <Box
                sx={{ width: 250 }}
                role="presentation"
                onClick={toggleDrawer(false)}
                onKeyDown={toggleDrawer(false)}
              >
                <List>
                  {role ? (
                    <>
                      {renderMenuItems(true)}
                      <ListItem disablePadding>
                        <ListItemButton onClick={handleLogout}>
                          로그아웃
                        </ListItemButton>
                      </ListItem>
                    </>
                  ) : (
                    <>
                      <ListItem disablePadding>
                        <ListItemButton component={Link} to="/login">
                          로그인
                        </ListItemButton>
                      </ListItem>
                      <ListItem disablePadding>
                        <ListItemButton component={Link} to="/register">
                          회원가입
                        </ListItemButton>
                      </ListItem>
                    </>
                  )}
                </List>
              </Box>
            </Drawer>
          </Box>
        </Toolbar>
      </AppBar>
    </>
  );
}
