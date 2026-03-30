'use client';

import { Moon, Sun } from 'lucide-react';
import { useContext } from 'react';

import { ColorModeContext } from '@/components/mui/MuiProviders';

export function ThemeToggle() {
  const { mode, toggleColorMode } = useContext(ColorModeContext);

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggleColorMode}
      aria-label="Toggle light and dark mode"
      aria-pressed={mode === 'dark'}
      title="Toggle light and dark mode"
    >
      <Sun className="theme-toggle-icon theme-toggle-icon-light" size={18} aria-hidden="true" />
      <Moon className="theme-toggle-icon theme-toggle-icon-dark" size={18} aria-hidden="true" />
    </button>
  );
}
