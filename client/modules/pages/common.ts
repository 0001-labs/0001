/**
 * Common page module
 * Applies shared translations and initializes language state.
 */
import { applyTranslations, initLanguage, loadTranslations, updatePlaceholders } from '../shared';

async function init(): Promise<void> {
  const translations = await loadTranslations();

  const apply = (): void => {
    applyTranslations(document, translations);
    updatePlaceholders(translations);
  };

  apply();
  document.addEventListener('language-changed', apply);
  window.addEventListener('language-changed', apply);
  await initLanguage();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    void init();
  });
} else {
  void init();
}
