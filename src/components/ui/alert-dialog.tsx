"use client";

import * as React from "react";
import { AlertTriangle, CheckCircle, XCircle, Info } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface AlertDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  type?: "success" | "error" | "warning" | "info" | "confirm";
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  showCancel?: boolean;
}

const alertIcons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
  confirm: AlertTriangle,
};

const alertColors = {
  success: {
    icon: "text-green-400",
    bg: "bg-green-500/20",
    border: "border-green-500/30",
    button: "bg-green-600 hover:bg-green-700",
  },
  error: {
    icon: "text-red-400",
    bg: "bg-red-500/20",
    border: "border-red-500/30",
    button: "bg-red-600 hover:bg-red-700",
  },
  warning: {
    icon: "text-amber-400",
    bg: "bg-amber-500/20",
    border: "border-amber-500/30",
    button: "bg-amber-600 hover:bg-amber-700",
  },
  info: {
    icon: "text-blue-400",
    bg: "bg-blue-500/20",
    border: "border-blue-500/30",
    button: "bg-blue-600 hover:bg-blue-700",
  },
  confirm: {
    icon: "text-amber-400",
    bg: "bg-amber-500/20",
    border: "border-amber-500/30",
    button: "bg-red-600 hover:bg-red-700",
  },
};

export function AlertDialog({
  open,
  onOpenChange,
  title,
  description,
  type = "info",
  confirmText = "OK",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  showCancel = false,
}: AlertDialogProps) {
  const Icon = alertIcons[type];
  const colors = alertColors[type];

  const handleConfirm = () => {
    onConfirm?.();
    onOpenChange(false);
  };

  const handleCancel = () => {
    onCancel?.();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-800 border-slate-600 text-white max-w-md">
        <DialogHeader className="pb-4">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-full ${colors.bg} ${colors.border} border flex items-center justify-center`}>
              <Icon className={`w-6 h-6 ${colors.icon}`} />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-lg font-semibold text-white mb-2">
                {title}
              </DialogTitle>
              <p className="text-sm text-slate-300 leading-relaxed">
                {description}
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="flex gap-3 pt-4">
          {showCancel && (
            <Button
              variant="ghost"
              onClick={handleCancel}
              className="flex-1 bg-slate-700 hover:bg-slate-600 text-white border border-slate-600"
            >
              {cancelText}
            </Button>
          )}
          <Button
            onClick={handleConfirm}
            className={`${showCancel ? 'flex-1' : 'w-full'} ${colors.button} text-white shadow-lg`}
          >
            {confirmText}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Hook for easier usage
export function useAlertDialog() {
  const [alertConfig, setAlertConfig] = React.useState<AlertDialogProps | null>(null);

  const showAlert = React.useCallback((config: Omit<AlertDialogProps, "open" | "onOpenChange">) => {
    setAlertConfig({
      ...config,
      open: true,
      onOpenChange: (open) => {
        if (!open) setAlertConfig(null);
      },
    });
  }, []);

  const showSuccess = React.useCallback((title: string, description: string) => {
    showAlert({
      title,
      description,
      type: "success",
      confirmText: "Great!",
    });
  }, [showAlert]);

  const showError = React.useCallback((title: string, description: string) => {
    showAlert({
      title,
      description,
      type: "error",
      confirmText: "OK",
    });
  }, [showAlert]);

  const showConfirm = React.useCallback((
    title: string,
    description: string,
    onConfirm: () => void,
    confirmText = "Confirm",
    cancelText = "Cancel"
  ) => {
    showAlert({
      title,
      description,
      type: "confirm",
      confirmText,
      cancelText,
      onConfirm,
      showCancel: true,
    });
  }, [showAlert]);

  const AlertComponent = React.useMemo(() => {
    if (!alertConfig) return null;
    return <AlertDialog {...alertConfig} />;
  }, [alertConfig]);

  return {
    showAlert,
    showSuccess,
    showError,
    showConfirm,
    AlertComponent,
  };
}
