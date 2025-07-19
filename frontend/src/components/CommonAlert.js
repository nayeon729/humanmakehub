// components/CommonAlert.js

import React, { createContext, useContext, useState } from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button } from "@mui/material";

// 1. Context 생성
const AlertContext = createContext();

// ✅ 외부에서도 접근 가능한 showAlert 함수 (초기값 null)
let externalShowAlert = null;
let externalShowConfirm = null;

// 2. Provider 컴포넌트
export const AlertProvider = ({ children }) => {
  const [alertState, setAlertState] = useState({
    open: false,
    message: "",
    callback: null,     // 확인 시 실행
    cancelCallback: null, // 취소 시 실행
    isConfirm: false,
  });

  const showAlert = (message, callback = null) => {
    setAlertState({ open: true, message, callback, cancelCallback: null, isConfirm: false });
  };

  const showConfirm = (message, onConfirm, onCancel = null) => {
    setAlertState({ open: true, message, callback: onConfirm, cancelCallback: onCancel, isConfirm: true });
  };

  // 외부에서 접근할 수 있도록 함수 할당
  externalShowAlert = showAlert;
  externalShowConfirm = showConfirm;

  const handleClose = () => {
    setAlertState((prev) => ({ ...prev, open: false }));
  };

  const handleConfirm = () => {
    if (alertState.callback) alertState.callback();
    handleClose();
  };

  const handleCancel = () => {
    if (alertState.cancelCallback) alertState.cancelCallback();
    handleClose();
  };

  return (
    <AlertContext.Provider value={{ showAlert, showConfirm }}>
      {children}
      <Dialog open={alertState.open} onClose={handleClose}>
        <DialogTitle>알림</DialogTitle>
        <DialogContent>{alertState.message}</DialogContent>
        <DialogActions>
          {alertState.isConfirm ? (
            <>
              <Button onClick={handleCancel}>취소</Button>
              <Button onClick={handleConfirm} color="primary">확인</Button>
            </>
          ) : (
            <Button onClick={handleConfirm}>확인</Button>
          )}
        </DialogActions>
      </Dialog>
    </AlertContext.Provider>
  );
};

// 3. 컴포넌트 내부 전용 훅
export const useAlert = () => useContext(AlertContext);

// 4. 외부 JS 파일에서 사용 가능한 alert 함수
export const showAlertExternally = (message, callback = null) => {
  if (externalShowAlert) {
    externalShowAlert(message, callback);
  } else {
    console.warn("AlertProvider가 아직 마운트되지 않았습니다.");
  }
};

export const showConfirmExternally = (message, onConfirm, onCancel = null) => {
  if (externalShowConfirm) {
    externalShowConfirm(message, onConfirm, onCancel);
  } else {
    console.warn("AlertProvider가 아직 마운트되지 않았습니다.");
  }
};
