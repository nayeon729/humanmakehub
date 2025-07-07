
import { Outlet, Link, useParams } from "react-router-dom";
import { Box, Typography, List, ListItem, ListItemButton, ListItemText, Divider } from "@mui/material";
import React, { useEffect, useState } from "react";
import axios from "axios";


export default function ProjectChannel({ role }) {
    // 역할별 메뉴 설정
    const { project_id } = useParams();
    const [members, setMembers] = useState([]);
    const BASE_URL = "http://127.0.0.1:8000";

    const menuItems = {
        admin: [
            { text: "공용", path: `/channel/${project_id}/common` },

        ],
        member: [
            { text: "공용", path: `/channel/${project_id}/common` },
            { text: "PM", path: `/channel/${project_id}/pm` }
        ]
    };

    const menus = menuItems[role] || [];

    useEffect(() => {
        if (role === "admin") {
            axios.get(`${BASE_URL}/admin/project/${project_id}/members`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`
                }
            })
                .then(res => setMembers(res.data))
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
                    {menus.map((item, index) => (
                        <ListItem key={index} disablePadding>
                            <ListItemButton component={Link} to={item.path}>
                                <ListItemText primary={item.text} />
                            </ListItemButton>
                        </ListItem>
                    ))}
                </List>
                {role === "admin" && members.length > 0 && (
                    <>
                        <Divider sx={{ my: 2 }} />
                        <Typography variant="subtitle2" sx={{ fontWeight: "bold", mb: 1 }}>
                            팀원 목록
                        </Typography>
                        <List>
                            {members.map((member) => (
                                <ListItem key={member.user_id} disablePadding>
                                    <ListItemButton
                                        component={Link}
                                        to={`/channel/${project_id}/member/${member.user_id}`}
                                    >
                                        <ListItemText primary={member.nickname} sx={{ pl: 1 }} />
                                    </ListItemButton>
                                </ListItem>
                            ))}
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
