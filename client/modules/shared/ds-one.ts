import type { SupportedLanguage } from '../types';
import { DEFAULT_LANGUAGE, LANGUAGE_STORAGE_KEY } from './constants';
import { toggleTheme } from '../../utils/theme';

function dispatchLanguageChange(lang: SupportedLanguage): void {
  document.documentElement.lang = lang;
  const event = new CustomEvent('language-changed', { detail: { lang } });
  window.dispatchEvent(event);
  document.dispatchEvent(event);
}

export function getStoredLanguage(): SupportedLanguage {
  return (localStorage.getItem(LANGUAGE_STORAGE_KEY) || DEFAULT_LANGUAGE) as SupportedLanguage;
}

export async function setDSOneLanguage(lang: SupportedLanguage): Promise<void> {
  localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
  dispatchLanguageChange(lang);
}

export async function toggleDSOneTheme(): Promise<void> {
  const theme = toggleTheme();
  const event = new CustomEvent('theme-changed', { detail: { theme } });
  window.dispatchEvent(event);
  document.dispatchEvent(event);
}
