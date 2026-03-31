/**
 * Thank you page module
 * Handles custom footer with language toggle
 */
import { initLanguage, cycleLanguage, toggleDSOneTheme } from '../shared';
import { getThemeLabel } from '../../utils/theme';

/**
 * Initialize language toggle on custom footer
 */
function initLanguageToggle(): void {
  const langToggle = document.getElementById('lang-toggle');
  langToggle?.addEventListener('click', () => cycleLanguage());
}

/**
 * Initialize theme toggle on custom footer
 */
function initThemeToggle(): void {
  const themeToggle = document.getElementById('theme-toggle');

  const updateThemeLabel = (): void => {
    const themeText = themeToggle?.querySelector('ds-text');
    const themeLabel = getThemeLabel();

    if (themeText) {
      themeText.setAttribute('text', themeLabel);
    }
  };

  themeToggle?.addEventListener('click', async () => {
    await toggleDSOneTheme();
    updateThemeLabel();
  });

  window.addEventListener('theme-changed', updateThemeLabel);
  updateThemeLabel();
}

/**
 * Initialize the page
 */
function init(): void {
  initLanguageToggle();
  initThemeToggle();
  initLanguage();
}

// Auto-initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
