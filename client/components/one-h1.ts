/**
 * one-h1 Web Component
 * Localized heading element used on the home page.
 */
import type { Translations, SupportedLanguage } from '../modules/types';
import { TRANSLATIONS_PATH, DEFAULT_LANGUAGE, LANGUAGE_STORAGE_KEY } from '../modules/shared/constants';

class OneH1 extends HTMLElement {
  private key = '';
  private translations: Translations | null = null;
  private observer: MutationObserver | null = null;
  private readonly handleLanguageChange = (): void => this.updateText();

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback(): void {
    this.key = this.textContent?.trim() || '';
    this.render();
    void this.loadTranslations();

    document.addEventListener('language-changed', this.handleLanguageChange);
    window.addEventListener('language-changed', this.handleLanguageChange);

    this.observer = new MutationObserver(() => {
      const nextKey = this.textContent?.trim() || '';
      if (nextKey !== this.key) {
        this.key = nextKey;
        this.updateText();
      }
    });
    this.observer.observe(this, { childList: true, characterData: true, subtree: true });
  }

  disconnectedCallback(): void {
    document.removeEventListener('language-changed', this.handleLanguageChange);
    window.removeEventListener('language-changed', this.handleLanguageChange);
    this.observer?.disconnect();
  }

  private async loadTranslations(): Promise<void> {
    try {
      const response = await fetch(TRANSLATIONS_PATH);
      this.translations = await response.json();
      this.updateText();
    } catch (error) {
      console.error('Failed to load translations:', error);
    }
  }

  private updateText(): void {
    if (!this.translations || !this.shadowRoot) return;

    const lang = (localStorage.getItem(LANGUAGE_STORAGE_KEY) || DEFAULT_LANGUAGE) as SupportedLanguage;
    const text = this.translations[lang]?.[this.key] || this.translations[DEFAULT_LANGUAGE]?.[this.key] || this.key;
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
          font-family: "GT-Canon-M-Standard-Medium", Georgia, serif;
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

        @media (max-width: 768px) {
          h1 {
            font-size: 32px;
            letter-spacing: -0.64px;
          }
        }
      </style>
      <h1></h1>
    `;

    this.updateText();
  }
}

customElements.define('one-h1', OneH1);
