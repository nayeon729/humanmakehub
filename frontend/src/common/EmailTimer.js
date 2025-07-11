// src/components/EmailTimer.jsx
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
