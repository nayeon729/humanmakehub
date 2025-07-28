import React, { useState, useEffect } from "react";
import { Box, Typography, Button, TextField, Container, Paper, FormControlLabel, Checkbox, Chip, Stack } from "@mui/material";
import { useNavigate } from "react-router-dom";
import axios from "../common/axiosInstance"
import EmailTimer from "./EmailTimer";
import { useAlert } from "../components/CommonAlert";

const TECH_STACKS = {
  "프론트엔드": ["React", "Vue.js", "Angular", "Next.js", "JavaScript", "TypeScript", "HTML/CSS"],
  "백엔드": ["Node.js", "Python", "Django", "FastAPI", "Spring", "Java", "PHP", "C#"],
  "모바일 개발": ["Flutter", "React Native", "Swift", "Kotlin"],
  "데이터베이스": ["MySQL", "PostgreSQL", "MongoDB", "Oracle", "Redis"],
  "서버 및 클라우드": ["AWS", "Azure", "Google Cloud", "Docker", "Kubernetes"],
  "디자인 툴": ["Figma", "Adobe XD", "Photoshop", "Illustrator", "Sketch"],
  "협업/기타 툴": ["Git", "GitHub", "GitLab", "Slack", "Notion", "Jira"]
};

export default function RegisterPage() {
  const [startTimer, setStartTimer] = useState(false);
  const navigate = useNavigate();
  const [role, setRole] = useState("");
  const [form, setForm] = useState({
    username: "", email: "", password: "", confirmPassword: "",
    phone: "", company: "", portfolio: "", github: "", nickname: "", agreeTerms: false
  });
  const [techStacks, setTechStacks] = useState({});
  const [selectedTechs, setSelectedTechs] = useState([]);
  const [experience, setExperience] = useState({});
  const [usernameChecked, setUsernameChecked] = useState(false);
  const [emailChecked, setEmailChecked] = useState(false);
  const [nicknameChecked, setNicknameChecked] = useState(false);
  const [code, setCode] = useState("");
  const [emailSend, setEmailSend] = useState(false);

  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*()_+~`\-=\[\]{};:"\\|,.<>\/?]).{8,}$/;

  const BASE_URL = process.env.REACT_APP_API_URL;
  const { showAlert } = useAlert();
  useEffect(() => {
    axios.get(`${BASE_URL}/user/tech-stacks`)
      .then(res => {
        setTechStacks(res.data);
      })
      .catch(err => {
        console.error("기술 스택 불러오기 실패", err);
      });
  }, []);

  const handleFormChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const toggleTech = (tech) => {
    setSelectedTechs((prev) => {
      const exists = prev.some((t) => t.code_id === tech.code_id);
      if (exists) {
        return prev.filter((t) => t.code_id !== tech.code_id);
      } else {
        return [...prev, tech];
      }
    });

    setExperience((prev) => {
      const newExp = { ...prev };
      if (prev[tech.label]) {
        delete newExp[tech.code_id];
      } else {
        newExp[tech.label] = { years: "", isNewbie: false };
      }
      return newExp;
    });
  };

  const handleExpChange = (tech, field, value) => {
    setExperience((prev) => ({
      ...prev,
      [tech.label]: {
        ...prev[tech.label],
        [field]: field === "isNewbie" ? value : value.replace(/\D/, ""),
      },
    }));
  };

  const checkDuplicate = async (field) => {
    try {
      const res = await axios.post(`${BASE_URL}/user/check-duplicate`, {
        user_id: form.username,
      });

      if (field === "user_id") {
        if (res.data.user_idExists) {
          showAlert("이미 사용 중인 아이디입니다.");
          setUsernameChecked(false);
        } else {
          showAlert("사용 가능한 아이디입니다.");
          setUsernameChecked(true);
        }
      }

      if (field === "email") {
        const email = form.email.trim();

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          showAlert("❌ 이메일 형식이 올바르지 않습니다.");
          setEmailChecked(false);
          return;
        }
        const res = await axios.post(`${BASE_URL}/user/check-duplicate`, {
          email: form.email,
        });
        if (res.data.emailExists) {
          showAlert("이미 등록된 이메일입니다.");
          setEmailChecked(false);
        } else {
          showAlert("사용 가능한 이메일입니다.");
          setEmailSend(true);
          setStartTimer(false); // 먼저 false로 껐다가
          setTimeout(() => setStartTimer(true), 10); // 다시 켜주기 (리셋)
        }
      }

    } catch (err) {
      console.error("중복 확인 실패", err);
    }
  };

  const handleVerify = async () => {
    if (!code.trim()) {
      showAlert("인증 코드를 입력해주세요!");
      return;
    }

    try {
      const res = await axios.get(`${BASE_URL}/user/verify-email`, {
        params: { code: code }, // 👈 이렇게 code를 전달해!
      });
      showAlert(res.data.message);
      setEmailChecked(true);
      setStartTimer(false);    // ✅ 타이머 중지
    } catch (err) {
      showAlert(err.response?.data?.detail || "인증 실패");
    }
  };

  const handleSubmit = async () => {
    if (!form.agreeTerms) {
      return showAlert("이용약관에 동의해야 합니다.");
    }
    if (!passwordRegex.test(form.password)) {
      return showAlert("❌ 비밀번호는 8자 이상, 영문+숫자+특수문자를 포함해야 합니다.");
    }
    if (form.password !== form.confirmPassword) {
      return showAlert("비밀번호가 일치하지 않습니다.");
    }
    if (!usernameChecked || !emailChecked) {
      return showAlert("아이디/이메일/이름 중복확인을 완료하세요.");
    }

    try {
      const payload = {
        user_id: form.username,
        nickname: form.nickname,
        email: form.email,
        password: form.password,
        confirm_password: form.confirmPassword,
        role,
        phone: form.phone || "",         // ✅ null 방지
        company: form.company || "",
        portfolio: form.portfolio || "",
        skills: selectedTechs.map((tech) => ({
          code_id: tech.code_id,
          years: experience[tech.label]?.isNewbie ? "신입" : `${experience[tech.label]?.years}년`,
          code_name: tech.label,
          parent_code: tech.parent_code,
        }))
      };

      await axios.post(`${BASE_URL}/user/register`, payload);
      showAlert("회원가입 완료!");
      navigate("/login");
    } catch (error) {
      console.error("회원가입 실패", error);
      showAlert("회원가입 실패: " + (error.response?.data?.detail || "서버 오류"));
    }
  };

  return (
    <Box
      sx={{
        background: "#f0f4f8",
        minHeight: "92vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Container maxWidth="md" sx={{ display: "flex", justifyContent: "center", alignItems: "center", }}>
        {!role ? (
          <>
            <Paper sx={{ p: 4, borderRadius: 4, boxShadow: 5, marginBottom: "100px", width: "500px" }}>
              <Typography variant="h5" align="center" fontWeight="bold">가입 유형 선택</Typography>
              <Stack spacing={2} mt={4}>
                <Button variant="contained" size="large" onClick={() => setRole("R01")}>클라이언트 가입</Button>
                <Button variant="outlined" size="large" onClick={() => setRole("R02")}>멤버 가입</Button>
              </Stack>
            </Paper>
          </>
        ) : (
          <>
            <Paper sx={{ p: 4, borderRadius: 4, boxShadow: 5, mt: 5, mb: 5, width: "800px" }}>
              <Typography variant="h5" align="center" fontWeight="bold" sx={{ mb: 5 }}>{role === "R01" ? "클라이언트" : "멤버"} 회원가입</Typography>
              <Stack direction="row" spacing={1} alignItems="center">
                <TextField
                  fullWidth
                  label="이름"
                  name="nickname"
                  value={form.nickname}
                  onChange={handleFormChange}
                />
              </Stack>
              <Stack spacing={2} mt={3}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <TextField fullWidth label="아이디" name="username" value={form.username} onChange={handleFormChange} />
                  <Button variant="outlined" onClick={() => checkDuplicate("user_id")} sx={{ width: "150px", paddingY: 2 }}>중복확인</Button>
                </Stack>
                <Stack direction="row" spacing={1} alignItems="center">
                  <TextField
                    fullWidth
                    label="이메일 (예: example@domain.com)"
                    name="email"
                    type="email"
                    placeholder="example@example.com"
                    value={form.email}
                    onChange={handleFormChange}
                  />
                  <Button variant="outlined" onClick={() => checkDuplicate("email")} sx={{ width: "150px", paddingY: 2 }}>이메일 인증</Button>
                </Stack>
                <Stack spacing={1} alignItems="center">
                  {emailSend && (
                    <>
                      {startTimer && (
                        <div>
                          <span>유효 시간: </span>
                          <EmailTimer start={startTimer} onExpire={() => showAlert("시간 초과")} />
                        </div>
                      )}
                      <Box sx={{ display: "flex", width: "100%", gap: 1 }}>
                        <TextField
                          label="인증 코드"
                          variant="outlined"
                          fullWidth
                          value={code}
                          onChange={(e) => setCode(e.target.value)}
                        />

                        <Button variant="contained" color="primary" onClick={handleVerify} disabled={emailChecked} sx={{ width: "150px", paddingY: 2 }}>
                          인증 확인
                        </Button>
                      </Box>
                    </>
                  )}
                </Stack>

                <TextField type="password" label="비밀번호" name="password" value={form.password} onChange={handleFormChange}
                  error={form.password.length > 0 && !passwordRegex.test(form.password)}
                  helperText={
                    form.password.length > 0 && !passwordRegex.test(form.password)
                      ? "8자 이상, 영문+숫자+특수문자 포함"
                      : ""
                  } />
                <TextField type="password" label="비밀번호 확인" name="confirmPassword" value={form.confirmPassword} onChange={handleFormChange} />

                <TextField
                  label="휴대전화 (-를 생략하고 입력하세요)"
                  name="phone"
                  value={form.phone}
                  onChange={handleFormChange}
                />

                {role === "R01" && (
                  <TextField label="회사명 (선택)" name="company" value={form.company} onChange={handleFormChange} />
                )}

                {role === "R02" && (
                  <>
                    {Object.entries(techStacks).map(([category, techs]) => (
                      <Box key={category} sx={{ border: "1px solid #ddd", borderRadius: 2, p: 2 }}>
                        <Typography variant="subtitle1" fontWeight="bold" mb={1}>{category}</Typography>
                        <Stack direction="row" gap={1} flexWrap="wrap">
                          {techs.map((tech) => (
                            <Chip key={tech.code_id} label={tech.label} clickable color={selectedTechs.some((t) => t.code_id === tech.code_id) ? "primary" : "default"} onClick={() => toggleTech(tech)} />
                          ))}
                        </Stack>
                      </Box>
                    ))}
                    {selectedTechs.map((tech) => (
                      <Paper key={tech.code_id} sx={{ p: 2, bgcolor: "#fafafa" }}>
                        <Typography variant="subtitle2" fontWeight="bold">{tech.label} 경력 입력</Typography>
                        <Stack direction="row" spacing={2} alignItems="center">
                          <TextField size="small" label="경력(년)" disabled={experience[tech.label]?.isNewbie} value={experience[tech.label]?.years || ""} onChange={(e) => handleExpChange(tech, "years", e.target.value)} />
                          <FormControlLabel control={<Checkbox checked={experience[tech.label]?.isNewbie || false} onChange={(e) => handleExpChange(tech, "isNewbie", e.target.checked)} />} label="신입" />
                        </Stack>
                      </Paper>
                    ))}
                    <TextField label="포트폴리오 링크 (선택)" name="portfolio" value={form.portfolio} onChange={handleFormChange} />

                    <TextField label="깃허브 링크 (선택)" name="github" value={form.github} onChange={handleFormChange} />
                  </>
                )}
                <Box
                  sx={{
                    border: "1px solid #ccc",
                    borderRadius: 2,
                    backgroundColor: "#f9f9f9",
                    p: 2,
                    fontSize: "0.85rem",
                    color: "#555",
                  }}
                >
                  <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                    [이용약관 주요 내용 요약]
                  </Typography>
                  <ul style={{ paddingLeft: "1.2rem", margin: 0 }}>
                    <li><strong>수집 항목:</strong> 아이디, 비밀번호, 이메일, 연락처, 기술 스택, 경력 등</li>
                    <li><strong>이용 목적:</strong> 프로젝트 매칭, 작업 관리, 정산 기능 제공 등 플랫폼 운영 전반</li>
                    <li><strong>보관 기간:</strong> 회원 탈퇴 시까지 또는 관련 법령에 따라 보관</li>
                    <li><strong>제3자 제공:</strong> 원칙적으로 없음. 단, 법령에 따라 예외적으로 제공 가능</li>
                    <li><strong>회원 권리:</strong> 언제든지 본인의 개인정보 조회, 수정, 삭제, 처리 정지 요청 가능</li>
                    <li><strong>유의사항:</strong> 회원가입 시 본 약관에 동의하는 것으로 간주됩니다</li>
                  </ul>
                </Box>
                <Box sx={{ display: "flex", justifyContent: "center" }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={form.agreeTerms}
                        onChange={(e) => setForm({ ...form, agreeTerms: e.target.checked })}
                      />
                    }
                    label="이용약관 동의"
                  />
                </Box>
                <Button variant="contained" size="large" onClick={handleSubmit} disabled={!usernameChecked || !emailChecked}>
                  가입 완료
                </Button>
              </Stack>
            </Paper>
          </>
        )}

      </Container>
    </Box>
  );
}
