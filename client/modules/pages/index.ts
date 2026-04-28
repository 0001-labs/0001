/**
 * Index page (home) module
 * Handles hero section with sentence randomization and timer
 */
import type { Translations } from '../types';
import { getCurrentLanguage, getTranslation, initLanguage, loadTranslations } from '../shared';

let translations: Translations = {};

const FALLBACK_SENTENCE_KEYS = [1];

function applyHeroI18n(): void {
  const lang = getCurrentLanguage();
  document.querySelectorAll<HTMLElement>('.home-page [data-i18n]').forEach((el) => {
    const key = el.dataset.i18n;
    if (key) {
      el.textContent = getTranslation(translations, key, lang);
    }
  });
}

async function initHeroI18n(): Promise<void> {
  translations = await loadTranslations();
  setSentencePool(getSentenceKeys(translations));
  applyHeroI18n();
  document.addEventListener('language-changed', applyHeroI18n);
  window.addEventListener('language-changed', applyHeroI18n);
}

/** Images for each sentence */
const IMAGES: Record<number, string> = {
  1: '/assets/imagery/retro-monitors.png',
  714: '/assets/imagery/photo-1.png',
  1241: '/assets/imagery/photo-2.png',
  1429: '/assets/imagery/retro-monitors.png',
  2143: '/assets/imagery/photo-1.png',
  2857: '/assets/imagery/photo-2.png',
  3571: '/assets/imagery/retro-monitors.png',
  4286: '/assets/imagery/photo-1.png',
  5000: '/assets/imagery/photo-2.png',
  5714: '/assets/imagery/retro-monitors.png',
  6429: '/assets/imagery/photo-1.png',
  7143: '/assets/imagery/photo-2.png',
  7857: '/assets/imagery/retro-monitors.png',
  9999: '/assets/imagery/photo-1.png',
};

const FALLBACK_IMAGES = [
  '/assets/imagery/retro-monitors.png',
  '/assets/imagery/photo-1.png',
  '/assets/imagery/photo-2.png',
];

/** Timer duration in milliseconds */
const TIMER_DURATION = 4000;
const MENU_MAX_DISTANCE = 120;
const MENU_TOP_DISTANCE_MULTIPLIER = 3;
const MENU_MIN_OPACITY = 0.42;
const MENU_MAX_BLUR = 0;
const MENU_FALLOFF_POWER = 3;
const MENU_MIN_SPREAD = 0;

let currentSentenceKey = 1;
let sentenceKeys = [...FALLBACK_SENTENCE_KEYS];
let sentenceQueue: number[] = [];
let timerTimeout: ReturnType<typeof setTimeout> | null = null;

/**
 * Collect translated sentence keys and sort them numerically.
 */
function getSentenceKeys(source: Translations): number[] {
  const keys = new Set<number>();

  Object.values(source).forEach((languageMap) => {
    Object.keys(languageMap || {}).forEach((key) => {
      if (!key.startsWith('sentence-')) return;

      const value = Number.parseInt(key.replace('sentence-', ''), 10);
      if (Number.isFinite(value)) {
        keys.add(value);
      }
    });
  });

  return [...keys].sort((a, b) => a - b);
}

function shuffleKeys(keys: number[]): number[] {
  const shuffled = [...keys];

  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled;
}

function refillSentenceQueue(): void {
  const pool = sentenceKeys.length ? sentenceKeys : FALLBACK_SENTENCE_KEYS;
  const nextPool = pool.length > 1 ? pool.filter((key) => key !== currentSentenceKey) : pool;
  sentenceQueue = shuffleKeys(nextPool);
}

function getNextSentenceKey(): number {
  if (!sentenceQueue.length) {
    refillSentenceQueue();
  }

  return sentenceQueue.shift() ?? currentSentenceKey;
}

function getImageForSentence(key: number): string {
  if (IMAGES[key]) {
    return IMAGES[key];
  }

  return FALLBACK_IMAGES[key % FALLBACK_IMAGES.length];
}

function setSentencePool(nextKeys: number[]): void {
  const normalizedKeys = nextKeys.length ? nextKeys : FALLBACK_SENTENCE_KEYS;

  sentenceKeys = normalizedKeys;
  if (!sentenceKeys.includes(currentSentenceKey)) {
    currentSentenceKey = sentenceKeys[0];
  }
  sentenceQueue = [];
}

/**
 * Randomize the current sentence
 */
export function randomizeSentence(): void {
  currentSentenceKey = getNextSentenceKey();
  const image = getImageForSentence(currentSentenceKey);

  const heroNumber = document.getElementById('hero-number');
  const heroTagline = document.getElementById('hero-tagline');
  const heroImage = document.querySelector<HTMLImageElement>('.hero__image img');
  const decorativeImage = document.querySelector<HTMLImageElement>('.decorative-image img');

  if (heroNumber) {
    heroNumber.textContent = String(currentSentenceKey).padStart(4, '0');
  }
  if (heroTagline) {
    heroTagline.textContent = `sentence-${currentSentenceKey}`;
  }
  if (heroImage) {
    heroImage.src = image;
  }
  if (decorativeImage) {
    decorativeImage.src = image;
  }
}

/**
 * Start or restart the hero timer
 */
export function startTimer(): void {
  const heroTimer = document.getElementById('hero-timer');
  const heroImageDiv = document.querySelector<HTMLElement>('.hero__image');

  if (!heroTimer || !heroImageDiv) return;

  // Clear existing timer
  if (timerTimeout) {
    clearTimeout(timerTimeout);
  }

  // Reset states
  heroTimer.classList.remove('hidden');
  heroImageDiv.classList.remove('hidden');

  // Restart animation by removing and re-adding element
  heroTimer.style.animation = 'none';
  heroTimer.offsetHeight; // Trigger reflow
  heroTimer.style.animation = '';

  // After timer: remove the image cover so the copy beneath is exposed
  timerTimeout = setTimeout(() => {
    heroTimer.classList.add('hidden');
    heroImageDiv.classList.add('hidden');
  }, TIMER_DURATION);
}

/**
 * Initialize hero functionality
 */
export function initHero(): void {
  const randomizeBtn = document.getElementById('randomize-btn');
  const heroTitleWrapper = document.querySelector('.hero__title-wrapper');

  const handleRandomize = (): void => {
    randomizeSentence();
    startTimer();
  };

  randomizeBtn?.addEventListener('click', handleRandomize);
  heroTitleWrapper?.addEventListener('click', handleRandomize);

  // Start timer on page load
  startTimer();
}

function initMobileMenu(): void {
  const menu = document.querySelector<HTMLElement>('.home-menu');
  const toggle = document.getElementById('home-menu-toggle');
  const panel = document.getElementById('home-menu-mobile-panel');
  const body = document.body;
  let closeTimeout: ReturnType<typeof setTimeout> | null = null;

  if (!menu || !toggle || !panel) {
    return;
  }

  const mobileQuery = window.matchMedia('(max-width: 768px)');

  const closeMenu = (): void => {
    if (closeTimeout) {
      clearTimeout(closeTimeout);
      closeTimeout = null;
    }
    menu.dataset.mobileOpen = 'false';
    body.style.overflow = '';
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Open menu');
    closeTimeout = setTimeout(() => {
      panel.hidden = true;
      closeTimeout = null;
    }, 280);
  };

  const openMenu = (): void => {
    if (closeTimeout) {
      clearTimeout(closeTimeout);
      closeTimeout = null;
    }
    panel.hidden = false;
    panel.getBoundingClientRect();
    menu.dataset.mobileOpen = 'true';
    body.style.overflow = 'hidden';
    toggle.setAttribute('aria-expanded', 'true');
    toggle.setAttribute('aria-label', 'Close menu');
  };

  const toggleMenu = (): void => {
    if (panel.hidden) {
      openMenu();
      return;
    }

    closeMenu();
  };

  closeMenu();

  toggle.addEventListener('click', (event) => {
    event.stopPropagation();
    toggleMenu();
  });

  panel.addEventListener('click', (event) => {
    event.stopPropagation();
  });

  panel.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      closeMenu();
    });
  });

  document.addEventListener('click', (event) => {
    if (!mobileQuery.matches || panel.hidden) {
      return;
    }

    if (!menu.contains(event.target as Node)) {
      closeMenu();
    }
  });

  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeMenu();
    }
  });

  mobileQuery.addEventListener('change', (event) => {
    if (!event.matches) {
      closeMenu();
    }
  });
}

function setMenuRowState(nav: HTMLElement, opacity: number, blur: number, proximity = 0): void {
  const menu = nav.closest<HTMLElement>('.home-menu');
  nav.style.setProperty('--menu-row-opacity', opacity.toFixed(3));
  nav.style.setProperty('--menu-row-blur', `${blur.toFixed(2)}px`);
  const spread = MENU_MIN_SPREAD + (1 - MENU_MIN_SPREAD) * proximity;
  nav.style.setProperty('--menu-row-spread', spread.toFixed(3));
  nav.style.setProperty('--menu-links-opacity', proximity.toFixed(3));
  const collapsedOpacity = (1 - Math.min(1, proximity * 1.8)).toFixed(3);
  nav.style.setProperty('--menu-collapsed-opacity', collapsedOpacity);
  menu?.style.setProperty('--menu-collapsed-opacity', collapsedOpacity);
}

function resetMenuRowState(nav: HTMLElement): void {
  setMenuRowState(nav, MENU_MIN_OPACITY, MENU_MAX_BLUR, 0);
}

function initMenuProximity(): void {
  if (!window.matchMedia('(pointer: fine)').matches) {
    return;
  }

  const nav = document.querySelector<HTMLElement>('.home-menu__nav');
  if (!nav) {
    return;
  }

  let rafId: number | null = null;
  let pendingPointer: { x: number; y: number } | null = null;

  const updateFromPointer = (clientX: number, clientY: number): void => {
    const rect = nav.getBoundingClientRect();
    const nearestX = Math.max(rect.left, Math.min(clientX, rect.right));
    // Holy grail: fade faster above the row without snapping closed.
    const dx = clientX - nearestX;
    const dy = clientY < rect.top
      ? (clientY - rect.top) * MENU_TOP_DISTANCE_MULTIPLIER
      : clientY - Math.max(rect.top, Math.min(clientY, rect.bottom));
    const distance = Math.hypot(dx, dy);
    const linearProximity = Math.max(0, 1 - distance / MENU_MAX_DISTANCE);
    const proximity = linearProximity ** MENU_FALLOFF_POWER;
    const opacity = MENU_MIN_OPACITY + proximity * (1 - MENU_MIN_OPACITY);
    const blur = (1 - proximity) * MENU_MAX_BLUR;

    setMenuRowState(nav, opacity, blur, proximity);
  };

  resetMenuRowState(nav);

  window.addEventListener('pointermove', (event) => {
    pendingPointer = { x: event.clientX, y: event.clientY };
    if (rafId !== null) {
      return;
    }

    rafId = window.requestAnimationFrame(() => {
      rafId = null;
      if (!pendingPointer) {
        return;
      }
      updateFromPointer(pendingPointer.x, pendingPointer.y);
    });
  });

  window.addEventListener('pointerleave', () => {
    resetMenuRowState(nav);
  });

  window.addEventListener('blur', () => {
    resetMenuRowState(nav);
  });
}

/**
 * Initialize the index page
 */
function init(): void {
  initHero();
  initMobileMenu();
  initMenuProximity();
  void initHeroI18n();
  initLanguage();
}

// Auto-initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
