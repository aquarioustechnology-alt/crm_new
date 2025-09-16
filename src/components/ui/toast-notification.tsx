"use client";

import * as React from "react";
import { CheckCircle, XCircle, AlertTriangle, Info, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ToastProps {
  id: string;
  title: string;
  description?: string;
  type: "success" | "error" | "warning" | "info";
  duration?: number;
  onRemove: (id: string) => void;
}

const toastIcons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const toastColors = {
  success: {
    icon: "text-green-400",
    bg: "bg-green-500/10",
    border: "border-green-500/30",
    progress: "bg-green-500",
  },
  error: {
    icon: "text-red-400",
    bg: "bg-red-500/10",
    border: "border-red-500/30",
    progress: "bg-red-500",
  },
  warning: {
    icon: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
    progress: "bg-amber-500",
  },
  info: {
    icon: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/30",
    progress: "bg-blue-500",
  },
};

const Toast = React.memo(function Toast({ id, title, description, type, duration = 5000, onRemove }: ToastProps) {
  const [progress, setProgress] = React.useState(100);
  const Icon = toastIcons[type];
  const colors = toastColors[type];

  React.useEffect(() => {
    const timeout = setTimeout(() => {
      onRemove(id);
    }, duration);

    const interval = setInterval(() => {
      setProgress((prev) => {
        const newProgress = prev - (100 / (duration / 100));
        return newProgress <= 0 ? 0 : newProgress;
      });
    }, 100);

    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, [id, duration, onRemove]);

  return (
    <div className={`
      relative overflow-hidden rounded-lg border ${colors.bg} ${colors.border} 
      bg-slate-800/95 backdrop-blur-sm shadow-lg p-4 min-w-80 max-w-md
      animate-in slide-in-from-right-full duration-300
    `}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <Icon className={`w-5 h-5 ${colors.icon}`} />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-white mb-1">{title}</h4>
          {description && (
            <p className="text-xs text-slate-300 leading-relaxed">{description}</p>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onRemove(id)}
          className="h-6 w-6 p-0 text-slate-400 hover:text-white"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
      
      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-700/50">
        <div
          className={`h-full ${colors.progress} transition-all duration-100 ease-linear`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
});

interface ToastProviderProps {
  children: React.ReactNode;
}

interface ToastContextType {
  showToast: (toast: Omit<ToastProps, "id" | "onRemove">) => void;
  showSuccess: (title: string, description?: string) => void;
  showError: (title: string, description?: string) => void;
  showWarning: (title: string, description?: string) => void;
  showInfo: (title: string, description?: string) => void;
}

const ToastContext = React.createContext<ToastContextType | null>(null);

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = React.useState<ToastProps[]>([]);

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showToast = React.useCallback((toast: Omit<ToastProps, "id" | "onRemove">) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast = { ...toast, id, onRemove: removeToast };
    setToasts((prev) => [...prev, newToast]);
  }, [removeToast]);

  const showSuccess = React.useCallback((title: string, description?: string) => {
    showToast({ title, description, type: "success" });
  }, [showToast]);

  const showError = React.useCallback((title: string, description?: string) => {
    showToast({ title, description, type: "error" });
  }, [showToast]);

  const showWarning = React.useCallback((title: string, description?: string) => {
    showToast({ title, description, type: "warning" });
  }, [showToast]);

  const showInfo = React.useCallback((title: string, description?: string) => {
    showToast({ title, description, type: "info" });
  }, [showToast]);

  return (
    <ToastContext.Provider value={{ showToast, showSuccess, showError, showWarning, showInfo }}>
      {children}
      
      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map((toast) => (
          <Toast key={toast.id} {...toast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
