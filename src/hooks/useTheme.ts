import { useState, useEffect } from 'react';
import { ThemeMode } from '@/types/common';

export const useTheme = () => {
  const [theme, setTheme] = useState<ThemeMode>(() => {
    return (localStorage.getItem('app_theme') as ThemeMode) || 'dark';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }

    localStorage.setItem('app_theme', theme);
  }, [theme]);

  return { theme, setTheme };
};
