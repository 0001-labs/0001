/**
 * Thank you page module
 * Handles custom footer with language toggle
 */
import { initLanguage, cycleLanguage } from '../shared';

/**
 * Initialize language toggle on custom footer
 */
function initLanguageToggle(): void {
  const langToggle = document.getElementById('lang-toggle');
  langToggle?.addEventListener('click', () => cycleLanguage());
}

/**
 * Initialize the page
 */
function init(): void {
  initLanguageToggle();
  initLanguage();
}

// Auto-initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
