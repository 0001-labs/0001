/**
 * Services page module
 * Handles accordion and image hover functionality
 */
import type { Translations } from '../types';
import { initLanguage, loadTranslations, getCurrentLanguage, getTranslation } from '../shared';

let translations: Translations = {};
let defaultImageSrc = '';

/**
 * Apply translations to data-i18n elements
 */
function applyPageTranslations(): void {
  const lang = getCurrentLanguage();
  document.querySelectorAll<HTMLElement>('[data-i18n]').forEach((el) => {
    const key = el.dataset.i18n;
    if (key) {
      el.textContent = getTranslation(translations, key, lang);
    }
  });
}

/**
 * Initialize accordion functionality
 */
function initAccordion(): void {
  const serviceItems = document.querySelectorAll<HTMLElement>('.services-item');

  serviceItems.forEach((item) => {
    item.addEventListener('click', () => {
      const wasOpen = item.classList.contains('open');
      // Close all items
      serviceItems.forEach((i) => i.classList.remove('open'));
      // Open clicked item if it wasn't open
      if (!wasOpen) {
        item.classList.add('open');
      }
    });
  });
}

/**
 * Initialize image hover functionality
 */
function initImageHover(): void {
  const serviceItems = document.querySelectorAll<HTMLElement>('.services-item');
  const serviceImage = document.querySelector<HTMLImageElement>('.services-image img');

  if (!serviceImage) return;

  defaultImageSrc = serviceImage.src;

  serviceItems.forEach((item) => {
    item.addEventListener('mouseenter', () => {
      const newImage = item.dataset.image;
      if (newImage) {
        serviceImage.src = newImage;
      }
    });

    item.addEventListener('mouseleave', () => {
      serviceImage.src = defaultImageSrc;
    });
  });
}

/**
 * Initialize translations
 */
async function initTranslations(): Promise<void> {
  translations = await loadTranslations();
  applyPageTranslations();

  // Listen for language changes
  document.addEventListener('language-changed', applyPageTranslations);
}

/**
 * Initialize the services page
 */
export function initServices(): void {
  initAccordion();
  initImageHover();
  initTranslations();
}

/**
 * Initialize the page
 */
function init(): void {
  initServices();
  initLanguage();
}

// Auto-initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
