import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Card,
  Typography,
  Stack,
  TextField,
  Divider,
  Chip,
  InputAdornment,
  Checkbox,
  Paper,
  FormControlLabel
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import axios from "../common/axiosInstance"
import PasswordConfirmDialog from "../components/PasswordConfirmDialog";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import { useAlert } from "../components/CommonAlert";
import Tooltip from "@mui/material/Tooltip";
import HelpIcon from '@mui/icons-material/Help';

const BASE_URL = process.env.REACT_APP_API_URL;

export default function MemberUserEditPage() {
  const [userInfo, setUserInfo] = useState(null);
  const [tech, setTech] = useState("");
  const [experience, setExperience] = useState("");
  const [git, setGit] = useState("");
  const [portfolio, setPortfolio] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [gitError, setGitError] = useState(false);
  const [portfolioError, setPortfolioError] = useState(false);
  const [selectedTechs, setSelectedTechs] = useState([]);
  const [techStacks, setTechStacks] = useState({});
  const [skillDetails, setSkillDetails] = useState({});

  const navigate = useNavigate();
  const { showAlert } = useAlert();

  const isValidURL = (url) => {
    try {
      // http나 https 없으면 http:// 붙이기
      const withProtocol = url.startsWith("http://") || url.startsWith("https://")
        ? url
        : "http://" + url;

      const parsed = new URL(withProtocol);
      return parsed.protocol === "http:" || parsed.protocol === "https:";
    } catch {
      return false;
    }
  };

  const isValidGitURL = (url) =>
    /^(https?:\/\/)?(www\.)?(github\.com|gitlab\.com|bitbucket\.org)\/.+/.test(url);

  const toggleTech = (tech) => {
    setSelectedTechs((prev) => {
      const exists = prev.some((t) => t.code_id === tech.code_id);
      if (exists) {
        const updated = prev.filter((t) => t.code_id !== tech.code_id);
        const newDetails = { ...skillDetails };
        delete newDetails[tech.code_id];
        setSkillDetails(newDetails);
        return updated;
      } else {
        setSkillDetails((prev) => ({
          ...prev,
          [tech.code_id]: { is_fresher: false, years: 0 },
        }));
        return [...prev, tech];
      }
    });
  };

  const handleSkillDetailChange = (code_id, field, value) => {
    setSkillDetails((prev) => ({
      ...prev,
      [code_id]: {
        ...prev[code_id],
        [field]: field === "years" ? parseInt(value) || 0 : value,
      },
    }));
  };

  useEffect(() => {
    const token = sessionStorage.getItem("token");

    axios
      .get(`${BASE_URL}/user/tech-stacks`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setTechStacks(res.data))
      .catch((err) => console.error("기술 스택 불러오기 실패", err));

    axios
      .get(`${BASE_URL}/user/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setUserInfo(res.data);
        setTech(res.data.tech || "");
        setExperience(res.data.experience || "");
        setGit(res.data.git || "");
        setPortfolio(res.data.portfolio || "");
        setSelectedTechs(res.data.skills || []);
        const details = {};
        (res.data.skills || []).forEach((s) => {
          details[s.code_id] = {
            is_fresher: s.is_fresher === "Y",
            years: s.is_fresher === "Y" ? 0 : s.years || 0,
          };
        });
        setSkillDetails(details);
      })
      .catch((err) => {
        console.error("회원 정보 불러오기 실패", err);
      });
  }, []);

  const handleSubmit = async (password) => {
    const normalizedLink1 = normalizeLink(git);
    if (git && !normalizedLink1) {
      return showAlert("유효하지 않은 Git 주소입니다.");
    }
    const normalizedLink2 = normalizeLink(portfolio);
    if (portfolio && !normalizedLink2) {
      return showAlert("유효하지 않은 포트폴리오 주소입니다.");
    }

    try {
      const token = sessionStorage.getItem("token");

      await axios.post(
        `${BASE_URL}/member/verify-password`,
        { password },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      await axios.put(
        `${BASE_URL}/member/userupdate`,
        {
          tech,
          experience,
          git: normalizedLink1,
          portfolio: normalizedLink2,
          skills: selectedTechs.map((skill) => {
            const detail = skillDetails[skill.code_id] || {};
            return {
              code_id: skill.code_id,
              code_name: skill.skill_name || skill.code_name || skill.label,
              parent_code: skill.parent_code,
              is_fresher: detail.is_fresher ? "Y" : "N",
              years: detail.is_fresher ? String(0) : String(detail.years) || String(0),
            };
          }),
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      showAlert("회원정보가 수정되었습니다!");
      navigate("/member/userinfo");
    } catch (err) {
      console.error("수정 실패", err);
      showAlert("수정 중 오류 발생");
    }
  };

  const isValidHostname = (hostname) => {
    // 숫자만 (ex: 652165165) → ❌
    if (/^[0-9]+$/.test(hostname)) return false;

    // 점(.)이 없음 → ❌ (ex: "localhost"도 거름)
    if (!hostname.includes(".")) return false;

    // IPv4 주소 (0~255 범위 숫자들) → ❌
    if (/^(\d{1,3}\.){3}\d{1,3}$/.test(hostname)) return false;

    // 도메인이 숫자로만 구성된 label로 시작하는 경우 막기
    if (/^[0-9]+\./.test(hostname)) return false;

    // 여기를 통과하면 도메인처럼 생긴 걸로 판단 → ✅
    return true;
  };

  const normalizeLink = (url) => {
    if (!url || typeof url !== "string") return "";

    const trimmed = url.trim();

    try {
      const parsed = new URL(trimmed);
      if (!isValidHostname(parsed.hostname)) return ""; // 유효하지 않으면 거름
      return parsed.href;
    } catch (e) {
      // www.가 이미 있으면 그대로, 없으면 붙여줌
      const fixed = trimmed.startsWith("www.")
        ? `https://${trimmed}`
        : `https://www.${trimmed}`;
        
      try {
        const parsed = new URL(fixed);
        if (!isValidHostname(parsed.hostname)) return "";
        return parsed.href;
      } catch {
        return "";
      }
    }
  };

  if (!userInfo) return <Typography>로딩 중...</Typography>;

  return (
    <>
      <Box sx={{ p: 2, pt: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
          
            <Stack sx={{display:'flex', flexDirection:'row'}}>
              
              <Typography
                variant="h4"
                fontWeight="bold"
                gutterBottom
                sx={{ mb: 0 }}
              >
                회원정보 수정
              </Typography>
              <Tooltip
            title={
              <Typography sx={{ fontSize: 13, color: "#fff" }}>
                회원정보를 수정 할 수 있는 페이지입니다.
              </Typography>
            }
            placement="right"
            arrow
          >
            <HelpIcon sx={{ fontSize:22, mt:"2px",mr: "4px"}} />  
          </Tooltip>
            </Stack>
          </Box>
          <Card sx={{ p: 4, height: "auto" }}>
            <Typography variant="h6" gutterBottom>
              안녕하세요! <strong>{userInfo.nickname}</strong>님 ({userInfo.user_id})
            </Typography>

            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
              <Typography>
                {userInfo.email} / {userInfo.phone || "-"}
              </Typography>
            </Box>

            <Divider sx={{ borderBottomWidth: 2, borderColor: "black", mb: 3 }} />

            <Stack spacing={2}>
              <Box sx={{ display: "flex", gap: 4 }}>
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

              <Box sx={{ display: "flex", alignItems: "center" }}>
                <Typography sx={{ width: 150, fontWeight: "bold" }}>Git 주소</Typography>
                <TextField
                  fullWidth
                  size="small"
                  value={git}
                  error={gitError}
                  helperText={gitError ? "올바른 Git 주소를 입력해주세요." : ""}
                  placeholder="ex) https://github.com/username/repo"
                  onChange={(e) => {
                    const val = e.target.value;
                    setGit(val);
                    setGitError(val && !isValidURL(val));
                  }}
                />
              </Box>

              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <Typography sx={{ width: 150, fontWeight: "bold" }}>
                  포트폴리오 주소
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  value={portfolio}
                  error={portfolioError}
                  helperText={
                    portfolioError ? "올바른 URL 형식으로 입력해주세요." : ""
                  }
                  placeholder="ex) https://yourportfolio.com"
                  onChange={(e) => {
                    const val = e.target.value;
                    setPortfolio(val);
                    setPortfolioError(val && !isValidURL(val));
                  }}
                />
              </Box>

              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                기술 스택 선택
              </Typography>
              {Object.entries(techStacks).map(([category, techs]) => (
                <Box
                  key={category}
                  sx={{ border: "1px solid #ddd", borderRadius: 2, p: 2, mb: 2 }}
                >
                  <Typography variant="subtitle1" fontWeight="bold" mb={1}>
                    {category}
                  </Typography>
                  <Stack direction="row" gap={1} flexWrap="wrap">
                    {techs.map((tech) => (
                      <Chip
                        key={tech.code_id}
                        label={tech.label || tech.code_name}
                        clickable
                        color={
                          selectedTechs.some((t) => t.code_id === tech.code_id)
                            ? "primary"
                            : "default"
                        }
                        onClick={() => toggleTech(tech)}
                      />
                    ))}
                  </Stack>
                </Box>
              ))}

              {selectedTechs.map((tech) => (
                <Paper key={tech.code_id} sx={{ p: 2, bgcolor: "#fafafa" }}>
                  <Typography variant="subtitle2" fontWeight="bold">
                    {tech.label || tech.skill_name} 경력 입력
                  </Typography>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <TextField
                      size="small"
                      label="경력(년)"
                      type="number"
                      value={
                        skillDetails[tech.code_id]?.is_fresher
                          ? 0
                          : skillDetails[tech.code_id]?.years || ""
                      }
                      disabled={skillDetails[tech.code_id]?.is_fresher}
                      onChange={(e) =>
                        handleSkillDetailChange(
                          tech.code_id,
                          "years",
                          e.target.value
                        )
                      }
                      InputProps={{
                        endAdornment: <InputAdornment position="end">년</InputAdornment>,
                      }}
                      sx={{ width: 120 }}
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={skillDetails[tech.code_id]?.is_fresher || false}
                          onChange={(e) =>
                            handleSkillDetailChange(
                              tech.code_id,
                              "is_fresher",
                              e.target.checked
                            )
                          }
                        />
                      }
                      label="신입"
                    />
                  </Stack>
                </Paper>
              ))}
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
        </Box>
      </>
      );
}
