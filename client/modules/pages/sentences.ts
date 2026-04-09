/**
 * Sentences page module
 * Handles 9999 sentences table with compact mode.
 */
import { initLanguage, cycleLanguage, toggleDSOneTheme } from '../shared';
import { getThemeLabel } from '../../utils/theme';

const sentences: Record<number, string> = {
  1: 'We deliver digital products',
  714: 'Small teams, sharp edges',
  1429: 'Every pixel is a promise',
  2143: 'Built to outlast trends',
  2857: 'Shipping beats perfection',
  3571: 'Details that disappear when done right',
  4286: 'Systems over pages',
  5000: 'Craft is in the constraints',
  5714: 'Making tools feel like instincts',
  6429: 'Nothing decorative, everything deliberate',
  7143: 'We delete more than we keep',
  7857: 'Complexity absorbed, simplicity delivered',
  1241: 'Telling stories again and again',
  9999: 'The last sentence is never written',
};

interface RowData {
  no: HTMLElement;
  sentence: HTMLElement;
  hasSentence: boolean;
}

const COMPACT_ICON = `<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 4H13" stroke="currentColor" stroke-width="1.5" stroke-linecap="square"/><path d="M3 8H13" stroke="currentColor" stroke-width="1.5" stroke-linecap="square"/><path d="M3 12H13" stroke="currentColor" stroke-width="1.5" stroke-linecap="square"/></svg>`;
const EXPANDED_ICON = `<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 2H2V6" stroke="currentColor" stroke-width="1.5" stroke-linecap="square"/><path d="M10 2H14V6" stroke="currentColor" stroke-width="1.5" stroke-linecap="square"/><path d="M6 14H2V10" stroke="currentColor" stroke-width="1.5" stroke-linecap="square"/><path d="M10 14H14V10" stroke="currentColor" stroke-width="1.5" stroke-linecap="square"/></svg>`;

const rows: RowData[] = [];
let isCompact = true;

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

    if (sentences[i]) {
      if (i === 9999) {
        sentenceCell.classList.add('sentences-table__cell--hidden');
      }
      sentenceCell.textContent = sentences[i];
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
        sentences[i] = input.value.trim();
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
    rows.push({ no: noCell, sentence: sentenceCell, hasSentence: Boolean(sentences[i]) });
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
      themeToggle.textContent = getThemeLabel();
    }
  };

  themeToggle?.addEventListener('click', async () => {
    await toggleDSOneTheme();
    updateThemeLabel();
  });

  window.addEventListener('theme-changed', updateThemeLabel);
  updateThemeLabel();
}

export function initSentences(): void {
  generateRows();
  initCompactToggle();
  initLanguageToggle();
  initThemeToggle();
}

function init(): void {
  initSentences();
  void initLanguage();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
