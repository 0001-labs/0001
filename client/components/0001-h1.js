/**
 * one-h1 Web Component
 * A styled h1 that hooks into ds-one's language system
 *
 * Usage: <one-h1>translation-key</one-h1>
 */
class OneH1 extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._key = '';
    this._translations = null;
  }

  connectedCallback() {
    this._key = this.textContent.trim();
    this.render();
    this.loadTranslations();

    // Listen for language changes from ds-one
    document.addEventListener('language-changed', () => this.updateText());

    // Observe changes to the text content (for dynamic key updates)
    this._observer = new MutationObserver(() => {
      const newKey = this.textContent.trim();
      if (newKey !== this._key) {
        this._key = newKey;
        this.updateText();
      }
    });
    this._observer.observe(this, { childList: true, characterData: true, subtree: true });
  }

  disconnectedCallback() {
    if (this._observer) {
      this._observer.disconnect();
    }
  }

  async loadTranslations() {
    try {
      const res = await fetch('./language/translations.json');
      this._translations = await res.json();
      this.updateText();
    } catch (e) {
      console.error('Failed to load translations:', e);
    }
  }

  updateText() {
    if (!this._translations) return;

    const lang = localStorage.getItem('language') || 'en';
    const text = this._translations[lang]?.[this._key]
              || this._translations['en']?.[this._key]
              || this._key;

    const h1 = this.shadowRoot.querySelector('h1');
    if (h1) {
      h1.textContent = text;
    }
  }

  render() {
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
          max-width: 400px;
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
