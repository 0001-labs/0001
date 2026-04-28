/**
 * Sentences page module
 * Handles 9999 sentences table with compact mode.
 */
import type { Translations } from '../types';
import { initLanguage, cycleLanguage, toggleDSOneTheme, getCurrentLanguage, getTranslation, loadTranslations } from '../shared';
import { getThemeLabel } from '../../utils/theme';

const SENTENCE_IDS = [
  1, 42, 156, 233, 377, 512, 618, 714, 803, 891, 967, 1088, 1241, 1337, 1429, 1555, 1763, 1901,
  2022, 2143, 2301, 2504, 2689, 2857, 2944, 3102, 3333, 3571, 3819, 4044, 4286, 4501, 4618, 4811,
  5000, 5199, 5432, 5714, 5888, 6047, 6199, 6429, 6601, 6832, 6944, 7143, 7299, 7511, 7666, 7857,
  8394, 8571, 8714, 8888, 9047, 9199, 9286, 9429, 9512, 9666, 9811, 9901, 9950, 9999,
] as const;
const SENTENCE_ID_SET = new Set<number>(SENTENCE_IDS);

interface RowData {
  index: number;
  no: HTMLElement;
  sentence: HTMLElement;
  hasSentence: boolean;
}

const COMPACT_ICON = `<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 4H13" stroke="currentColor" stroke-width="1.5" stroke-linecap="square"/><path d="M3 8H13" stroke="currentColor" stroke-width="1.5" stroke-linecap="square"/><path d="M3 12H13" stroke="currentColor" stroke-width="1.5" stroke-linecap="square"/></svg>`;
const EXPANDED_ICON = `<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 2H2V6" stroke="currentColor" stroke-width="1.5" stroke-linecap="square"/><path d="M10 2H14V6" stroke="currentColor" stroke-width="1.5" stroke-linecap="square"/><path d="M6 14H2V10" stroke="currentColor" stroke-width="1.5" stroke-linecap="square"/><path d="M10 14H14V10" stroke="currentColor" stroke-width="1.5" stroke-linecap="square"/></svg>`;

const rows: RowData[] = [];
let isCompact = true;
let translations: Translations = {};

function getSentenceText(index: number): string | null {
  if (!SENTENCE_ID_SET.has(index)) {
    return null;
  }

  const key = `sentence-${index}`;
  const lang = getCurrentLanguage();
  const translated = translations[lang]?.[key] || translations.en?.[key];
  return translated || null;
}

function generateRows(): void {
  const columnNo = document.getElementById('column-no');
  const columnSentence = document.getElementById('column-sentence');

  if (!columnNo || !columnSentence) return;

  for (let i = 1; i <= 9999; i++) {
    const noCell = document.createElement('div');
    noCell.className = 'sentences-table__cell';
    noCell.textContent = String(i).padStart(4, '0');
    columnNo.appendChild(noCell);

    const sentenceCell = document.createElement('div');
    sentenceCell.className = 'sentences-table__cell';
    const sentenceText = getSentenceText(i);

    if (sentenceText) {
      if (i === 9999) {
        sentenceCell.classList.add('sentences-table__cell--hidden');
      }
      sentenceCell.textContent = sentenceText;
    } else {
      sentenceCell.classList.add('sentences-table__cell--input');

      const input = document.createElement('input');
      input.type = 'text';
      input.className = 'sentences-table__input';
      input.placeholder = 'Write a sentence...';
      input.dataset.index = String(i);

      const submitBtn = document.createElement('button');
      submitBtn.className = 'sentences-table__submit';
      submitBtn.textContent = 'Submit';

      const submitSentence = (): void => {
        if (!input.value.trim()) return;

        const sentenceData = {
          index: i,
          sentence: input.value.trim(),
        };
        console.log('Sentence submitted:', sentenceData);

        sentenceCell.classList.remove('sentences-table__cell--input');
        sentenceCell.textContent = input.value.trim();
        rows[i - 1].hasSentence = true;
      };

      input.addEventListener('input', () => {
        submitBtn.classList.toggle('visible', Boolean(input.value.trim()));
      });

      input.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
          submitSentence();
        }
      });

      submitBtn.addEventListener('click', submitSentence);

      sentenceCell.appendChild(input);
      sentenceCell.appendChild(submitBtn);
    }

    columnSentence.appendChild(sentenceCell);
    rows.push({ index: i, no: noCell, sentence: sentenceCell, hasSentence: Boolean(sentenceText) });
  }
}

function applyCompactState(): void {
  rows.forEach((row) => {
    const shouldHide = isCompact && !row.hasSentence;
    row.no.style.display = shouldHide ? 'none' : '';
    row.sentence.style.display = shouldHide ? 'none' : '';
  });
}

function updateCompactToggle(): void {
  const compactBtn = document.getElementById('compact-btn');
  if (!compactBtn) return;

  compactBtn.innerHTML = isCompact ? COMPACT_ICON : EXPANDED_ICON;
  compactBtn.setAttribute('aria-label', isCompact ? 'Show all rows' : 'Hide empty rows');
}

function initCompactToggle(): void {
  const compactBtn = document.getElementById('compact-btn');
  if (!compactBtn) return;

  applyCompactState();
  updateCompactToggle();

  compactBtn.addEventListener('click', () => {
    isCompact = !isCompact;
    applyCompactState();
    updateCompactToggle();
  });
}

function initLanguageToggle(): void {
  const langToggle = document.getElementById('lang-toggle');
  langToggle?.addEventListener('click', async () => {
    await cycleLanguage();
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

function applySentencesI18n(): void {
  rows.forEach((row) => {
    const sentenceText = getSentenceText(row.index);
    if (sentenceText) {
      row.sentence.textContent = sentenceText;
    }
  });
}

export function initSentences(): void {
  generateRows();
  initCompactToggle();
  initLanguageToggle();
  initThemeToggle();
  document.addEventListener('language-changed', applySentencesI18n);
  window.addEventListener('language-changed', applySentencesI18n);
}

function init(): void {
  void loadTranslations().then((loadedTranslations) => {
    translations = loadedTranslations;
    initSentences();
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
      themeToggle.textContent = getTranslation(translations, getThemeLabel(), getCurrentLanguage());
    }
  });
  void initLanguage();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
