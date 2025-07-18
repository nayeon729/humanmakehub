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

import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

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
                <div style={{
                    height: "100%",
                    maxHeight: "800px",
                    overflow: "hidden"
                }}>
                    <Slider
                        vertical={true}
                        slidesToShow={3}
                        slidesToScroll={1}
                        infinite={true}
                        autoplay={true}
                        autoplaySpeed={3000}
                        arrows={false}
                        dots={true}
                        responsive={[
                            {
                                breakpoint: 768,
                                settings: {
                                    slidesToShow: 1,
                                    vertical: true,
                                    verticalSwiping: true,
                                },
                            },
                        ]}
                    >
                        {portfolio.map((item, idx) => (
                            <div key={idx} className="portfolio-slide-card">
                                <h4>{item.title}</h4>
                                <p>{item.content}</p>
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
                                {/* 태그, 날짜 등도 추가 */}
                            </div>
                        ))}
                    </Slider>
                </div>
            </div>
        </section>

    );
}
