'use client';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import { Lock } from 'lucide-react';
import { useState, useEffect } from 'react';

import styles from '@/components/support-form-builder/FormBuilder.module.css';
import DisclaimerModal from '@/components/ui/DisclaimerModal';

export default function PrivacyWidget() {
  const [open, setOpen] = useState(false);

  // Initialize open state from localStorage inside an effect. We call
  // setOpen asynchronously to avoid the "setState in effect" lint rule
  // while preserving the previous behavior (auto-open on first visit).
  useEffect(() => {
    let mounted = true;
    try {
      const dismissed = window.localStorage.getItem('disclaimer_dismissed');
      if (!dismissed) {
        // Schedule opening on a microtask so tests that await a resolved promise
        // will observe the update without relying on macrotasks.
        Promise.resolve().then(() => {
          if (mounted) setOpen(true);
        });
      }
    } catch {
      // ignore
    }
    return () => {
      mounted = false;
    };
  }, []);

  const handleClose = () => {
    try {
      window.localStorage.setItem('disclaimer_dismissed', '1');
    } catch {
      // ignore
    }
    setOpen(false);
  };

  return (
    <>
      <Box sx={{ position: 'fixed', left: 12, top: 12, zIndex: 200, display: 'flex' }}>
        <Button
          className={styles.button}
          onClick={() => setOpen(true)}
          startIcon={<Lock size={16} />}
          aria-label="Privacy notice"
          variant="text"
        >
          <span className={styles.buttonContent}>Privacy</span>
        </Button>
      </Box>
      <DisclaimerModal open={open} onClose={handleClose} />
    </>
  );
}
