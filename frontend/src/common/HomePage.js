import React, { useState } from "react";
import {
  Box, IconButton, Button,
  Typography, Grid, Stack, Chip, TextField
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import { useNavigate } from "react-router-dom";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination, Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";
import "./HomePage.css"; // 이 파일에 CSS 클래스 작성해야 함
import Drawer from "@mui/material/Drawer";
import { useMediaQuery, useTheme } from "@mui/material";
import FloatingQRCode  from "../common/FloatingQRCode";



export default function HomePage() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const handleDrawerToggle = () => setMobileOpen(!mobileOpen);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));       // ≤600px
  const isTablet = useMediaQuery(theme.breakpoints.between("sm", "md")); // 601px~900px

  const cardStyle = {
    flex: isMobile ? "1 1 100%" : isTablet ? "1 1 45%" : "1 1 280px", // 반응형 대응
    minWidth: 240,
    maxWidth: 320,
    backgroundColor: "#3a3d4d",
    borderRadius: 16,
    padding: "30px 24px",
    boxShadow: "0 10px 24px rgba(0,0,0,0.25)",
    transition: "transform 0.3s, box-shadow 0.3s",
    cursor: "pointer",
    border: "2px solid transparent"
  };

  const techStacks = [
    "React-native", "Firebase", "Kotlin", "Node.js", "React", "Django",
    "Python", "AWS", "MySQL", "PostgreSQL", "Chat GPT", "Gemini",
    "FastAPI", "Spring Boot", "Next.js", "Express"
  ];

  const operatingSystems = [
    "Android", "iOS", "Linux", "Windows", "macOS", "Ubuntu", "CentOS"
  ];

  const navItems = [
    { label: "Service", id: "serviceSection" },
    { label: "Process", id: "processSection" },
    { label: "Portfolio", id: "portfolioSection" },
    { label: "About", id: "aboutSection" },
    { label: "Company", id: "companySection" },
    { label: "Contact", id: "contactSection" }
  ];

  const heroSlides = [
    {
      title: (
        <>
          휴먼메이크허브는,<br />
          당신의 <span style={{ color: "#ff3f3f" }}>팀</span>입니다
        </>
      ),
      desc: (
        <>
          각자의 전문성이 하나로 모여<br />
          완성도 높은 결과를 만들어냅니다.
        </>
      ),
      frameClass: "hero_frame_1",
    },
    {
      title: (
        <>
          한 번에 하나의 <span style={{ color: "#ff3f3f" }}>프로젝트</span>,<br />
          진정성 있는 몰입
        </>
      ),
      desc: (
        <>
          우리는 수많은 일보다<br />
          단 하나의 약속에 집중합니다.
        </>
      ),
      frameClass: "hero_frame_2",
    },
    {
      title: (
        <>
          좋은 <span style={{ color: "#ff3f3f" }}>협업</span>은<br />
          좋은 사람이 만나는 일입니다
        </>
      ),
      desc: (
        <>
          기술보다 먼저, 사람을 믿고<br />
          함께할 수 있는 문화를 만듭니다.
        </>
      ),
      frameClass: "hero_frame_3",
    },
    {
      title: (
        <>
          우리는<br />
          <span style={{ color: "#ff3f3f" }}>과정</span>을 소중히 여깁니다
        </>
      ),
      desc: (
        <>
          함께 만든 과정이 있어야<br />
          결과물에 담긴 의미도 깊어집니다.
        </>
      ),
      frameClass: "hero_frame_4",
    },
  ];


  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedItems, setSelectedItems] = useState([]);
  const handleToggle = (item) => {
    setSelectedItems((prev) =>
      prev.includes(item)
        ? prev.filter((i) => i !== item) // 선택 해제
        : [...prev, item]               // 선택 추가
    );
  };

  const askSend = () => {
    // e?.preventDefault?.(); // 새로고침 방지
    console.log("askSend ");
    alert("askSend");
  }

  return (
    <Box className="homePage">
      {/* Fixed Top Navigation */}
      <Box
        component="nav"
        sx={{
          position: "fixed",
          top: 0,
          width: "100%",
          backgroundColor: "#ffffff", // 밝고 선명한 배경
          zIndex: 1200,
          boxShadow: "0 4px 20px -4px rgba(0, 0, 0, 0.5)",
          px: { xs: 2, md: 4 },
          py: 2.5,
          borderBottom: "1px solid #eee"
        }}
      >
        <Box
          sx={{
            maxWidth: 1280,
            mx: "auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between"
          }}
        >
          {/* 로고 + 텍스트 */}
          <a
            href="#top"
            style={{
              display: "flex",
              alignItems: "center",
              textDecoration: "none"
            }}
          >
            <span style={{
              marginLeft: 10,
              fontWeight: 700,
              fontSize: 24,
              color: "#1976d2",
              letterSpacing: "-0.3px"
            }}>
              HumanMakeHub
            </span>
          </a>

          {/* PC 메뉴 */}
          <Box
            component="ul"
            sx={{
              display: { xs: "none", md: "flex" },
              position: "absolute",             // ✅ 절대 위치
              left: "50%",                      // ✅ 가운데로 이동
              transform: "translateX(-50%)",   // ✅ 정확한 가운데 정렬
              listStyle: "none",
              gap: 4,
              m: 0,
              p: 0
            }}
          >
            {navItems.map((item, idx) => (
              <li key={idx}>
                <a
                  href={`#${item.id}`}
                  style={{
                    fontSize: 16,
                    fontWeight: 600,
                    color: "#444",
                    textDecoration: "none",
                    padding: "8px 12px",
                    borderRadius: 8,
                    transition: "all 0.3s ease"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = "#fff";
                    e.currentTarget.style.backgroundColor = "#1976d2";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = "#444";
                    e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  {item.label}
                </a>
              </li>
            ))}
          </Box>

          {/* 모바일 햄버거 버튼 */}
          <Box sx={{ display: { xs: "block", md: "none" } }}>
            <IconButton
              onClick={handleDrawerToggle}
              sx={{
                color: "#1976d2",
                borderRadius: 2,
                p: 1.5,
                mr: 4,
                '&:hover': { backgroundColor: "#e0e0e0" }
              }}
            >
              <MenuIcon sx={{ fontSize: 26 }} />
            </IconButton>
          </Box>
        </Box>
      </Box>

      <Drawer
        anchor="right"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        onMouseLeave={handleDrawerToggle}
        sx={{
          "& .MuiDrawer-paper": {
            width: 260,
            padding: "24px",
            backgroundColor: "#fff",
          }
        }}
      >
        <Box>
          {/* 🔐 상단 로그인/회원가입 버튼 */}
          <Box sx={{ mb: 3 }}>
            <Button
              fullWidth
              variant="contained"
              sx={{ mb: 1, backgroundColor: "#1976d2", color: "#fff", fontWeight: "bold" }}
              onClick={() => {
                handleDrawerToggle();
                navigate("/login");
              }}
            >
              로그인
            </Button>
            <Button
              fullWidth
              variant="outlined"
              sx={{ borderColor: "#1976d2", color: "#1976d2", fontWeight: "bold" }}
              onClick={() => {
                handleDrawerToggle();
                navigate("/register");
              }}
            >
              회원가입
            </Button>
          </Box>

          {/* 📋 메뉴 항목 리스트 */}
          {navItems.map((item, idx) => (
            <Box key={idx} mb={2}>
              <a
                href={`#${item.id}`}
                onClick={handleDrawerToggle}
                style={{
                  display: "block",
                  padding: "12px 0",
                  fontSize: 18,
                  fontWeight: 600,
                  color: "#1976d2",
                  textDecoration: "none",
                  borderBottom: "1px solid #eee"
                }}
              >
                {item.label}
              </a>
            </Box>
          ))}
        </Box>
      </Drawer>

      {/* Top Section */}
      <section
        style={{
          backgroundColor: "#1976d2",
          color: "#fff",
          padding: "60px 20px",
          textAlign: "center",
          position: "relative",
        }}
      >
        <div style={{ maxWidth: 1000, margin: "auto", marginTop: 80, marginBottom: 0 }}> {/* ✅ 여백 추가 */}
          <h2 style={{ fontSize: isMobile ? 30 : isTablet ? 30 : 32, fontWeight: "bold", marginBottom: 20 }}>
            당신의 아이디어를 현실로
          </h2>
          <p style={{ fontSize: isMobile ? 14 : isTablet ? 20 : 18, marginBottom: 20 }}>
            1:1 맞춤 컨설팅으로 프로젝트를 시작해보세요.
          </p>
          <Button
            variant="contained"
            size="large"
            sx={{
              bgcolor: "#ffb300",
              color: "#000",
              fontWeight: "bold",
              px: 5,
              borderRadius: 8,
              boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
              transition: "0.3s",
              "&:hover": {
                bgcolor: "#ffb300",
                transform: "translateY(-2px)",
              },
            }}
            onClick={() => {
              const section = document.getElementById("contactSection");
              if (section) {
                section.scrollIntoView({ behavior: "smooth" });
              }
            }}
          >
            지금 바로 문의하기
          </Button>
        </div>
      </section>

      {/* Hero Section */}
      < section className="hero_wrap" style={{ paddingTop: 30, backgroundColor: "#f5f5f5" }
      }>
        <Swiper
          modules={[Autoplay, Pagination, Navigation]}
          slidesPerView={"auto"}
          centeredSlides={true}
          spaceBetween={30}
          loop={true}
          autoplay={{ delay: 4500, disableOnInteraction: false }}
          pagination={{ clickable: true }}
          navigation
          onSlideChange={(swiper) => setActiveIndex(swiper.realIndex)}
          style={{ paddingBottom: 60 }}
        >
          {heroSlides.map((slide, index) => {
            const isActive = index === activeIndex;

            const activeBg = "#ffb300";     // 메인: 안정된 Amber 600
            const inactiveBg = "#fef3c7";   // 연한 크림/노랑
            const activeText = "#212121";   // 짙은 회색 (눈에 잘 띔)
            const inactiveText = "#666666"; // 흐린 회색 (덜 강조됨)

            return (
              <SwiperSlide
                key={index}
                style={{
                  width: isMobile ? "100%" : "30%",
                  backgroundColor: isActive ? activeBg : inactiveBg,
                  color: isActive ? activeText : inactiveText,
                  borderRadius: 12,
                  padding: "80px 80px",
                  boxShadow: isActive
                    ? "0 12px 32px rgba(0,0,0,0.3)"
                    : "0 6px 20px rgba(0,0,0,0.15)",
                  transition: "background-color 0.5s ease, color 0.5s ease",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  textAlign: "center"
                }}
              >
                <h3 style={{ fontSize: isMobile ? 30 : isTablet ? 30 : 32, marginBottom: 20, fontWeight: 700 }}>
                  {slide.title}
                </h3>
                <p style={{ fontSize: isMobile ? 20 : isTablet ? 20 : 20, color: isActive ? "#dcdcdc" : "#999", lineHeight: 1.6 }}>
                  {slide.desc}
                </p>
                <div className={`hero_frame_wrap ${slide.frameClass}`}><span /></div>
              </SwiperSlide>
            );
          })}
        </Swiper>
      </section >

      {/* SERVICE 1 Section */}
      <section
        className="service_wrap"
        id="serviceSection"
        style={{ padding: isMobile ? "64px 16px" : "96px 24px", backgroundColor: "#ffffff" }}
      >
        <div style={{ maxWidth: 1200, margin: "auto" }}>
          {/* 타이틀 */}
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <h3 style={{ fontSize: isMobile ? 20 : 24, color: "#1976d2", fontWeight: 600 }}>SERVICE</h3>
            <strong style={{
              fontSize: isMobile ? 26 : 32,
              color: "#111",
              fontWeight: "bold"
            }}>
              휴먼메이크허브 주요 서비스
            </strong>
          </div>

          {/* 설명 */}
          <div style={{ textAlign: "center", marginBottom: 60 }}>
            <p style={{
              fontSize: isMobile ? 15 : 18,
              fontWeight: 500,
              color: "#444",
              marginBottom: 10
            }}>
              HumanMakeHub는 진정한 협업을 만듭니다.
            </p>
            <span style={{
              fontSize: isMobile ? 13 : 15,
              color: "#666",
              lineHeight: 1.6
            }}>
              프로젝트마다 최적의 팀을 구성하여<br />
              클라이언트와 메이커가 신뢰 속에서 함께 성장하도록 돕습니다.<br />
              기술보다 사람을 먼저 생각하며, 진정한 파트너십을 추구합니다.
            </span>
          </div>

          {/* 카드 목록 */}
          <div style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "20px",
            justifyContent: "center"
          }}>
            {[
              {
                title: "AI 챗봇",
                icon: "🤖",
                items: ["GPT 모델 기반 챗봇", "문서 요약 자동화", "SNS 연동", "DB 학습 처리"]
              },
              {
                title: "앱 개발",
                icon: "📱",
                items: ["React Native", "Kotlin", "IoT 연동", "하이브리드 앱 제작"]
              },
              {
                title: "웹 서비스",
                icon: "🌐",
                items: ["홈페이지 / 쇼핑몰", "클라우드 SaaS", "성능 테스트"]
              },
              {
                title: "데이터 분석",
                icon: "📊",
                items: ["머신러닝", "크롤링", "데이터 시각화", "자연어 처리"]
              }
            ].map((service, idx) => (
              <div
                key={idx}
                style={{
                  flex: "1 1 240px",
                  maxWidth: 230,
                  backgroundColor: "#ffffff",
                  borderRadius: 16,
                  padding: "32px 24px",
                  boxShadow: "0 6px 14px rgba(0,0,0,0.06)",
                  transition: "transform 0.3s, box-shadow 0.3s, border 0.3s",
                  border: "1.5px solid #e0e0e0",
                  cursor: "pointer",
                  display: "flex",                  // ✅ 추가
                  flexDirection: "column",         // ✅ 추가
                  alignItems: "center",            // ✅ 추가
                  textAlign: "center"              // ✅ 추가
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-6px)";
                  e.currentTarget.style.boxShadow = "0 12px 24px rgba(25,118,210,0.2)";
                  e.currentTarget.style.border = "1.5px solid #ffb300";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 6px 14px rgba(0,0,0,0.06)";
                  e.currentTarget.style.border = "1.5px solid #e0e0e0";
                }}
              >
                {/* 아이콘 */}
                <div style={{
                  width: 72,                         // ✅ 키움
                  height: 72,
                  borderRadius: "50%",
                  backgroundColor: "#1976d2",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 36,                      // ✅ 더 큼
                  marginBottom: 20,
                  color: "#fff"
                }}>
                  {service.icon}
                </div>

                {/* 제목 */}
                <strong style={{
                  fontSize: 20,                      // ✅ 키움
                  display: "block",
                  marginBottom: 16,
                  color: "#212121",
                  fontWeight: 700                    // ✅ bold
                }}>
                  {service.title}
                </strong>

                {/* 리스트 */}
                <ul style={{ paddingLeft: 0, listStyle: "none", margin: 0 }}>
                  {service.items.map((item, i) => (
                    <li key={i} style={{
                      fontSize: 14,
                      color: "#555",
                      marginBottom: 8,
                      display: "flex",
                      alignItems: "center"
                    }}>
                      <span style={{
                        display: "inline-block",
                        width: 6,
                        height: 6,
                        backgroundColor: "#ffb300",
                        borderRadius: "50%",
                        marginRight: 10
                      }} />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SERVICE 2 Section */}
      <section id="serviceSection2" style={{ backgroundColor: "#f9f9f9", padding: isMobile ? "60px 16px" : "96px 24px" }}>
        <div style={{ maxWidth: 1200, margin: "auto" }}>
          {/* 타이틀 */}
          <div style={{ textAlign: "center", marginBottom: isMobile ? 36 : 56 }}>
            <h3 style={{ fontSize: isMobile ? 20 : 24, color: "#1976d2", fontWeight: 600 }}>TECHNOLOGY</h3>
            <strong style={{ fontSize: isMobile ? 28 : 36, color: "#111", fontWeight: "bold" }}>
              휴먼메이크허브의 핵심 기술력
            </strong>
          </div>

          {/* 설명 */}
          <div style={{ textAlign: "center", marginBottom: isMobile ? 36 : 56 }}>
            <p style={{ fontSize: isMobile ? 15 : 18, color: "#444", fontWeight: 400, lineHeight: 1.8 }}>
              사람과 기술의 조화를 통해 완성도 높은 프로젝트를 만들어갑니다.<br />
              HumanMakeHub는 최신 기술을 실무에 효과적으로 적용합니다.
            </p>
          </div>

          {/* 카드 그룹 */}
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "32px" }}>
            {[{
              title: "개발 기술",
              icon: "💻",
              color: "#1976d2",
              bg: "#e3f2fd",
              tags: techStacks
            }, {
              title: "운영체제",
              icon: "⚙️",
              color: "#ffb300",
              bg: "#fff8e1",
              tags: operatingSystems
            }].map((card, idx) => (
              <div key={idx} style={{
                flex: "1 1 320px",
                maxWidth: 500,
                background: "linear-gradient(135deg, #fff, #fdfdfd)",
                borderRadius: 20,
                boxShadow: "0 12px 28px rgba(0,0,0,0.06)",
                border: `1px solid ${card.color}30`,
                overflow: "hidden",
                transition: "transform 0.4s ease, box-shadow 0.4s ease"
              }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = "translateY(-8px)";
                  e.currentTarget.style.boxShadow = `0 16px 32px rgba(0,0,0,0.1)`;
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 12px 28px rgba(0,0,0,0.06)";
                }}
              >
                <div style={{ backgroundColor: card.color, height: 8 }} />
                <div style={{ padding: 32 }}>
                  <h4 style={{ fontSize: 22, fontWeight: "bold", color: card.color, textAlign: "center", marginBottom: 24 }}>
                    {card.icon} {card.title}
                  </h4>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "center" }}>
                    {card.tags.map((tag, tagIdx) => (
                      <span key={tagIdx} style={{
                        backgroundColor: card.bg,
                        color: card.color,
                        padding: "8px 16px",
                        borderRadius: 30,
                        fontSize: 13,
                        fontWeight: 500,
                        boxShadow: `inset 0 0 4px ${card.color}22`
                      }}>
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section id="processSection" style={{ backgroundColor: "#ffffff", padding: "96px 24px" }}>
        <div style={{ maxWidth: 1200, margin: "auto" }}>
          {/* 타이틀 */}
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <h3 style={{ fontSize: 24, color: "#1976d2", fontWeight: 600, letterSpacing: 1 }}>PROCESS</h3>
            <strong style={{ fontSize: 34, color: "#111", fontWeight: "bold" }}>
              프로젝트 진행 절차
            </strong>
          </div>

          {/* 서브 설명 */}
          <p style={{ textAlign: "center", fontSize: 17, color: "#555", lineHeight: 1.7, marginBottom: 60 }}>
            HumanMakeHub는 아래와 같은 절차를 통해<br />클라이언트의 프로젝트를 체계적으로 진행합니다.
          </p>

          {/* 단계 박스 */}
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 24, marginBottom: 64 }}>
            {["의뢰하기", "상담", "소요시간 / 비용안내", "개발진행", "테스트 / 피드백", "최종산출물 전달"].map((title, idx) => {
              const isBlue = idx % 2 === 0;
              const bgColor = isBlue ? "#1976d2" : "#ffb300";
              return (
                <div key={idx} style={{
                  flex: "1 1 280px",
                  minWidth: 240,
                  backgroundColor: "#f9f9f9",
                  borderRadius: 16,
                  textAlign: "center",
                  padding: "28px 20px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.04)",
                  position: "relative",
                  borderTop: `4px solid ${bgColor}`
                }}>
                  <div style={{
                    width: 44,
                    height: 44,
                    lineHeight: "44px",
                    backgroundColor: bgColor,
                    color: "#fff",
                    borderRadius: "50%",
                    margin: "0 auto 16px",
                    fontWeight: "bold",
                    fontSize: 16
                  }}>
                    {idx + 1}
                  </div>
                  <div>
                    <span style={{ fontSize: 16, fontWeight: "bold", color: "#222" }}>{title}</span>
                  </div>
                  {idx < 5 && (
                    <span style={{
                      position: "absolute",
                      right: -10,
                      top: "50%",
                      transform: "translateY(-50%)",
                      width: 24,
                      height: 24,
                      backgroundImage: "url(/arrow-right.svg)",
                      backgroundSize: "cover",
                      display: "none"
                    }} />
                  )}
                </div>
              );
            })}
          </div>

          {/* 하단 상세 설명 */}
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {[
              { step: "1", title: "의뢰하기", desc: "하단의 간단한 문의 양식을 통해 3분 안에 의뢰할 수 있습니다." },
              { step: "2", title: "상담", desc: "전문 컨설턴트가 정확한 커뮤니케이션으로 요구사항을 확인합니다." },
              { step: "3", title: "소요시간/비용안내", desc: "합리적이고 투명한 견적과 일정을 안내드립니다." },
              { step: "4", title: "개발진행", desc: "확정된 사양 기준으로 디자인과 개발을 진행합니다." },
              { step: "5", title: "테스트/피드백", desc: "1차/2차 테스트를 거쳐 오류를 수정하고 피드백을 반영합니다." },
              { step: "6", title: "최종산출물 전달", desc: "완성도 높은 결과물을 제공하고 운영 가이드를 안내드립니다." }
            ].map((item, idx) => (
              <li key={idx} style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 20 }}>
                <div style={{
                  minWidth: 32,
                  height: 32,
                  borderRadius: "50%",
                  backgroundColor: idx % 2 === 0 ? "#1976d2" : "#ffb300",
                  color: "#fff",
                  fontWeight: "bold",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}>
                  {item.step}
                </div>
                <div>
                  <strong style={{ fontSize: 16, color: "#111" }}>{item.title}</strong>
                  <p style={{ fontSize: 14, color: "#444", marginTop: 4 }}>{item.desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* PORTFOLIO Section */}
      <section
        className="portfolio_wrap"
        id="portfolioSection"
        style={{ backgroundColor: "#f5f5f5", padding: "80px 0" }}
      >
        <div
          className="portfolio_inner"
          style={{ maxWidth: 1200, margin: "0 auto", padding: "0 20px" }}
        >
          <div className="portfolio_title_wrap" style={{ textAlign: "center", marginBottom: 40 }}>
            <h3 style={{ fontSize: 24, color: "#1976d2" }}>PORTFOLIO</h3>
            <strong style={{ fontSize: 32, color: "#111", fontWeight: "bold" }}>
              HumanMakeHub 포트폴리오 사례
            </strong>
          </div>

          <Swiper
            direction="vertical"
            slidesPerView={3}
            slidesPerGroup={1}
            spaceBetween={0}
            loop={true}
            autoplay={{
              delay: 3000,
              disableOnInteraction: false,
              pauseOnMouseEnter: false
            }}
            modules={[Autoplay]}
            style={{
              height: "min(540px, 80vh)", // ✅ 반응형: 최대 540px, 최소 80% viewport
              overflow: "hidden"
            }}
          >
            {[
              {
                title: "정부지원 사업 신청 시스템",
                desc: "정부 보조금, 창업지원금, 고용지원금 등 다양한 정책 사업을 한 플랫폼에서 신청하고 관리할 수 있도록 통합 구축한 시스템입니다. 신청서 양식 자동화, 단계별 진행 현황, 사용자 맞춤 알림 기능 포함.",
                tags: ["Vue.js", "Pinia", "PostgreSQL", "FastAPI", "Docker", "Nginx", "AWS EC2", "Slack Webhook"],
                budget: "예산: 약 1,800만원",
                duration: "개발기간: 3개월"
              },
              {
                title: "스타트업 IR 페이지 구축",
                desc: "투자 유치를 위한 스타트업 전용 IR 웹페이지로, 회사 소개, 핵심 지표, 팀 구성, 사업 계획 등을 한눈에 보여주는 구성입니다. 발표 영상 삽입, PDF 다운로드, 모바일 최적화 구현.",
                tags: ["React", "Next.js", "Figma", "Tailwind CSS", "Vercel", "Google Analytics"],
                budget: "예산: 약 500만원",
                duration: "개발기간: 1개월"
              },
              {
                title: "프리랜서 매칭 플랫폼",
                desc: "클라이언트가 프로젝트 등록 시 기술·분야·예산 기반으로 최적의 프리랜서를 자동 추천하는 시스템입니다. 프로필 평가, 채팅 기능, 정산 자동화까지 통합된 플랫폼 구축.",
                tags: ["Node.js", "NestJS", "MongoDB", "Next.js", "Redis", "Socket.IO", "Stripe", "AWS S3"],
                budget: "예산: 약 1,200만원",
                duration: "개발기간: 2.5개월"
              },
              {
                title: "교육생 출석관리 & LMS",
                desc: "출석 체크, 강의 자료 업로드, 과제 제출, 진도율 확인, 성적 관리 등 통합 학습관리 기능을 제공하는 교육기관 전용 플랫폼. 관리자·학생·강사 권한 분리 및 모바일 대응 포함.",
                tags: ["Spring Boot", "MyBatis", "Vue.js", "MySQL", "Jenkins", "Kubernetes", "Firebase", "Chart.js"],
                budget: "예산: 약 2,400만원",
                duration: "개발기간: 4개월"
              },
              {
                title: "AI 챗봇 고객응대 시스템",
                desc: "GPT 기반의 고객 문의 자동응답 챗봇을 구축하여, 실시간 질의 응답, 사내 매뉴얼 자동 학습, 사용 로그 분석 기능 포함. Slack 연동 및 다국어 처리 기능 지원.",
                tags: ["Python", "LangChain", "OpenAI API", "Slack API", "FastAPI", "Redis", "Docker", "Supabase"],
                budget: "예산: 약 900만원",
                duration: "개발기간: 1.5개월"
              }
            ].map((item, idx) => (
              <SwiperSlide key={idx}>
                <div
                  style={{
                    backgroundColor: "#fff",
                    borderRadius: 0,
                    padding: "16px",
                    boxShadow: "none",
                    borderBottom: "1px solid #eee",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    wordBreak: "break-word",           // ✅ 줄바꿈 방지
                    whiteSpace: "normal",              // ✅ 줄바꿈 허용
                  }}
                >
                  <h4 style={{
                    fontSize: "clamp(16px, 2.5vw, 18px)", // ✅ 반응형 폰트 크기
                    fontWeight: 700,
                    marginBottom: 6
                  }}>{item.title}</h4>

                  <p style={{
                    fontSize: "clamp(13px, 2.5vw, 14px)",
                    color: "#444",
                    marginBottom: 8
                  }}>{item.desc}</p>

                  <div style={{
                    display: "flex",
                    gap: 8,
                    flexWrap: "wrap",
                    marginBottom: 8
                  }}>
                    {item.tags.map((tag, i) => (
                      <span
                        key={i}
                        style={{
                          fontSize: "clamp(11px, 2.3vw, 12px)",
                          backgroundColor: "#e3f2fd",
                          color: "#1976d2",
                          padding: "4px 10px",
                          borderRadius: 20
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div style={{
                    fontSize: "clamp(13px, 2.4vw, 14px)",
                    color: "#222",
                    fontWeight: 600
                  }}>
                    {item.duration} · {item.budget}
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </section>

      {/* ABOUT Section */}
      <section className="about_wrap" id="aboutSection" style={{ backgroundColor: "#f9f9f9", padding: "80px 20px" }}>
        <div className="about_inner" style={{ maxWidth: 1200, margin: "auto" }}>
          <div className="about_title_wrap" style={{ textAlign: "center", marginBottom: 40 }}>
            <h3 style={{ fontSize: 24, color: "#1976d2", fontWeight: 600 }}>ABOUT</h3>
            <strong style={{ fontSize: 32, color: "#111", fontWeight: "bold" }}>휴먼메이크허브는?</strong>
          </div>

          <div className="about_logo_content_wrap" style={{ display: "flex", flexWrap: "wrap", gap: 40, marginBottom: 60 }}>
            <div className="about_corporation_produce" style={{ flex: 1, minWidth: 300 }}>
              <strong style={{ fontSize: 20, display: "block", marginBottom: 10, color: "#1976d2" }}>
                진정성 있는 협업이 변화를 만듭니다.
              </strong>
              <span style={{ fontSize: 16, color: "#555", display: "block", marginBottom: 10 }}>
                HumanMakeHub와 함께 당신의 아이디어를 현실로 만들어보세요.
              </span>
              <p style={{ fontSize: 14, color: "#666", lineHeight: 1.7 }}>
                HumanMakeHub는 스타트업, 아이디어 기획자, 그리고 외주 클라이언트를 위해<br />
                맞춤형 팀을 구성하고, 프로젝트를 수행할 수 있는 협업 플랫폼입니다.<br /><br />
                우리는 빠른 개발보다 깊은 신뢰를 우선시하며, 한 프로젝트에 몰입하는 문화를 지향합니다.<br />
                기획, 디자인, 개발, 운영에 이르기까지 각자의 전문성이 조화를 이루는 과정 속에서<br />
                고객의 가치를 함께 만들어갑니다.<br /><br />
                단순한 제작 파트너가 아닌, 함께 고민하고 함께 성장하는 동반자가 되겠습니다.
              </p>
            </div>
          </div>

          {/* 아이콘 10개 기능박스 */}
          <div className="about_box_wrap" style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: 24
          }}>
            {[
              { icon: "💡", desc: "기술적 지원 제공" },
              { icon: "🌐", desc: "온라인 기능 제공" },
              { icon: "📱", desc: "모바일 기능 개발" },
              { icon: "💾", desc: "프로그램/데이터 지원" },
              { icon: "🛠️", desc: "시스템 설계 및 개발" },
              { icon: "📊", desc: "데이터 분석/활용" },
              { icon: "🧠", desc: "AI 서비스 및 솔루션 제공" },
              { icon: "🔍", desc: "정보 도출" },
              { icon: "📈", desc: "전략 수립 지원" },
              { icon: "📉", desc: "데이터 시각화" },
              { icon: "🧩", desc: "문제 해결 지원" },
              { icon: "🤝", desc: "협업 툴 제공" }
            ].map((item, idx) => (
              <div key={idx} className="about_box" style={{
                backgroundColor: "#f5f7fa",
                padding: 20,
                borderRadius: 12,
                textAlign: "center",
                boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
                border: "2px solid #1976d2"
              }}>
                <div style={{
                  width: 50,
                  height: 50,
                  margin: "auto",
                  borderRadius: "50%",
                  backgroundColor: "#1976d2",
                  color: "#fff",
                  fontSize: 24,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 12
                }}>
                  {item.icon}
                </div>

                <span style={{ fontSize: 13, color: "#333" }}>{item.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* COMPANY Section */}
      <section id="companySection" style={{ backgroundColor: "#f8f9fb", padding: "96px 24px" }}>
        <div style={{ maxWidth: 1200, margin: "auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <h3 style={{ fontSize: 24, color: "#1976d2", fontWeight: 600 }}>COMPANY</h3>
            <strong style={{ fontSize: 34, color: "#111", fontWeight: "bold" }}>
              휴먼메이크허브 회사 소개
            </strong>
          </div>
          <p style={{ textAlign: "center", fontSize: 17, color: "#555", lineHeight: 1.7, marginBottom: 60 }}>
            HumanMakeHub는 사람 중심의 협업과 기술을 바탕으로<br />
            창의적인 프로젝트를 실현하는 IT 전문 회사입니다.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 24, justifyContent: "center" }}>
            {[
              {
                title: "미션",
                content: "기술보다 사람을 우선하는\n신뢰 기반의 협업 생태계 조성"
              },
              {
                title: "비전",
                content: "국내 최고의 팀 빌딩 기반 플랫폼으로서\nIT 프로젝트의 새로운 패러다임을 제시"
              },
              {
                title: "핵심역량",
                content: [
                  "✔ 맞춤형 팀빌딩을 위한 수작업 매칭",
                  "✔ PM 중심의 협업 관리 시스템",
                  "✔ 정산 승인 및 이력 추적 기능",
                  "✔ 반응형 UI 기반의 포트폴리오 관리",
                  "✔ 클라이언트·메이커 전용 대시보드 제공"
                ]
              }
            ].map((item, idx) => (
              <div key={idx} style={{
                flex: "1 1 280px",
                maxWidth: 360,
                backgroundColor: "#ffffff",
                borderRadius: 16,
                padding: 32,
                boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
                textAlign: "center",
                borderTop: "4px solid #1976d2"
              }}>
                <h4 style={{ fontSize: 20, fontWeight: "bold", color: "#1976d2", marginBottom: 16 }}>{item.title}</h4>
                {Array.isArray(item.content) ? (
                  <ul style={{ listStyle: "none", padding: 0, margin: 0, textAlign: "left", lineHeight: 1.6, fontSize: 14, color: "#555" }}>
                    {item.content.map((line, lineIdx) => (
                      <li key={lineIdx}>{line}</li>
                    ))}
                  </ul>
                ) : (
                  <p style={{ fontSize: 15, color: "#444", lineHeight: 1.6, whiteSpace: "pre-line" }}>{item.content}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CONTACT Section */}
      <section className="contact_wrap" id="contactSection" style={{ backgroundColor: "#ffb300", padding: "96px 24px" }}>
        <div className="contact_inner" style={{ maxWidth: 900, margin: "auto" }}>
          <div className="contact_title_wrap" style={{ textAlign: "center", marginBottom: 40 }}>
            <h3 style={{ fontSize: isMobile ? 20 : 24, color: "#1976d2", fontWeight: 600 }}>CONTACT</h3>
            <strong style={{ fontSize: 32, color: "#111", fontWeight: "bold" }}>HumanMakeHub에 문의하기</strong>
          </div>

          <div className="contact_main_wrap">
            <form>
              <Grid container spacing={3}>
                {/* 고객정보 */}
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="이름 *" name="name" variant="outlined" required sx={{ backgroundColor: "#fff" }} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="회사명 *" name="company" variant="outlined" required sx={{ backgroundColor: "#fff" }} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="연락처 *" name="phone" placeholder="010-1234-5678" variant="outlined" required sx={{ backgroundColor: "#fff" }} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="소속/직책" name="position" variant="outlined" sx={{ backgroundColor: "#fff" }} />
                </Grid>
                <Grid item xs={12}>
                  <TextField fullWidth label="이메일 *" name="email" variant="outlined" required sx={{ backgroundColor: "#fff" }} />
                </Grid>

                {/* 문의항목 체크 */}
                <Grid item xs={12}>
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    문의 항목 (중복 선택 가능)
                  </Typography>
                  <Grid container spacing={1}>
                    {["웹 개발", "앱 개발", "데이터 분석", "AI솔루션", "전산시스템 구축", "쇼핑몰 구축", "플랫폼 구축", "기타"].map((item, idx) => {
                      const isSelected = selectedItems.includes(item);
                      return (
                        <Grid item xs={6} sm={4} md={3} key={idx}>
                          <Chip
                            label={item}
                            variant={isSelected ? "filled" : "outlined"}
                            color={isSelected ? "primary" : "default"}
                            clickable
                            onClick={() => handleToggle(item)}
                            sx={{
                              width: "100%", // ✅ 그리드 셀 안에서 꽉 채움
                              justifyContent: "center",
                              backgroundColor: isSelected ? "#1976d2" : "#fff",
                              color: isSelected ? "#fff" : "#1976d2",
                              border: isSelected ? "none" : "1px solid #1976d2",
                              fontWeight: 500
                            }}
                          />
                        </Grid>
                      );
                    })}
                  </Grid>

                </Grid>

                {/* 내용 */}
                <Grid item xs={12}>
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    문의 내용
                  </Typography>
                  <TextField
                    name="message"
                    fullWidth
                    multiline
                    minRows={6}
                    placeholder="예상 개발 비용과 개발 기간을 알려주시면 상담에 도움이 됩니다."
                    variant="outlined"
                    sx={{ backgroundColor: "#fff" }}
                  />
                </Grid>

                {/* 개인정보 동의 */}
                <Grid item xs={12}>
                  <Box display="flex" alignItems="center">
                    <input type="checkbox" id="privacy" required style={{ marginRight: 8 }} />
                    <label htmlFor="privacy" style={{ fontSize: 14 }}>
                      (필수) 개인정보 수집 및 이용방침에 동의합니다.
                    </label>
                  </Box>
                </Grid>

                {/* 제출 버튼 */}
                <Grid item xs={12}>
                  <Button
                    type="button"  // ✅ 새로고침 방지!
                    fullWidth
                    variant="contained"
                    size="large"
                    sx={{
                      backgroundColor: "#1976d2",
                      color: "#fff",
                      fontWeight: "bold",
                      padding: "12px 0",
                      '&:hover': { backgroundColor: "#1565c0" }
                    }}
                    onClick={() => askSend()}
                  >
                    문의하기
                  </Button>
                </Grid>
              </Grid>
              <FloatingQRCode />
            </form>
          </div>
        </div>
      </section>

      {/* FOOTER Section */}
      <footer className="footer_wrap" style={{ backgroundColor: "#1b1b1b", color: "#ccc", padding: "48px 24px" }}>
        <div className="footer_inner" style={{ maxWidth: 1200, margin: "auto" }}>

          {/* 주소 및 회사 정보 */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" sx={{ fontSize: 14, color: "#aaa", mb: 0.5 }}>
              서울특별시 영등포구 영중로 8길 6, 401호(영등포동, 성남빌딩)
            </Typography>
            <Typography variant="body2" sx={{ fontSize: 14, color: "#aaa" }}>
              대표자 박춘보 / 사업자등록번호 000-00-00000
            </Typography>
          </Box>

          {/* 연락처 및 이메일 */}
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              gap: 4,
              alignItems: "center",
              mb: 4,
              fontSize: 14
            }}
          >
            <Typography variant="body2">
              📞{" "}
              <a href="tel:070-1234-5678" style={{ color: "#ffb300", textDecoration: "none", fontWeight: 500 }}>
                070-1234-5678
              </a>
            </Typography>
            <Typography variant="body2">
              ✉️{" "}
              <a href="mailto:contact@humanmakehub.com" style={{ color: "#ffb300", textDecoration: "none", fontWeight: 500 }}>
                contact@humanmakehub.com
              </a>
            </Typography>
          </Box>

          {/* 로그인/회원가입 버튼 */}
          <Box sx={{ display: "flex", justifyContent: "center", gap: 2, mb: 5 }}>
            {localStorage.getItem("token") ? (
              <>
                <Button
                  variant="outlined"
                  size="small"
                  sx={{
                    color: "#ccc",
                    borderColor: "#444",
                    '&:hover': { backgroundColor: "#1976d2", borderColor: "#1976d2", color: "#fff" }
                  }}
                  onClick={() => navigate("/mypage/profile")}
                >
                  내 프로필
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  sx={{
                    color: "#ccc",
                    borderColor: "#444",
                    '&:hover': { backgroundColor: "#ffb300", borderColor: "#ffb300", color: "#1b1b1b" }
                  }}
                  onClick={() => {
                    localStorage.removeItem("token");
                    navigate("/");
                    window.location.reload();
                  }}
                >
                  로그아웃
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outlined"
                  size="small"
                  sx={{
                    color: "#ccc",
                    borderColor: "#444",
                    '&:hover': { backgroundColor: "#1976d2", borderColor: "#1976d2", color: "#fff" }
                  }}
                  onClick={() => navigate("/login")}
                >
                  로그인
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  sx={{
                    color: "#ccc",
                    borderColor: "#444",
                    '&:hover': { backgroundColor: "#ffb300", borderColor: "#ffb300", color: "#1b1b1b" }
                  }}
                  onClick={() => navigate("/register")}
                >
                  회원가입
                </Button>
              </>
            )}
          </Box>

          {/* 저작권 / 제작사 */}
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },
              justifyContent: "space-between",
              alignItems: "center",
              borderTop: "1px solid #333",
              pt: 3,
              fontSize: 13,
              color: "#999"
            }}
          >
            <Typography variant="body2">
              ⓒ {new Date().getFullYear()} <strong>HumanMakeHub</strong>. All rights reserved.
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Typography variant="body2">MADE BY</Typography>
              <img src="/logoicon.png" alt="로고" style={{ height: 16 }} />
              <Typography variant="body2" sx={{ fontWeight: 600, color: "#ffb300" }}>HumanMakeHub</Typography>
            </Box>
          </Box>
        </div>
      </footer>
    </Box >
  );
}
