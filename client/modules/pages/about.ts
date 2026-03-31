/**
 * About page module
 * Handles language initialization and i18n for about page content
 */
import type { Translations } from '../types';
import { getCurrentLanguage, getTranslation, initLanguage, loadTranslations } from '../shared';

let translations: Translations = {};

function applyAboutI18n(): void {
  const lang = getCurrentLanguage();
  document.querySelectorAll<HTMLElement>('[data-i18n]').forEach((el) => {
    const key = el.dataset.i18n;
    if (key) {
      el.textContent = getTranslation(translations, key, lang);
    }
  });
}

async function init(): Promise<void> {
  translations = await loadTranslations();
  applyAboutI18n();
  document.addEventListener('language-changed', applyAboutI18n);
  window.addEventListener('language-changed', applyAboutI18n);
  initLanguage();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => void init());
} else {
  void init();
}
