'use client';

import { ThemeProvider, CssBaseline } from '@mui/material';
import type { PaletteMode } from '@mui/material';
import React, { useMemo, useState, useEffect } from 'react';

import { getTheme } from './theme';

type Props = {
  children: React.ReactNode;
  initialTheme?: PaletteMode;
};

export const ColorModeContext = React.createContext({
  mode: 'light' as PaletteMode,
  toggleColorMode: () => {},
});

export default function MuiProviders({ children, initialTheme }: Props) {
  const [mode, setMode] = useState<PaletteMode>(initialTheme ?? 'light');

  useEffect(() => {
    // keep legacy dataset theme in sync for existing code that reads it
    try {
      document.documentElement.dataset.theme = mode;
      try {
        window.localStorage.setItem('theme', mode);
      } catch {
        // ignore
      }
      document.cookie = `theme=${mode}; path=/; max-age=31536000; samesite=lax`;
    } catch {
      // noop in constrained environments
    }
  }, [mode]);

  const colorMode = useMemo(
    () => ({
      mode,
      toggleColorMode: () => setMode((prev) => (prev === 'light' ? 'dark' : 'light')),
    }),
    [mode],
  );

  const theme = useMemo(() => getTheme(mode), [mode]);

  return (
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
}
