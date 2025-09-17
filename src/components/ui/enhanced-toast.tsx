"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react";
import { Button } from "./button";

interface Toast {
  id: string;
  title?: string;
  message: string;
  type: "success" | "error" | "warning" | "info";
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastContextType {
  showToast: (toast: Omit<Toast, "id">) => void;
  hideToast: (id: string) => void;
  showSuccess: (message: string, title?: string) => void;
  showError: (message: string, title?: string) => void;
  showWarning: (message: string, title?: string) => void;
  showInfo: (message: string, title?: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function useEnhancedToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useEnhancedToast must be used within ToastProvider");
  }
  return context;
}

interface ToastProviderProps {
  children: React.ReactNode;
  maxToasts?: number;
}

export function ToastProvider({ children, maxToasts = 5 }: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((toast: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).substring(2);
    const newToast: Toast = {
      ...toast,
      id,
      duration: toast.duration ?? 5000,
    };

    setToasts(prev => {
      const updated = [newToast, ...prev];
      return updated.slice(0, maxToasts);
    });

    // Auto-hide toast after duration
    if (newToast.duration && newToast.duration > 0) {
      setTimeout(() => {
        hideToast(id);
      }, newToast.duration);
    }
  }, [maxToasts]);

  const hideToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const showSuccess = useCallback((message: string, title?: string) => {
    showToast({ message, title, type: "success" });
  }, [showToast]);

  const showError = useCallback((message: string, title?: string) => {
    showToast({ message, title, type: "error", duration: 7000 });
  }, [showToast]);

  const showWarning = useCallback((message: string, title?: string) => {
    showToast({ message, title, type: "warning", duration: 6000 });
  }, [showToast]);

  const showInfo = useCallback((message: string, title?: string) => {
    showToast({ message, title, type: "info" });
  }, [showToast]);

  const contextValue: ToastContextType = {
    showToast,
    hideToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
  };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <ToastContainer toasts={toasts} onHide={hideToast} />
    </ToastContext.Provider>
  );
}

interface ToastContainerProps {
  toasts: Toast[];
  onHide: (id: string) => void;
}

function ToastContainer({ toasts, onHide }: ToastContainerProps) {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm w-full">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onHide={onHide} />
      ))}
    </div>
  );
}

interface ToastItemProps {
  toast: Toast;
  onHide: (id: string) => void;
}

function ToastItem({ toast, onHide }: ToastItemProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Trigger enter animation
    setTimeout(() => setIsVisible(true), 10);
  }, []);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => onHide(toast.id), 300);
  };

  const getIcon = () => {
    switch (toast.type) {
      case "success":
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case "error":
        return <AlertCircle className="w-5 h-5 text-red-400" />;
      case "warning":
        return <AlertTriangle className="w-5 h-5 text-yellow-400" />;
      case "info":
        return <Info className="w-5 h-5 text-blue-400" />;
    }
  };

  const getColorClasses = () => {
    switch (toast.type) {
      case "success":
        return "border-green-500/50 bg-green-950/50 shadow-green-500/20";
      case "error":
        return "border-red-500/50 bg-red-950/50 shadow-red-500/20";
      case "warning":
        return "border-yellow-500/50 bg-yellow-950/50 shadow-yellow-500/20";
      case "info":
        return "border-blue-500/50 bg-blue-950/50 shadow-blue-500/20";
    }
  };

  return (
    <div
      className={`
        transform transition-all duration-300 ease-out
        ${isVisible && !isExiting 
          ? "translate-x-0 opacity-100 scale-100" 
          : "translate-x-full opacity-0 scale-95"
        }
        bg-slate-800 border rounded-lg shadow-lg backdrop-blur-sm
        ${getColorClasses()}
        p-4 min-w-0 relative overflow-hidden
      `}
    >
      {/* Progress bar */}
      {toast.duration && toast.duration > 0 && (
        <div 
          className="absolute bottom-0 left-0 h-1 bg-current opacity-30 animate-progress"
          style={{ 
            animationDuration: `${toast.duration}ms`,
            animationTimingFunction: "linear"
          }}
        />
      )}
      
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          {getIcon()}
        </div>
        
        <div className="flex-1 min-w-0">
          {toast.title && (
            <h4 className="font-medium text-slate-100 mb-1">
              {toast.title}
            </h4>
          )}
          <p className="text-sm text-slate-300 break-words">
            {toast.message}
          </p>
          
          {toast.action && (
            <div className="mt-3">
              <Button
                size="sm"
                variant="outline"
                onClick={toast.action.onClick}
                className="text-xs"
              >
                {toast.action.label}
              </Button>
            </div>
          )}
        </div>
        
        <Button
          size="sm"
          variant="ghost"
          onClick={handleClose}
          className="flex-shrink-0 h-auto p-1 text-slate-400 hover:text-slate-200"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

// Add the progress animation to CSS
const style = document.createElement("style");
style.textContent = `
  @keyframes progress {
    from { width: 100%; }
    to { width: 0%; }
  }
  .animate-progress {
    animation-name: progress;
  }
`;
if (typeof document !== "undefined") {
  document.head.appendChild(style);
}
