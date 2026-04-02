"use client";

import { useEffect, useRef } from "react";

interface DialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "info" | "warning" | "danger" | "success";
  loading?: boolean;
}

const variantStyles = {
  info: {
    icon: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    iconColor: "text-qaa-navy-500",
    iconBg: "bg-qaa-navy-50",
    button: "bg-qaa-navy-900 hover:bg-qaa-navy-800 text-white",
  },
  warning: {
    icon: "M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z",
    iconColor: "text-amber-500",
    iconBg: "bg-amber-50",
    button: "bg-amber-500 hover:bg-amber-600 text-white",
  },
  danger: {
    icon: "M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z",
    iconColor: "text-red-500",
    iconBg: "bg-red-50",
    button: "bg-red-600 hover:bg-red-700 text-white",
  },
  success: {
    icon: "M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    iconColor: "text-green-500",
    iconBg: "bg-green-50",
    button: "bg-green-600 hover:bg-green-700 text-white",
  },
};

export default function Dialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "info",
  loading = false,
}: DialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const style = variantStyles[variant];

  useEffect(() => {
    if (open) {
      const handleEsc = (e: KeyboardEvent) => {
        if (e.key === "Escape" && !loading) onClose();
      };
      document.addEventListener("keydown", handleEsc);
      return () => document.removeEventListener("keydown", handleEsc);
    }
  }, [open, onClose, loading]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div
        ref={dialogRef}
        className="bg-white rounded-xl w-full max-w-sm mx-4 overflow-hidden shadow-xl"
      >
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className={`w-10 h-10 rounded-full ${style.iconBg} flex items-center justify-center shrink-0`}>
              <svg className={`w-5 h-5 ${style.iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d={style.icon} />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-qaa-navy-900 text-base">{title}</h3>
              <p className="text-sm text-gray-500 mt-1 leading-relaxed">{message}</p>
            </div>
          </div>
        </div>
        <div className="px-6 pb-5 flex justify-end gap-2">
          {onConfirm && (
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition disabled:opacity-50"
            >
              {cancelLabel}
            </button>
          )}
          <button
            type="button"
            onClick={onConfirm || onClose}
            disabled={loading}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition disabled:opacity-50 ${style.button}`}
          >
            {loading ? "Processing..." : onConfirm ? confirmLabel : "OK"}
          </button>
        </div>
      </div>
    </div>
  );
}
