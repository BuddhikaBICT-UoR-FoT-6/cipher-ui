import React, { useState, useEffect } from 'react';
import './Toast.css';

let toastId = 0;
const toasts = [];
let setToastsCallback = null;

export const showToast = (message, type = 'info') => {
  const toast = {
    id: ++toastId,
    message,
    type,
    timestamp: Date.now()
  };
  
  toasts.push(toast);
  if (setToastsCallback) {
    setToastsCallback([...toasts]);
  }
  
  setTimeout(() => {
    const index = toasts.findIndex(t => t.id === toast.id);
    if (index > -1) {
      toasts.splice(index, 1);
      if (setToastsCallback) {
        setToastsCallback([...toasts]);
      }
    }
  }, 3000);
};

const Toast = () => {
  const [toastList, setToastList] = useState([]);

  useEffect(() => {
    setToastsCallback = setToastList;
    return () => {
      setToastsCallback = null;
    };
  }, []);

  const removeToast = (id) => {
    const index = toasts.findIndex(t => t.id === id);
    if (index > -1) {
      toasts.splice(index, 1);
      setToastList([...toasts]);
    }
  };

  return (
    <div className="toast-container">
      {toastList.map(toast => (
        <div key={toast.id} className={`toast toast-${toast.type}`}>
          <span className="toast-message">{toast.message}</span>
          <button className="toast-close" onClick={() => removeToast(toast.id)}>×</button>
        </div>
      ))}
    </div>
  );
};

export default Toast;