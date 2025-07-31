import React, { useState, useEffect } from "react";
import {
    Box, Typography, Button, TextField, Table, TableHead, TableRow,
    TableCell, TableBody, Paper, Stack, Chip, Pagination, useTheme, useMediaQuery
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import axios from "../common/axiosInstance"
import add from "../assets/create.png"
import CampaignIcon from '@mui/icons-material/Campaign';
import Tooltip from "@mui/material/Tooltip";
import HelpIcon from '@mui/icons-material/Help';

const BASE_URL = process.env.REACT_APP_API_URL;

export default function AdminNoticeListPage() {
    const [notices, setNotices] = useState([]);
    const [searchKeyword, setSearchKeyword] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [userRole, setUserRole] = useState("");

    const itemsPerPage = 10;
    const navigate = useNavigate();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

    const fetchNotices = async (page = 1, keyword = "") => {
        try {
            const token = sessionStorage.getItem("token");
            const res = await axios.get(`${BASE_URL}/admin/notices`, {
                params: { page, keyword },
                headers: { Authorization: `Bearer ${token}` },
            });
            setNotices(res.data.items);
            setTotalPages(res.data.totalPages);
        } catch (error) {
            console.error("공지사항 불러오기 실패", error);
        }
    };

    useEffect(() => {
        const role = sessionStorage.getItem("role");
        setUserRole(role);
    }, []);
    useEffect(() => {
        fetchNotices(currentPage);
    }, [currentPage]);

    const handleSearch = () => {
        setCurrentPage(1);
        fetchNotices(1, searchKeyword);
    };

    const noticeTypeMap = {
        N01: "공지",
        N02: "점검"
    }

    const getNoticeDetailPath = (role, noticeId) => {
        if (role === "R02") return `/member/notice/${noticeId}`;
        if (role === "R01") return `/client/notice/${noticeId}`;
        return `/admin/notice/${noticeId}`; // R03, R04
    };

    return (
        <Box sx={{ p: 2, pt: 3 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Stack sx={{ display: 'flex', flexDirection: 'row', pl:'2px' }}>
                        <Typography
                            variant="h4"
                            fontWeight="bold"
                            gutterBottom
                            sx={{ mb: 0}}
                        >
                            공지사항</Typography>
                        <Tooltip
                            title={
                                <Typography sx={{ fontSize: 13, color: "#fff" }}>
                                    관리자가 등록한 공지사항을 확인할 수 있는 <br />화면입니다.
                                </Typography>
                            }
                            placement="right"
                            arrow
                        >

                            <HelpIcon sx={{color:'gray', fontSize: 22, mt: "2px", mr: "4px" }} />
                        </Tooltip>
                    </Stack>

                {["R03", "R04"].includes(userRole) && (
                    <Button onClick={() => navigate("/admin/notice/create")} sx={{ marginRight: '-8px' }}>
                        <img src={add} style={{ width: '30px', height: '30px' }} />
                    </Button>
                )}
            </Stack>

            <Stack direction="row" spacing={1} my={2} alignItems={"center"} justifyContent='center' >
                <TextField
                    label="검색어를 입력하세요"
                    variant="outlined"
                    size="small"
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    fullWidth
                    sx={{ width: isMobile ? '250px' : '400px', boxShadow: '1px 2px 4px #9D9D9D', borderRadius: '5px', }}
                />
                <Button variant="outlined" onClick={handleSearch} sx={{ backgroundColor: '#2879E3', color: 'white', height: '35px', }}>검색</Button>
            </Stack>

            <Paper>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ textAlign: 'center', width: '16%' }}>분류</TableCell>
                            <TableCell sx={{ textAlign: 'center', width: isMobile ? '50%' : '70%' }}>제목</TableCell>
                            <TableCell sx={{ textAlign: 'center' }}>{notices.create_dt ? notices.create_dt.slice(0, 10) : "날짜"}</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {notices.map((notice) => {
                            const dateObj = new Date(notice.create_dt);
                            const fomattedDate = `${dateObj.getFullYear()}.${(dateObj.getMonth() + 1)
                                .toString()
                                .padStart(2, "0")}.${dateObj.getDate().toString().padStart(2, "0")}`;
                            return (
                                <TableRow
                                    key={notice.id}
                                    onClick={() => navigate(getNoticeDetailPath(userRole, notice.notice_id))}
                                    sx={{ cursor: 'pointer' }}
                                >

                                    <TableCell sx={{ textAlign: 'center' }}>
                                        <Chip p={0} label={noticeTypeMap[notice.target_type]} color="primary" sx={{ width: isMobile ? '43px' : '65px', fontSize: isMobile ? '10px' : '12px' }} />
                                    </TableCell>
                                    <TableCell sx={{ textAlign: 'center',  whiteSpace: 'pre-wrap',wordBreak: 'break-word',  }} >{notice.title}</TableCell>
                                    <TableCell sx={{ textAlign: 'center', width: '140px' }}>{notice.create_dt.slice(0, 10)}</TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </Paper>

            <Box mt={2} display="flex" justifyContent="center">
                <Pagination
                    count={totalPages}
                    page={currentPage}
                    onChange={(_, value) => setCurrentPage(value)}
                    shape="rounded"
                    color="primary"
                    siblingCount={1}
                    boundaryCount={1}
                />
            </Box>
        </Box>
    );
}
