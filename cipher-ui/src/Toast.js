/**
 * Global toast utility + renderer.
 *
 * This module intentionally keeps a module-level toast queue so any component can
 * call showToast/showConfirmToast without wiring props/context.
 */

import React, { useState, useEffect } from 'react';
import './Toast.css';

let toastId = 0;
const toasts = [];
let setToastsCallback = null;

// Push to the shared queue and optionally schedule auto-dismiss.
const pushToast = (toast) => {
  toasts.push(toast);
  if (setToastsCallback) {
    setToastsCallback([...toasts]);
  }

  const dismissAfterMs = Number.isFinite(Number(toast.dismissAfterMs)) ? Number(toast.dismissAfterMs) : null;
  if (dismissAfterMs && dismissAfterMs > 0) {
    setTimeout(() => {
      const index = toasts.findIndex((t) => t.id === toast.id);
      if (index > -1) {
        toasts.splice(index, 1);
        if (setToastsCallback) {
          setToastsCallback([...toasts]);
        }
      }
    }, dismissAfterMs);
  }
};

/**
 * Show a standard auto-dismissing toast.
 * @param {string} message
 * @param {'info'|'success'|'warning'|'error'} [type]
 */
export const showToast = (message, type = 'info') => {
  const toast = {
    id: ++toastId,
    message,
    type,
    timestamp: Date.now(),
    dismissAfterMs: 3000,
  };

  pushToast(toast);
};

/**
 * Show a confirmation toast that does not auto-dismiss.
 * Used for destructive actions (e.g., admin delete user).
 */
export const showConfirmToast = ({
  message,
  type = 'warning',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
}) => {
  const toast = {
    id: ++toastId,
    message,
    type,
    kind: 'confirm',
    timestamp: Date.now(),
    dismissAfterMs: null,
    actions: {
      confirmText,
      cancelText,
      onConfirm,
      onCancel,
    },
  };

  pushToast(toast);
};

/**
 * Toast container component. Mount once (e.g., near App root).
 */
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

  const handleConfirm = (toast) => {
    removeToast(toast.id);
    if (typeof toast?.actions?.onConfirm === 'function') {
      toast.actions.onConfirm();
    }
  };

  const handleCancel = (toast) => {
    removeToast(toast.id);
    if (typeof toast?.actions?.onCancel === 'function') {
      toast.actions.onCancel();
    }
  };

  return (
    <div className="toast-container">
      {toastList.map(toast => (
        <div key={toast.id} className={`toast toast-${toast.type}`}>
          <span className="toast-message">{toast.message}</span>
          {toast.kind === 'confirm' && (
            <div className="toast-actions" role="group" aria-label="Toast actions">
              <button
                type="button"
                className="toast-action toast-action--confirm"
                onClick={() => handleConfirm(toast)}
              >
                {toast?.actions?.confirmText || 'Confirm'}
              </button>
              <button
                type="button"
                className="toast-action toast-action--cancel"
                onClick={() => handleCancel(toast)}
              >
                {toast?.actions?.cancelText || 'Cancel'}
              </button>
            </div>
          )}
          <button className="toast-close" onClick={() => removeToast(toast.id)}>×</button>
        </div>
      ))}
    </div>
  );
};

export default Toast;