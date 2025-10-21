/**
 * Toast Notification System
 */

import { useState, useEffect } from 'react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

let toastCounter = 0;
const toastListeners: Array<(toast: Toast) => void> = [];

export const toast = {
  success: (message: string, duration = 3000) => {
    showToast({ type: 'success', message, duration });
  },
  error: (message: string, duration = 5000) => {
    showToast({ type: 'error', message, duration });
  },
  warning: (message: string, duration = 4000) => {
    showToast({ type: 'warning', message, duration });
  },
  info: (message: string, duration = 3000) => {
    showToast({ type: 'info', message, duration });
  },
};

function showToast({ type, message, duration = 3000 }: Omit<Toast, 'id'>) {
  const id = `toast-${++toastCounter}`;
  const newToast: Toast = { id, type, message, duration };

  toastListeners.forEach((listener) => listener(newToast));
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const listener = (toast: Toast) => {
      setToasts((prev) => [...prev, toast]);

      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== toast.id));
      }, toast.duration);
    };

    toastListeners.push(listener);

    return () => {
      const index = toastListeners.indexOf(listener);
      if (index > -1) {
        toastListeners.splice(index, 1);
      }
    };
  }, []);

  return (
    <div className="pointer-events-none fixed bottom-0 right-0 z-50 flex flex-col gap-2 p-4">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onClose={() => {
          setToasts((prev) => prev.filter((t) => t.id !== toast.id));
        }} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  const styles = {
    success: 'bg-green-50 text-green-800 border-green-200',
    error: 'bg-red-50 text-red-800 border-red-200',
    warning: 'bg-yellow-50 text-yellow-800 border-yellow-200',
    info: 'bg-blue-50 text-blue-800 border-blue-200',
  };

  const icons = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ',
  };

  return (
    <div
      className={`pointer-events-auto flex items-center gap-3 rounded-lg border px-4 py-3 shadow-lg ${styles[toast.type]}`}
    >
      <span className="text-xl">{icons[toast.type]}</span>
      <p className="flex-1 text-sm font-medium">{toast.message}</p>
      <button
        onClick={onClose}
        className="text-sm opacity-70 hover:opacity-100"
      >
        ✕
      </button>
    </div>
  );
}
