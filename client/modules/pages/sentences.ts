/**
 * Sentences page module
 * Handles 9999 sentences table with compact mode
 */
import { initLanguage, cycleLanguage, toggleDSOneTheme } from '../shared';
import { getThemeLabel } from '../../utils/theme';

/** Predefined sentences */
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

const rows: RowData[] = [];
let isCompact = true;

/**
 * Generate all 9999 rows
 */
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
      // Has a sentence - show text
      if (i === 9999) {
        sentenceCell.classList.add('sentences-table__cell--hidden');
      }
      sentenceCell.textContent = sentences[i];
    } else {
      // Empty slot - show input field with submit button
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
        if (input.value.trim()) {
          const sentenceData = {
            index: i,
            sentence: input.value.trim(),
          };
          console.log('Sentence submitted:', sentenceData);
          // TODO: Send to backend

          // Show as submitted
          sentenceCell.classList.remove('sentences-table__cell--input');
          sentenceCell.textContent = input.value.trim();
          sentences[i] = input.value.trim();
          rows[i - 1].hasSentence = true;
        }
      };

      input.addEventListener('input', () => {
        if (input.value.trim()) {
          submitBtn.classList.add('visible');
        } else {
          submitBtn.classList.remove('visible');
        }
      });

      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          submitSentence();
        }
      });

      submitBtn.addEventListener('click', submitSentence);

      sentenceCell.appendChild(input);
      sentenceCell.appendChild(submitBtn);
    }

    columnSentence.appendChild(sentenceCell);

    rows.push({ no: noCell, sentence: sentenceCell, hasSentence: !!sentences[i] });
  }
}

/**
 * Apply compact state to rows
 */
function applyCompactState(): void {
  rows.forEach((row) => {
    if (isCompact && !row.hasSentence) {
      row.no.style.display = 'none';
      row.sentence.style.display = 'none';
    } else {
      row.no.style.display = '';
      row.sentence.style.display = '';
    }
  });
}

/**
 * Initialize compact toggle
 */
function initCompactToggle(): void {
  const compactBtn = document.getElementById('compact-btn');
  const compactIcon = compactBtn?.querySelector('ds-icon');

  if (!compactBtn || !compactIcon) return;

  // Apply initial compact state
  applyCompactState();
  compactIcon.setAttribute('type', 'row');

  compactBtn.addEventListener('click', () => {
    isCompact = !isCompact;
    applyCompactState();
    // Toggle icon: 'row' to expand, 'in' to compact
    compactIcon.setAttribute('type', isCompact ? 'row' : 'in');
  });
}

/**
 * Initialize language toggle (custom footer on this page)
 */
function initLanguageToggle(): void {
  const langToggle = document.getElementById('lang-toggle');

  langToggle?.addEventListener('click', async () => {
    await cycleLanguage();
  });
}

/**
 * Initialize theme toggle (custom footer on this page)
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
 * Initialize the sentences page
 */
export function initSentences(): void {
  generateRows();
  initCompactToggle();
  initLanguageToggle();
  initThemeToggle();
}

/**
 * Initialize the page
 */
function init(): void {
  initSentences();
  initLanguage();
}

// Auto-initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
