"use client";

import React, { useEffect, useRef } from "react";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useTheme, alpha } from "@mui/material";
import { Lock } from "lucide-react";

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function DisclaimerModal({ open, onClose }: Props) {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const theme = useTheme();

  useEffect(() => {
    if (!open) return;
    const dialog = dialogRef.current;
    if (!dialog) return;

    const focusable = dialog.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    first?.focus();

    const handleKey = (e: KeyboardEvent) => {
      // Prevent Escape from closing — user must click the button
      if (e.key === "Escape") {
        if (focusable.length === 0) return;
        e.preventDefault();
        return;
      }
      if (e.key !== "Tab" || focusable.length === 0) return;

      const active = document.activeElement as HTMLElement | null;
      if (e.shiftKey && active === first) {
        e.preventDefault();
        last?.focus();
        return;
      }
      if (!e.shiftKey && active === last) {
        e.preventDefault();
        first?.focus();
      }
    };

    dialog.addEventListener("keydown", handleKey);
    return () => dialog.removeEventListener("keydown", handleKey);
  }, [open]);

  if (!open) return null;

  const backdropColor = alpha(theme.palette.text.primary, theme.palette.mode === "light" ? 0.06 : 0.12);

  return (
    <Box
      component="div"
      role="dialog"
      aria-modal="true"
      aria-labelledby="disclaimer-title"
      sx={{ position: "fixed", inset: 0, bgcolor: backdropColor, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200 }}
    >
      <Box
        ref={dialogRef}
        onClick={(e) => e.stopPropagation()}
        sx={{ bgcolor: "background.paper", color: "text.primary", p: 3, borderRadius: 2, maxWidth: 760, width: "94%", boxShadow: 8, border: `1px solid ${alpha(theme.palette.divider, 0.08)}` }}
      >
        <Box sx={{ display: "flex", gap: 1.5, alignItems: "center" }}>
          <Box sx={{ bgcolor: alpha(theme.palette.primary.main, 0.12), borderRadius: 1, p: 1, display: "flex", alignItems: "center", justifyContent: "center" }} aria-hidden>
            <Lock size={28} color={theme.palette.primary.main} />
          </Box>
          <Typography id="disclaimer-title" variant="h6" component="h2" sx={{ m: 0 }}>
            Privacy notice
          </Typography>
        </Box>

        <Box sx={{ mt: 2 }}>
          <Typography component="p" sx={{ mb: 1.5, lineHeight: 1.5 }}>
            Most actions in this form — such as preparing a preview or generating the PDF — are <strong>processed entirely in your browser</strong> and <strong>stay on your device</strong>.
          </Typography>
          <Typography component="p" sx={{ lineHeight: 1.5 }}>
            If you choose to create a <strong>shareable link or QR code</strong>, a small set of fields (<strong>missionary name, nation, travel date, and sending church</strong>) is sent to this site to create an encrypted token used only to build that shareable link.
          </Typography>
        </Box>

        <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1.5, mt: 2.5 }}>
          <Button onClick={onClose} variant="contained" sx={{ textTransform: "none", px: 2.5 }}>Understood</Button>
        </Box>
      </Box>
    </Box>
  );
}
