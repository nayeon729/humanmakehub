/**
 * 파일명: EmailTimer.jsx
 * 설명: 이메일 인증 등 제한 시간 표시용 타이머 컴포넌트 (기본 3분)
 * 주요 기능:
 *   - start가 true가 될 때마다 3분(180초) 타이머 시작
 *   - 1초마다 카운트다운하며, 시간이 0이 되면 onExpire 콜백 호출
 *   - MM:SS 형식으로 남은 시간 표시
 * 비고:
 *   - 컴포넌트 언마운트 시 자동 정리
 *   - 외부에서 start 상태를 조작해 재시작 가능
 */
import React, { useEffect, useState } from "react";

const EmailTimer = ({ start, onExpire }) => {
  const [timeLeft, setTimeLeft] = useState(180); // 3분 = 180초

  useEffect(() => {
    if (!start) return;

    setTimeLeft(180); // 타이머 리셋

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onExpire?.(); // 0이 되면 콜백 호출
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval); // 언마운트 시 정리
  }, [start]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = String(seconds % 60).padStart(2, "0");
    return `${m}:${s}`;
  };

  return (
    <span style={{ fontWeight: "bold", color: "#d32f2f" }}>
      {formatTime(timeLeft)}
    </span>
  );
};

export default EmailTimer;
