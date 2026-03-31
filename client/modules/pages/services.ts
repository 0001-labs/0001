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
 * Inject chevron icon buttons into each service item header
 */
function injectChevrons(): void {
  const chevronSvg = `<svg viewBox="0 0 21 17" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M16.5 7.21L0 7.21V9.24H16.5L10.69 15.05L12.1 16.44L20.31 8.22L12.09 0L10.68 1.41L16.5 7.21Z" fill="currentColor"/></svg>`;

  document.querySelectorAll<HTMLElement>('.services-item').forEach((item) => {
    const title = item.querySelector('.services-item__title');
    if (!title) return;

    const header = document.createElement('div');
    header.className = 'services-item__header';

    const chevron = document.createElement('span');
    chevron.className = 'services-item__chevron';
    chevron.setAttribute('aria-hidden', 'true');
    chevron.innerHTML = chevronSvg;

    title.parentNode!.insertBefore(header, title);
    header.appendChild(title);
    header.appendChild(chevron);
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
  window.addEventListener('language-changed', applyPageTranslations);
}

/**
 * Initialize the services page
 */
export function initServices(): void {
  injectChevrons();
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
