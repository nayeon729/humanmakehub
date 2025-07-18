import React, { useEffect, useState } from "react";
import { AppBar, Toolbar, Typography, Button, Box, Menu, MenuItem, ListItemIcon, ListItemText, Fade, Divider, IconButton, Drawer, List, ListItem, ListItemButton } from "@mui/material";
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
import ListIcon from '@mui/icons-material/List';
import AnnouncementIcon from '@mui/icons-material/Announcement';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import PeopleIcon from "@mui/icons-material/People";

export default function TopNavbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [role, setRole] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [nickname, setNickname] = useState("");
  const isChannelPage = location.pathname.includes("/channel");
  const [channelMenuOpen, setChannelMenuOpen] = useState(false);
  useEffect(() => {
    const storedRole = sessionStorage.getItem("role");
    const storedNickname = sessionStorage.getItem("nickname");
    setRole(storedRole);
    setNickname(storedNickname);

  }, [location]);



  const handleLogout = () => {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("role");
    sessionStorage.removeItem("nickname");
    setRole(null);
    setNickname("");
    navigate("/");
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

  const handleLogoClick = () => {
    const storedRole = sessionStorage.getItem("role");

    if (storedRole === "R04" || storedRole === "R03") {
      navigate("/admin/dashboard");
    } else if (storedRole === "R01") {
      navigate("/client/dashboard");
    } else if (storedRole === "R02") {
      navigate("/member/tasks");
    } else {
      navigate("/"); // 로그인 전이면 홈으로
    }
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

    {/* PM / ADMIN*/ }
    if (role === "R03" || role === "R04") {
      return (
        <>
          <MenuItem {...commonProps("/admin/dashboard")}>
            <ListItemIcon><DashboardIcon fontSize="small" /></ListItemIcon>
            <ListItemText>대시보드</ListItemText>
          </MenuItem>
          <MenuItem {...commonProps("/admin/users")}>
            <ListItemIcon><GroupIcon fontSize="small" /></ListItemIcon>
            <ListItemText>사용자 관리</ListItemText>
          </MenuItem>
          <MenuItem {...commonProps("/admin/projects/all")}>
            <ListItemIcon><ListIcon fontSize="small" /></ListItemIcon>
            <ListItemText>전체 프로젝트</ListItemText>
          </MenuItem>
          <MenuItem {...commonProps("/admin/projects")}>
            <ListItemIcon><ListIcon fontSize="small" /></ListItemIcon>
            <ListItemText>프로젝트 관리</ListItemText>
          </MenuItem>
          <MenuItem {...commonProps("/admin/askList")}>
            <ListItemIcon><ReportProblemIcon fontSize="small" /></ListItemIcon>
            <ListItemText>문의사항 목록</ListItemText>
          </MenuItem>
          <MenuItem {...commonProps("/admin/portfolioList")}>
            <ListItemIcon><AssignmentIcon fontSize="small" /></ListItemIcon>
            <ListItemText>포트폴리오 목록</ListItemText>
          </MenuItem>
          <MenuItem {...commonProps("/admin/notice/list")}>
            <ListItemIcon><AnnouncementIcon fontSize="small" /></ListItemIcon>
            <ListItemText>공지사항</ListItemText>
          </MenuItem>
        </>
      );
    }

    {/* Member */ }
    if (role === "R02") {
      return (
        <>
          <MenuItem {...commonProps("/member/tasks")}>
            <ListItemIcon><DashboardIcon fontSize="small" /></ListItemIcon>
            <ListItemText>대시보드</ListItemText>
          </MenuItem>
          <MenuItem {...commonProps("/member/userinfo")}>
            <ListItemIcon><AccountCircleIcon fontSize="small" /></ListItemIcon>
            <ListItemText>회원정보</ListItemText>
          </MenuItem>
          <MenuItem {...commonProps("/member/projectlist")}>
            <ListItemIcon><ListIcon fontSize="small" /></ListItemIcon>
            <ListItemText>프로젝트 목록</ListItemText>
          </MenuItem>
          <MenuItem {...commonProps("/member/notice")}>
            <ListItemIcon><AnnouncementIcon fontSize="small" /></ListItemIcon>
            <ListItemText>공지사항</ListItemText>
          </MenuItem>
        </>
      );
    }

    {/* Client */ }
    if (role === "R01") {
      return (
        <>
          <MenuItem {...commonProps("/client/dashboard")}>
            <ListItemIcon><DashboardIcon fontSize="small" /></ListItemIcon>
            <ListItemText>대시보드</ListItemText>
          </MenuItem>
          <MenuItem {...commonProps("/client/userinfo")}>
            <ListItemIcon><AccountCircleIcon fontSize="small" /></ListItemIcon>
            <ListItemText>회원정보</ListItemText>
          </MenuItem>
          <MenuItem {...commonProps("/client/create")}>
            <ListItemIcon><CreateIcon fontSize="small" /></ListItemIcon>
            <ListItemText>프로젝트 생성</ListItemText>
          </MenuItem>
          <MenuItem {...commonProps("/client/list")}>
            <ListItemIcon><ListIcon fontSize="small" /></ListItemIcon>
            <ListItemText>프로젝트 목록</ListItemText>
          </MenuItem>
          <MenuItem {...commonProps("/client/notice/list")}>
            <ListItemIcon><AnnouncementIcon fontSize="small" /></ListItemIcon>
            <ListItemText>공지사항</ListItemText>
          </MenuItem>
        </>
      );
    }

    return null;
  };

  return (
    <>
      <AppBar position="static" >
        <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
          <Typography
            variant="h6"
            sx={{ color: "inherit", textDecoration: "none", cursor: "pointer" }}
            onClick={handleLogoClick}
          >
            HumanMakeHub
          </Typography>
          {/* PC 화면 */}
          <Box sx={{ display: { xs: "none", sm: "flex" }, alignItems: "center" }}>
            {role ? (
              <>
                {(role === "R04" || role === "R03" || role === "R02" || role === "R01") && (
                  <>
                    <Button
                      color="inherit"

                    >
                      {role === "R04" ? `ADMIN(최종관리자) ${nickname}님 환영합니다.` : role === "R03" ? `PM ${nickname}님 환영합니다.` : role === "R02" ? `개발자 ${nickname}님 환영합니다.` : `고객 ${nickname}님 환영합니다.`}
                    </Button>

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
                {isChannelPage && (role === "R03" || role === "R04") && (
                  <>
                    <Divider sx={{ my: 1 }} />
                    <Typography variant="subtitle2" sx={{ fontWeight: "bold", mb: 1 }}>채널 메뉴</Typography>
                    {/* ✅ 공용 메뉴 */}
                    <List>
                      <ListItem disablePadding>
                        <ListItemButton
                          component={Link}
                          to={`/admin/channel/${sessionStorage.getItem("project_channel_project_id")}/common`}
                        >
                          <ListItemText primary="공용" />
                        </ListItemButton>
                      </ListItem>
                    </List>
                    <List>
                      {(JSON.parse(sessionStorage.getItem("project_channel_members")) || []).map((member) => (
                        <ListItem key={member.user_id} disablePadding>
                          <ListItemButton
                            component={Link}
                            to={`/admin/channel/${member.project_id}/member/${member.user_id}`}
                          >
                            <ListItemText primary={member.nickname} />
                            <Typography>{member.count > 0 ? member.count : ""}</Typography>
                          </ListItemButton>
                        </ListItem>
                      ))}
                    </List>
                  </>
                )}
                {isChannelPage && role === "R02" && (
                  <>
                    <Divider sx={{ my: 1 }} />
                    <Typography variant="subtitle2" sx={{ fontWeight: "bold", mb: 1 }}>채널 메뉴</Typography>
                    <List>
                      {(JSON.parse(sessionStorage.getItem("project_channel_menus")) || []).map((item, index) => (
                        <ListItem key={index} disablePadding>
                          <ListItemButton
                            component={Link}
                            to={item.path}
                          >
                            <ListItemText primary={item.text} />
                          </ListItemButton>
                        </ListItem>
                      ))}
                    </List>
                  </>
                )}
              </Box>


            </Drawer>
          </Box>
        </Toolbar>
      </AppBar>
    </>
  );
}
