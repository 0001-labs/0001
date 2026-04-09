import { THEME_STORAGE_KEY } from '../modules/shared/constants';

export type Theme = 'light' | 'dark';

const DEFAULT_THEME: Theme = 'light';

function isTheme(value: string | null): value is Theme {
  return value === 'light' || value === 'dark';
}

function applyTheme(theme: Theme): Theme {
  const root = document.documentElement;
  root.classList.toggle('light-theme', theme === 'light');
  root.classList.toggle('dark-theme', theme === 'dark');
  root.setAttribute('data-theme', theme);
  return theme;
}

export function getTheme(): Theme {
  if (typeof window === 'undefined') {
    return DEFAULT_THEME;
  }

  const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
  return isTheme(storedTheme) ? storedTheme : DEFAULT_THEME;
}

export function setTheme(theme: Theme): Theme {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }

  return applyTheme(theme);
}

export function toggleTheme(): Theme {
  return setTheme(getTheme() === 'light' ? 'dark' : 'light');
}

export function getThemeLabel(): 'Light' | 'Dark' {
  return getTheme() === 'dark' ? 'Dark' : 'Light';
}

export function initTheme(): Theme {
  return applyTheme(getTheme());
}

if (typeof window !== 'undefined') {
  initTheme();
}
