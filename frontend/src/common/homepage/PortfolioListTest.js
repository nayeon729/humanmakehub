import React, { useState, useEffect } from "react";
import {
  Box
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination, Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";
import "./HomePage.css"; // 이 파일에 CSS 클래스 작성해야 함
import axios from "../axiosInstance"

export default function HomePage() {
  const BASE_URL = process.env.REACT_APP_API_URL;
  const [portfolio, setPortfolio] = useState([]);

  const navigate = useNavigate();

  useEffect(() => {
    axios.get(`${BASE_URL}/user/portfoliotest`)
      .then(res => {
        console.log("res", res);
        console.log("res.data", res.data);
        setPortfolio(res?.data?.portfolios || []);
      })
      .catch(err => {
        console.error("포트폴리오목록 불러오기 실패", err);
      });
  }, []);

  return (
      <Box className="homePage">

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
            {portfolio && (
                <>
                    {portfolio.map((item, idx) => (
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
                        }}>{item.content}</p>

                        <div style={{
                            display: "flex",
                            gap: 8,
                            flexWrap: "wrap",
                            marginBottom: 8
                        }}>
                            {item?.tags && (
                                <>
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
                                </>
                            )}
                        </div>

                        <div style={{
                            fontSize: "clamp(13px, 2.4vw, 14px)",
                            color: "#222",
                            fontWeight: 600
                        }}>
                            {item.estimated_dt} · {item.budget}
                        </div>
                        </div>
                    </SwiperSlide>
                    ))}
                </>
            )}
          </Swiper>
        </div>
      </section>
      </Box>
  );
}
