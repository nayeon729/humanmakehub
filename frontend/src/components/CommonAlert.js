// components/CommonAlert.js

import React, { createContext, useContext, useState } from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button } from "@mui/material";

// 1. Context 생성
const AlertContext = createContext();

// 2. Provider 컴포넌트
export const AlertProvider = ({ children }) => {
  const [alertState, setAlertState] = useState({
    open: false,
    message: "",
    callback: null,
  });

  const showAlert = (message, callback = null) => {
    setAlertState({ open: true, message, callback });
  };

  const handleClose = () => {
    setAlertState({ ...alertState, open: false });
    if (alertState.callback) alertState.callback();
  };

  return (
    <AlertContext.Provider value={{ showAlert }}>
      {children}
      <Dialog open={alertState.open} onClose={handleClose}>
        <DialogTitle>알림</DialogTitle>
        <DialogContent>{alertState.message}</DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>확인</Button>
        </DialogActions>
      </Dialog>
    </AlertContext.Provider>
  );
};

// 3. 훅으로 사용하게 export
export const useAlert = () => useContext(AlertContext);
