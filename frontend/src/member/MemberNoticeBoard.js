import React, { useState, useEffect } from "react";
import {
    Box, Typography, Button, TextField, Table, TableHead, TableRow,
    TableCell, TableBody, Paper, Stack, Chip, Pagination
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Notice from "../assets/notice.png";

const BASE_URL = process.env.REACT_APP_API_URL;

export default function AdminNoticeListPage() {
    const [notices, setNotices] = useState([]);
    const [searchKeyword, setSearchKeyword] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const itemsPerPage = 10;
    const navigate = useNavigate();

    const fetchNotices = async (page = 1, keyword = "") => {
        try {
            const token = localStorage.getItem("token");
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

    return (
        <Box sx={{ flex: 1, p: 3 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="h4" fontWeight="bold" gutterBottom>
                    <img src={Notice} alt="공지사항" width={40} height={40} style={{ verticalAlign: "middle", marginRight: 8 }} />
                    공지사항
                </Typography>
            </Stack>
            <Box display="flex" justifyContent="center">
                <Stack direction="row" spacing={1} my={2}>
                    <TextField
                        label="검색어를 입력하세요"
                        variant="outlined"
                        size="small"
                        value={searchKeyword}
                        onChange={(e) => setSearchKeyword(e.target.value)}
                        sx={{
                            width: 450,
                            borderRadius: 3,
                            boxShadow: "0px 2px 5px rgba(0, 0, 0, 0.1)",
                            "& fieldset": {
                                borderRadius: 3,
                            },
                        }}
                    />
                    <Button
                        variant="contained"
                        size="small"
                        onClick={handleSearch}
                        sx={{
                            backgroundColor: "#1a73e8",
                            borderRadius: 3,
                            color: "#fff",
                            fontWeight: "bold",
                            px: 3,
                            "&:hover": {
                                backgroundColor: "#1669c1",
                            },
                        }}
                    >
                        검색
                    </Button>
                </Stack>
            </Box>

            <Paper
                sx={{
                    backgroundColor: "#fff",
                    p: 1.5,
                    mt: 2,
                    borderRadius: 2,
                    position: "relative",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
                }}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell
                                sx={{ pr: 5 }}>분류</TableCell>
                            <TableCell
                                sx={{ pr: 20 }}>제목</TableCell>
                            <TableCell
                                sx={{ pr: 5 }}>{notices.create_dt ? notices.create_dt.slice(0, 10) : "날짜"}</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {notices.map((notice) => (
                            <TableRow key={notice.id} onClick={() => navigate(`/member/notice/${notice.notice_id}`)}>
                                <TableCell>
                                    <Chip label={noticeTypeMap[notice.target_type]} color="primary" size="small" />
                                </TableCell>
                                <TableCell>{notice.title}</TableCell>
                                <TableCell>{notice.create_dt.slice(0, 10).replace(/-/g, ".")}</TableCell>
                            </TableRow>
                        ))}
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
