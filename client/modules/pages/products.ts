/**
 * Products page module
 * Handles page-level language initialization and the compact language toggle.
 */
import { cycleLanguage, initLanguage } from '../shared';

function initProductsPage(): void {
  const languageToggle = document.getElementById('products-language-toggle');

  languageToggle?.addEventListener('click', () => {
    void cycleLanguage();
  });

  void initLanguage();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initProductsPage);
} else {
  initProductsPage();
}
