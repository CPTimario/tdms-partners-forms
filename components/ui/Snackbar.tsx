"use client";

import React from "react";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import type { AlertColor } from "@mui/material/Alert";

type Props = {
  open: boolean;
  message?: React.ReactNode;
  severity?: AlertColor;
  onClose?: () => void;
  autoHideDuration?: number | null;
  dataTestId?: string;
};

const AppSnackbar = React.forwardRef<HTMLDivElement, Props>(function AppSnackbar(
  { open, message, severity = "info", onClose, autoHideDuration = 5000, dataTestId },
  ref,
) {
  return (
    <Snackbar
      ref={ref}
      open={open}
      autoHideDuration={autoHideDuration}
      onClose={onClose}
      anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      container={typeof document !== "undefined" ? document.getElementById("mui-portal-root") ?? undefined : undefined}
      data-testid={dataTestId}
    >
      <Alert onClose={onClose} severity={severity} sx={{ width: "100%" }}>
        {message}
      </Alert>
    </Snackbar>
  );
});

export default AppSnackbar;
