import { MoonIcon, SunIcon } from '@phosphor-icons/react';
import { useEffect, useState } from 'react';
import { Button } from './Button';

const STORAGE_KEY = 'ffcs-planner:theme';
const THEME_COLORS = { dark: '#0f1513', light: '#f6f8f7' };

function applyTheme(dark: boolean): void {
  document.documentElement.classList.toggle('dark', dark);
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? THEME_COLORS.dark : THEME_COLORS.light);
}

function readStoredTheme(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function ThemeToggle() {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'));

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (event: MediaQueryListEvent) => {
      if (readStoredTheme()) return;
      applyTheme(event.matches);
      setDark(event.matches);
    };
    media.addEventListener('change', handleChange);
    return () => media.removeEventListener('change', handleChange);
  }, []);

  const toggle = () => {
    const next = !dark;
    applyTheme(next);
    setDark(next);
    try {
      localStorage.setItem(STORAGE_KEY, next ? 'dark' : 'light');
    } catch {
      return;
    }
  };

  return (
    <Button
      variant="ghost"
      onClick={toggle}
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      icon={dark ? <SunIcon size={18} /> : <MoonIcon size={18} />}
    />
  );
}
