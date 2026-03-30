export type ThemeMode = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'tdm-theme';

export function isThemeMode(value: string | undefined): value is ThemeMode {
  return value === 'light' || value === 'dark';
}
