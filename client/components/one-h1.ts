/**
 * one-h1 Web Component
 * A styled h1 that hooks into ds-one's language system
 *
 * Usage: <one-h1>translation-key</one-h1>
 */
import type { Translations, SupportedLanguage } from '../modules/types';
import { TRANSLATIONS_PATH, DEFAULT_LANGUAGE, LANGUAGE_STORAGE_KEY } from '../modules/shared/constants';

class OneH1 extends HTMLElement {
  private _key: string = '';
  private _translations: Translations | null = null;
  private _observer: MutationObserver | null = null;

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback(): void {
    this._key = this.textContent?.trim() || '';
    this.render();
    this.loadTranslations();

    // Listen for language changes from ds-one
    document.addEventListener('language-changed', () => this.updateText());

    // Observe changes to the text content (for dynamic key updates)
    this._observer = new MutationObserver(() => {
      const newKey = this.textContent?.trim() || '';
      if (newKey !== this._key) {
        this._key = newKey;
        this.updateText();
      }
    });
    this._observer.observe(this, { childList: true, characterData: true, subtree: true });
  }

  disconnectedCallback(): void {
    if (this._observer) {
      this._observer.disconnect();
    }
  }

  private async loadTranslations(): Promise<void> {
    try {
      const res = await fetch(TRANSLATIONS_PATH);
      this._translations = await res.json();
      this.updateText();
    } catch (e) {
      console.error('Failed to load translations:', e);
    }
  }

  private updateText(): void {
    if (!this._translations || !this.shadowRoot) return;

    const lang = (localStorage.getItem(LANGUAGE_STORAGE_KEY) || DEFAULT_LANGUAGE) as SupportedLanguage;
    const text =
      this._translations[lang]?.[this._key] ||
      this._translations[DEFAULT_LANGUAGE]?.[this._key] ||
      this._key;

    const h1 = this.shadowRoot.querySelector('h1');
    if (h1) {
      h1.textContent = text;
    }
  }

  private render(): void {
    if (!this.shadowRoot) return;

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
        }
        h1 {
          font-family: var(--typeface-canon, Georgia, serif);
          font-size: 48px;
          letter-spacing: -0.96px;
          color: var(--base-slate, #2a2a2a);
          line-height: 1.2;
          font-weight: normal;
          margin: 0;
          max-width: 100%;
          text-wrap: balance;
          user-select: none;
          -webkit-user-select: none;
        }
      </style>
      <h1></h1>
    `;
    this.updateText();
  }
}

customElements.define('one-h1', OneH1);
