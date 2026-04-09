/**
 * Thank you page module
 * Handles the custom footer language/theme controls and translations.
 */
import type { Translations } from '../types';
import { LANGUAGE_NAMES } from '../types';
import { cycleLanguage, getCurrentLanguage, getTranslation, initLanguage, loadTranslations, toggleDSOneTheme } from '../shared';
import { getThemeLabel } from '../../utils/theme';

let translations: Translations = {};

function applyThankYouI18n(): void {
  const lang = getCurrentLanguage();
  document.querySelectorAll<HTMLElement>('.thankyou-page [data-i18n]').forEach((el) => {
    const key = el.dataset.i18n;
    if (key) {
      el.textContent = getTranslation(translations, key, lang);
    }
  });
}

function updateLanguageLabel(): void {
  const langToggle = document.getElementById('lang-toggle');
  if (langToggle) {
    langToggle.textContent = LANGUAGE_NAMES[getCurrentLanguage()];
  }
}

function initLanguageToggle(): void {
  const langToggle = document.getElementById('lang-toggle');
  langToggle?.addEventListener('click', async () => {
    await cycleLanguage();
    updateLanguageLabel();
  });
}

function initThemeToggle(): void {
  const themeToggle = document.getElementById('theme-toggle');

  const updateThemeLabel = (): void => {
    if (themeToggle) {
      themeToggle.textContent = getTranslation(translations, getThemeLabel(), getCurrentLanguage());
    }
  };

  themeToggle?.addEventListener('click', async () => {
    await toggleDSOneTheme();
    updateThemeLabel();
  });

  window.addEventListener('theme-changed', updateThemeLabel);
  updateThemeLabel();
}

async function init(): Promise<void> {
  translations = await loadTranslations();
  const apply = (): void => {
    applyThankYouI18n();
    updateLanguageLabel();
  };

  apply();
  document.addEventListener('language-changed', apply);
  window.addEventListener('language-changed', apply);

  initLanguageToggle();
  initThemeToggle();
  await initLanguage();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    void init();
  });
} else {
  void init();
}
