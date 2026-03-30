"use client";

import React from "react";
import Snackbar from "@mui/material/Snackbar";
import Portal from "@mui/material/Portal";
import Alert from "@mui/material/Alert";
import type { AlertColor } from "@mui/material/Alert";

type Props = {
  open: boolean;
  message?: React.ReactNode;
  severity?: AlertColor;
  onClose?: () => void;
  autoHideDuration?: number | null;
};

const AppSnackbar = React.forwardRef<HTMLDivElement, Props>(function AppSnackbar(
  { open, message, severity = "info", onClose, autoHideDuration = 5000 },
  ref,
) {
  const container = typeof document !== "undefined" ? document.getElementById("mui-portal-root") ?? undefined : undefined;

  return (
    <Portal container={container as HTMLElement | undefined}>
      <Snackbar
        ref={ref}
        open={open}
        autoHideDuration={autoHideDuration}
        onClose={onClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        className="snackbar"
      >
        <Alert onClose={onClose} severity={severity} sx={{ width: "100%" }}>
          {message}
        </Alert>
      </Snackbar>
    </Portal>
  );
});

export default AppSnackbar;
