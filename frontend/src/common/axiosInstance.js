/**
 * 파일명: axiosInstance.js
 * 설명: Axios 인스턴스를 설정하고, 토큰 만료 시 자동 로그아웃 처리.
 * 참고: 모든 API 요청에 공통으로 사용됨
 */
import axios from "axios";

const axiosInstance = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
});
let isAlertShown = false;
// 응답 인터셉터 추가
axiosInstance.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401 && !isAlertShown) {
      isAlertShown = true;
      alert("로그인 세션이 만료되었습니다. 다시 로그인해주세요.");
      sessionStorage.clear();
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
