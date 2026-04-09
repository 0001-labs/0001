import type { SupportedLanguage, Translations } from '../types';
import { SUPPORTED_LANGUAGES, LANGUAGE_NAMES } from '../types';
import { TRANSLATIONS_PATH, DEFAULT_LANGUAGE, LANGUAGE_STORAGE_KEY } from './constants';
import { setDSOneLanguage } from './ds-one';

let cachedTranslations: Translations | null = null;

export function getCurrentLanguage(): SupportedLanguage {
  const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
  if (saved && SUPPORTED_LANGUAGES.includes(saved as SupportedLanguage)) {
    return saved as SupportedLanguage;
  }
  return DEFAULT_LANGUAGE;
}

export async function loadTranslations(): Promise<Translations> {
  if (cachedTranslations) {
    return cachedTranslations;
  }

  try {
    const response = await fetch(TRANSLATIONS_PATH);
    cachedTranslations = await response.json();
    return cachedTranslations;
  } catch (error) {
    console.error('Failed to load translations:', error);
    return {};
  }
}

export function getTranslation(
  translations: Translations,
  key: string,
  lang: SupportedLanguage = getCurrentLanguage(),
): string {
  return translations[lang]?.[key] || translations[DEFAULT_LANGUAGE]?.[key] || key;
}

export async function cycleLanguage(): Promise<SupportedLanguage> {
  const currentLang = getCurrentLanguage();
  const currentIndex = SUPPORTED_LANGUAGES.indexOf(currentLang);
  const nextIndex = (currentIndex + 1) % SUPPORTED_LANGUAGES.length;
  const nextLang = SUPPORTED_LANGUAGES[nextIndex];

  await setDSOneLanguage(nextLang);
  return nextLang;
}

export function applyCurrentYear(root: Document | ShadowRoot = document): void {
  root.querySelectorAll<HTMLElement>('[data-current-year]').forEach((el) => {
    el.textContent = String(new Date().getFullYear());
  });
}

export async function initLanguage(): Promise<void> {
  applyCurrentYear(document);
  await setDSOneLanguage(getCurrentLanguage());
}

export function getLanguageDisplayName(lang: SupportedLanguage): string {
  return LANGUAGE_NAMES[lang];
}

export function updatePlaceholders(translations: Translations): void {
  const lang = getCurrentLanguage();
  document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('[data-placeholder]').forEach((el) => {
    const key = el.dataset.placeholder;
    if (key) {
      el.placeholder = getTranslation(translations, key, lang);
    }
  });
}

export function applyTranslations(root: Document | ShadowRoot, translations: Translations): void {
  const lang = getCurrentLanguage();
  root.querySelectorAll<HTMLElement>('[data-i18n]').forEach((el) => {
    const key = el.dataset.i18n;
    if (key) {
      el.textContent = getTranslation(translations, key, lang);
    }
  });

  applyCurrentYear(root);
}
