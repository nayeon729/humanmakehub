import React, { useEffect, useState } from "react";
import {
    Box,
    Button,
    Card,
    Typography,
    Stack,
    TextField,
    Divider,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import PasswordConfirmDialog from "../components/PasswordConfirmDialog";


const BASE_URL = "http://127.0.0.1:8000";

export default function MemberUserEditPage() {
    const [userInfo, setUserInfo] = useState(null);
    const [skills, setSkills] = useState([
        {
            code_id: "",
            code_name: "",
            parent_code: "",
            experience: "", // or "신입"
        },
    ]);
    const [tech, setTech] = useState("");
    const [experience, setExperience] = useState("");
    const [git, setGit] = useState("");
    const [portfolio, setPortfolio] = useState("");
    const [dialogOpen, setDialogOpen] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchUserInfo = async () => {
            try {
                const token = localStorage.getItem("token");
                const res = await axios.get(`${BASE_URL}/user/me`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setUserInfo(res.data);
                setTech(res.data.tech || "");
                setExperience(res.data.experience || "");
                setGit(res.data.git || "");
                setPortfolio(res.data.portfolio || "");
                setSkills(res.data.skills || []);
            } catch (err) {
                console.error("회원 정보 불러오기 실패", err);
            }
        };

        fetchUserInfo();
    }, []);

    const handleSubmit = async (password) => {
        try {
            const token = localStorage.getItem("token");
            await axios.post(`${BASE_URL}/member/verify-password`, { password }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            await axios.put(`${BASE_URL}/member/userupdate`, {
                tech,
                experience,
                git,
                portfolio,
                skills: skills.map(skill => ({
                    ...skill,
                    code_name: skill.skill_name || skill.code_name,
                })),
            }, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const res = await axios.get(`${BASE_URL}/user/me`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setUserInfo(res.data);
            setSkills(res.data.skills || []); //

            alert("회원정보가 수정되었습니다!");
            navigate("/member/userinfo");
        } catch (err) {
            console.error("수정 실패", err);
            alert("수정 중 오류 발생");
        }
    };




    if (!userInfo) return <Typography>로딩 중...</Typography>;

    return (
        <Card sx={{ p: 4 }}>
            <Typography variant="h6" gutterBottom>
                안녕하세요! <strong>{userInfo.nickname}</strong>님 {userInfo.user_id}
            </Typography>

            {/* 연락처 */}
            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
                <Typography>
                    {userInfo.email} / {userInfo.phone || "-"}
                </Typography>
            </Box>

            {/* 보유 기술 스택 */}
            <Box>

                <Stack direction="row" spacing={1} flexWrap="wrap">
                    {userInfo.skills && userInfo.skills.length > 0 ? (
                        userInfo.skills.map((skill) => {
                            const experience =
                                skill.is_fresher === "Y" ? "신입" : `${skill.years}년`;
                            return (
                                <Box
                                    key={skill.code_id}
                                    sx={{
                                        px: 2,
                                        py: 1,
                                        bgcolor: "#f0f0f0",
                                        borderRadius: 3,
                                        mb: 1,
                                    }}
                                >
                                    <Typography variant="body2">
                                        {skill.skill_name} | {experience}
                                    </Typography>
                                </Box>
                            );
                        })
                    ) : (
                        <Typography>보유 기술 없음</Typography>
                    )}
                </Stack>
            </Box>
            <br />

            <Divider sx={{ borderBottomWidth: 2, borderColor: "black", mb: 3 }} />

            <Stack spacing={2}>

                {/* 주요 기술 */}
                <Box sx={{ mt: 4 }}>
                    {/* 주요 기술 + 경험 */}
                    <Box sx={{ display: "flex", gap: 4, mb: 4 }}>
                        {/* 주요 기술 */}
                        <Box sx={{ flex: 1 }}>
                            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                                주요 기술
                            </Typography>
                            <TextField
                                multiline
                                minRows={4}
                                fullWidth
                                size="small"
                                value={tech}
                                onChange={(e) => setTech(e.target.value)}

                            />
                        </Box>

                        {/* 경험 */}
                        <Box sx={{ flex: 1 }}>
                            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                                경험
                            </Typography>
                            <TextField
                                multiline
                                minRows={4}
                                fullWidth
                                size="small"
                                value={experience}
                                onChange={(e) => setExperience(e.target.value)}
                            />
                        </Box>
                    </Box>
                </Box>
                {/* Git 주소 */}
                <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                    <Typography sx={{ width: 150, fontWeight: "bold" }}>Git 주소</Typography>
                    <TextField
                        placeholder="ex) https://github.com/깃주소"
                        size="small"
                        fullWidth
                        value={git}
                        onChange={(e) => setGit(e.target.value)}
                    />
                </Box>

                {/* 포트폴리오 주소 */}
                <Box sx={{ display: "flex", alignItems: "center", mb: 4 }}>
                    <Typography sx={{ width: 150, fontWeight: "bold" }}>
                        포트폴리오 주소
                    </Typography>
                    <TextField
                        placeholder="ex) https://포트폴리오 주소"
                        size="small"
                        fullWidth
                        value={portfolio}
                        onChange={(e) => setPortfolio(e.target.value)}
                    />
                </Box>

            </Stack>

            <Box sx={{ mt: 4, textAlign: "center" }}>
                <Button variant="contained" onClick={() => setDialogOpen(true)}>
                    수정
                </Button>
                <PasswordConfirmDialog
                    open={dialogOpen}
                    onConfirm={(password) => {
                        setDialogOpen(false);
                        handleSubmit(password);
                    }}
                    onCancel={() => setDialogOpen(false)}
                />
            </Box>
        </Card>
    );
}

function DisplayItem({ label, value }) {
    return (
        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
            <Typography color="text.secondary">{label}</Typography>
            <Typography fontWeight="bold">{value}</Typography>
        </Box>
    );
}