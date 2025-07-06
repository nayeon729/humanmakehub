import React, { useState, useEffect } from "react";
import {
    Box, Typography, Button, TextField, Table, TableHead, TableRow,
    TableCell, TableBody, Paper, Stack, Chip, Pagination
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const BASE_URL = "http://127.0.0.1:8000";

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
        <Box sx={{ p: 3 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="h4" fontWeight="bold">📢 공지사항</Typography>
            </Stack>

            <Stack direction="row" spacing={1} my={2}>
                <TextField
                    label="검색어를 입력하세요"
                    variant="outlined"
                    size="small"
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    fullWidth
                />
                <Button variant="outlined" onClick={handleSearch}>검색</Button>
            </Stack>

            <Paper>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>분류</TableCell>
                            <TableCell>제목</TableCell>
                            <TableCell>{notices.create_dt ? notices.create_dt.slice(0, 10) : "날짜"}</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {notices.map((notice) => (
                            <TableRow key={notice.id}>
                                <TableCell>
                                    <Chip label={noticeTypeMap[notice.target_type]} color="primary" size="small" />
                                </TableCell>
                                <TableCell>{notice.title}</TableCell>
                                <TableCell>{notice.create_dt.slice(0, 10)}</TableCell>
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
