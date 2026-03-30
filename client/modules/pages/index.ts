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
  1: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400&h=300&fit=crop&auto=format',
  714: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=400&h=300&fit=crop&auto=format',
  1241: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400&h=300&fit=crop&auto=format',
  1429: 'https://images.unsplash.com/photo-1558655146-9f40138edfeb?w=400&h=300&fit=crop&auto=format',
  2143: 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=400&h=300&fit=crop&auto=format',
  2857: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=400&h=300&fit=crop&auto=format',
  3571: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=400&h=300&fit=crop&auto=format',
  4286: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=300&fit=crop&auto=format',
  5000: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400&h=300&fit=crop&auto=format',
  5714: 'https://images.unsplash.com/photo-1551650975-87deedd944c3?w=400&h=300&fit=crop&auto=format',
  6429: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=400&h=300&fit=crop&auto=format',
  7143: 'https://images.unsplash.com/photo-1484417894907-623942c8ee29?w=400&h=300&fit=crop&auto=format',
  7857: 'https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=400&h=300&fit=crop&auto=format',
  9999: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=400&h=300&fit=crop&auto=format',
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
