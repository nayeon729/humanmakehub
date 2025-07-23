import React from "react";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import "./HomePage.css";

const heroSlides = [
  {
    title: (
      <>
        휴먼메이크허브는,<br />
        당신의 <span style={{ color: "#ff3f3f" }}>팀</span>입니다
      </>
    ),
    description: (
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
    description: (
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
        좋은 사람을 만나는 일입니다
      </>
    ),
    description: (
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
    description: (
      <>
        함께 만든 과정이 있어야<br />
        결과물에 담긴 의미도 깊어집니다.
      </>
    ),
    frameClass: "hero_frame_4",
  },
];

const HeroSlider = () => {
  const settings = {
  centerMode: true,
  centerPadding: "0px",
  slidesToShow: 3,
  autoplay: true,                  
  autoplaySpeed: 3000,
  infinite: true,
  pauseOnHover: false,
  dots: true,
  arrows: true,
  responsive: [
    {
      breakpoint: 1200,
      settings: {
        slidesToShow: 1,
        centerPadding: "0px",
      },
    },
  ],
};

  return (
    <div className="hero-slider-container" style={{maxWidth:"1400px"}}>
      <Slider {...settings}>
        {heroSlides.map((slide, idx) => (
          <div key={idx} className="slide-card">
            <h3>{slide.title}</h3>
            <p>{slide.description}</p>
            <div className={`hero-frame ${slide.frameClass}`} />
          </div>
        ))}
      </Slider>
    </div>
  );
};

export default HeroSlider;
