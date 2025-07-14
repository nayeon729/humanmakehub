import React from "react";
import { Navigate } from "react-router-dom";

const PrivateRoute = ({ children, allowedRoles }) => {
  const token = sessionStorage.getItem("token");
  const role = sessionStorage.getItem("role");

  if (!token) return <Navigate to="/login" />; // 로그인 안 되어 있음
  if (!allowedRoles.includes(role)) return <Navigate to="/not-authorized" />; // 권한 없음

  return children;
};

export default PrivateRoute;