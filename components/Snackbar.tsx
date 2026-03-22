"use client";

import { createPortal } from "react-dom";
import { X } from "lucide-react";

type SnackbarProps = {
  message: string | null;
  onDismiss: () => void;
};

export function Snackbar({ message, onDismiss }: SnackbarProps) {
  if (!message || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div
      className="snackbar"
      role="alert"
      aria-atomic="true"
    >
      <span className="snackbar-message">{message}</span>
      <button
        type="button"
        className="snackbar-dismiss"
        onClick={onDismiss}
        aria-label="Dismiss notification"
      >
        <X size={16} />
      </button>
    </div>,
    document.body,
  );
}
