import type { SupportedLanguage, Translations } from '../types';
import { SUPPORTED_LANGUAGES, LANGUAGE_NAMES } from '../types';
import { TRANSLATIONS_PATH, DEFAULT_LANGUAGE, LANGUAGE_STORAGE_KEY } from './constants';
import { setDSOneLanguage } from './ds-one';

let cachedTranslations: Translations | null = null;

/**
 * Get the current language from localStorage
 */
export function getCurrentLanguage(): SupportedLanguage {
  const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
  if (saved && SUPPORTED_LANGUAGES.includes(saved as SupportedLanguage)) {
    return saved as SupportedLanguage;
  }
  return DEFAULT_LANGUAGE;
}

/**
 * Load translations from JSON file
 */
export async function loadTranslations(): Promise<Translations> {
  if (cachedTranslations) {
    return cachedTranslations;
  }

  try {
    const response = await fetch(TRANSLATIONS_PATH);
    cachedTranslations = await response.json();
    return cachedTranslations!;
  } catch (error) {
    console.error('Failed to load translations:', error);
    return {};
  }
}

/**
 * Get a translated string
 */
export function getTranslation(
  translations: Translations,
  key: string,
  lang: SupportedLanguage = getCurrentLanguage()
): string {
  return translations[lang]?.[key] || translations[DEFAULT_LANGUAGE]?.[key] || key;
}

/**
 * Cycle to the next language
 */
export async function cycleLanguage(): Promise<SupportedLanguage> {
  const currentLang = getCurrentLanguage();
  const currentIndex = SUPPORTED_LANGUAGES.indexOf(currentLang);
  const nextIndex = (currentIndex + 1) % SUPPORTED_LANGUAGES.length;
  const nextLang = SUPPORTED_LANGUAGES[nextIndex];

  await setDSOneLanguage(nextLang);
  return nextLang;
}

/**
 * Initialize language from localStorage on page load
 */
export async function initLanguage(): Promise<void> {
  const savedLang = getCurrentLanguage();
  if (savedLang !== DEFAULT_LANGUAGE) {
    await setDSOneLanguage(savedLang);
  }
}

/**
 * Get the display name for a language
 */
export function getLanguageDisplayName(lang: SupportedLanguage): string {
  return LANGUAGE_NAMES[lang];
}

/**
 * Update placeholders on elements with data-placeholder attribute
 */
export function updatePlaceholders(translations: Translations): void {
  const lang = getCurrentLanguage();
  document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('[data-placeholder]').forEach((el) => {
    const key = el.dataset.placeholder;
    if (key) {
      el.placeholder = getTranslation(translations, key, lang);
    }
  });
}

/**
 * Apply translations to elements with data-i18n attribute
 */
export function applyTranslations(
  root: Document | ShadowRoot,
  translations: Translations
): void {
  const lang = getCurrentLanguage();
  root.querySelectorAll<HTMLElement>('[data-i18n]').forEach((el) => {
    const key = el.dataset.i18n;
    if (key) {
      el.textContent = getTranslation(translations, key, lang);
    }
  });
}
