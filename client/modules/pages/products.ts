/**
 * Products page module
 * DS one language + footer-style Contact us label (data-i18n).
 */
import type { Translations } from '../types';
import { getCurrentLanguage, getTranslation, initLanguage, loadTranslations } from '../shared';

let translations: Translations = {};

function applyProductsLabels(): void {
  const lang = getCurrentLanguage();
  document.querySelectorAll<HTMLElement>('.products-page [data-i18n]').forEach((el) => {
    const key = el.dataset.i18n;
    if (key) {
      el.textContent = getTranslation(translations, key, lang);
    }
  });
}

async function initProductsPage(): Promise<void> {
  translations = await loadTranslations();
  applyProductsLabels();
  document.addEventListener('language-changed', applyProductsLabels);
  window.addEventListener('language-changed', applyProductsLabels);
  void initLanguage();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    void initProductsPage();
  });
} else {
  void initProductsPage();
}
