
import { Outlet, Link, useParams, useLocation } from "react-router-dom";
import { Box, Typography, List, ListItem, ListItemButton, ListItemText, Divider } from "@mui/material";
import React, { useEffect, useState } from "react";
import axios from "axios";


export default function ProjectChannel({ role }) {
    const location = useLocation();

    // 역할별 메뉴 설정
    const { project_id } = useParams();
    const [members, setMembers] = useState([]);
    const [pmId, setPmId] = useState(null);
    const BASE_URL = "http://127.0.0.1:8000";

    const menuItems = {
        R03: [
            { text: "공용", path: `/admin/channel/${project_id}/common` },

        ],
        R02: [
            { text: "공용", path: `/member/channel/${project_id}/common` },
            { text: "PM", path: `/member/channel/${project_id}/pm` }
        ]
    };

    const menus = menuItems[role] || [];
    useEffect(() => {
        if (role === "R03") {
            axios.get(`${BASE_URL}/admin/project/${project_id}/members`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`
                }
            })
                .then(res => {
                    setMembers(res.data.members ?? []);
                    setPmId(res.data.pm_id);
                })
                .catch(err => {
                    console.error("팀원 불러오기 실패", err);
                });
        }
    }, [project_id, role]);

    useEffect(() => {
        if (role === "R03") {
            axios.get(`${BASE_URL}/admin/project/${project_id}/members`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`
                }
            })
                .then(res => setMembers(res.data.members ?? []))
                .catch(err => {
                    console.error("팀원 불러오기 실패", err);
                });
        }
    }, [project_id, role]);


    return (
        <Box sx={{ display: "flex", minHeight: "100vh" }}>
            {/* 사이드바 */}
            <Box sx={{ width: 200, bgcolor: "#f5f5f5", p: 2, boxShadow: 2 }}>
                <Typography variant="h6" fontWeight="bold" mb={2}>
                    PROJECT<br />CHANNEL
                </Typography>
                <List>
                    {menus.map((item, index) => {
                        const isActive = location.pathname.startsWith(item.path);
                        return (
                            <ListItem key={index} disablePadding>
                                <ListItemButton component={Link} to={item.path}
                                    sx={{
                                        backgroundColor: isActive ? "#D9D9D9" : "transparent",
                                        fontWeight: isActive ? "bold" : "normal",
                                    }}>
                                    <ListItemText primary={item.text} />
                                </ListItemButton>
                            </ListItem>
                        );
                    })}
                </List>
                {role === "R03" && members.length > 0 && (
                    <>
                        <Divider sx={{ my: 2 }} />
                        <Typography variant="subtitle2" sx={{ fontWeight: "bold", mb: 1 }}>
                            팀원 목록
                        </Typography>
                        <List>
                            {members
                                .filter((member) => member.user_id !== pmId)  // PM 제외
                                .map((member) => {
                                    const memberPath = `/admin/channel/${project_id}/member/${member.user_id}`;
                                    const isActive = location.pathname === memberPath;
                                    return (
                                        <ListItem key={member.user_id} disablePadding>
                                            <ListItemButton
                                                component={Link}
                                                to={memberPath}
                                                sx={{
                                                    backgroundColor: isActive ? "#D9D9D9" : "transparent",
                                                    fontWeight: isActive ? "bold" : "normal",
                                                }}
                                            >
                                                <ListItemText primary={member.nickname} sx={{ pl: 1 }} />
                                            </ListItemButton>
                                        </ListItem>
                                    );
                                })}
                        </List>
                    </>
                )}
            </Box>

            {/* 본문 */}
            <Box sx={{ flexGrow: 1, p: 4 }}>
                <Outlet />
            </Box>
        </Box>
    );
}
