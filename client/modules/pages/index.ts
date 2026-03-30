/**
 * Index page (home) module
 * Handles hero section with sentence randomization and timer
 */
import { initLanguage } from '../shared';

/** Sentence keys that have translations */
const SENTENCE_KEYS = [
  1, 714, 1241, 1429, 2143, 2857, 3571, 4286, 5000, 5714, 6429, 7143, 7857, 9999,
];

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

/** Timer duration in milliseconds */
const TIMER_DURATION = 4000;

let currentSentenceKey = 1;
let timerTimeout: ReturnType<typeof setTimeout> | null = null;

/**
 * Get a random sentence key
 */
function getRandomSentenceKey(): number {
  return SENTENCE_KEYS[Math.floor(Math.random() * SENTENCE_KEYS.length)];
}

/**
 * Randomize the current sentence
 */
export function randomizeSentence(): void {
  currentSentenceKey = getRandomSentenceKey();
  const image = IMAGES[currentSentenceKey];

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
  const heroDescription = document.querySelector<HTMLElement>('.hero__description');
  const heroImageDiv = document.querySelector<HTMLElement>('.hero__image');

  if (!heroTimer || !heroDescription || !heroImageDiv) return;

  // Clear existing timer
  if (timerTimeout) {
    clearTimeout(timerTimeout);
  }

  // Reset states
  heroTimer.classList.remove('hidden');
  heroImageDiv.classList.remove('hidden');
  heroDescription.classList.remove('revealed');

  // Restart animation by removing and re-adding element
  heroTimer.style.animation = 'none';
  heroTimer.offsetHeight; // Trigger reflow
  heroTimer.style.animation = '';

  // After timer: hide timer and image, reveal description
  timerTimeout = setTimeout(() => {
    heroTimer.classList.add('hidden');
    heroImageDiv.classList.add('hidden');
    heroDescription.classList.add('revealed');
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

/**
 * Initialize the index page
 */
function init(): void {
  initHero();
  initLanguage();
}

// Auto-initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
