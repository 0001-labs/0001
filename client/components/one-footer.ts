/**
 * one-footer Web Component
 * A styled footer that hooks into ds-one's language system
 *
 * Usage: <one-footer></one-footer>
 */
import type { Translations, SupportedLanguage } from '../modules/types';
import { LANGUAGE_NAMES, SUPPORTED_LANGUAGES } from '../modules/types';
import { TRANSLATIONS_PATH, DEFAULT_LANGUAGE, LANGUAGE_STORAGE_KEY } from '../modules/shared/constants';
import { setDSOneLanguage } from '../modules/shared/ds-one';

class OneFooter extends HTMLElement {
  private _translations: Translations | null = null;

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback(): void {
    this.render();
    this.loadTranslations();
    this.checkMobile();

    // Listen for language changes from ds-one
    document.addEventListener('language-changed', () => this.updateText());
  }

  private checkMobile(): void {
    const isMobile = document.documentElement.classList.contains('mobile');
    const footer = this.shadowRoot?.querySelector('.footer');
    if (isMobile && footer) {
      footer.classList.add('mobile');
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

    // Update all translatable elements
    this.shadowRoot.querySelectorAll<HTMLElement>('[data-i18n]').forEach((el) => {
      const key = el.dataset.i18n;
      if (key) {
        const text =
          this._translations![lang]?.[key] ||
          this._translations![DEFAULT_LANGUAGE]?.[key] ||
          key;
        el.textContent = text;
      }
    });

    // Update language toggle button text (both desktop and mobile)
    const langText = LANGUAGE_NAMES[lang] || 'English';
    const langBtn = this.shadowRoot.querySelector('#lang-toggle');
    const langBtnMobile = this.shadowRoot.querySelector('#lang-toggle-mobile');
    if (langBtn) langBtn.textContent = langText;
    if (langBtnMobile) langBtnMobile.textContent = langText;
  }

  private async handleLanguageToggle(): Promise<void> {
    const currentLang = (localStorage.getItem(LANGUAGE_STORAGE_KEY) || DEFAULT_LANGUAGE) as SupportedLanguage;
    const currentIndex = SUPPORTED_LANGUAGES.indexOf(currentLang);
    const nextIndex = (currentIndex + 1) % SUPPORTED_LANGUAGES.length;
    const nextLang = SUPPORTED_LANGUAGES[nextIndex];

    await setDSOneLanguage(nextLang);
    this.updateText();
  }

  private render(): void {
    if (!this.shadowRoot) return;

    const currentYear = new Date().getFullYear();

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
        }

        .footer {
          background-color: #f2ffcf;
          position: relative;
          padding: 0;
        }

        .footer__inner {
          padding: 60px 374px 50px 400px;
          display: flex;
          flex-direction: column;
          gap: 70px;
        }

        .footer__top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 450px;
        }

        .footer__brand {
          display: flex;
          align-items: baseline;
          gap: 10px;
        }

        .footer__brand-name {
          font-family: var(--font-medium, -apple-system, sans-serif);
          font-weight: 500;
          font-size: 16px;
          line-height: 1;
          letter-spacing: -0.32px;
          color: var(--base-black, #000);
        }

        .footer__tagline {
          font-family: var(--typeface-canon, Georgia, serif);
          font-size: 16px;
          line-height: 1;
          letter-spacing: -0.32px;
          color: var(--base-slate, #1e1e1e);
        }

        .footer__controls {
          display: flex;
          gap: 20px;
        }

        .footer__toggle {
          font-family: var(--font-regular, -apple-system, sans-serif);
          font-size: 16px;
          letter-spacing: -0.32px;
          color: #979441;
          background-color: #ccff4d;
          border: none;
          cursor: pointer;
          padding: 0;
        }

        .footer__nav {
          display: flex;
          gap: 0;
        }

        .footer__nav-column {
          display: flex;
          flex-direction: column;
          gap: 20px;
          width: 150px;
        }

        .footer__nav-header {
          font-family: var(--font-medium, -apple-system, sans-serif);
          font-size: 16px;
          letter-spacing: -0.32px;
          color: var(--every-green, #979441);
          /* Darken the headline green a bit, while staying on-brand */
          color: color-mix(in srgb, var(--every-green, #979441) 75%, black 25%);
          margin-bottom: 10px;
        }

        .footer__link {
          font-family: var(--font-pantheon-medium, Georgia, serif);
          font-size: 16px;
          letter-spacing: -0.32px;
          color: #979441;
          text-decoration: none;
        }

        .footer__link:hover {
          text-decoration: underline;
        }

        .footer__link--contact {
          background-color: #ccff4d;
          width: fit-content;
        }

        .footer__nav-column:nth-child(2) .footer__link,
        .footer__nav-column:nth-child(3) .footer__link {
          font-family: var(--font-regular, -apple-system, sans-serif);
        }

        .footer__bottom {
          position: absolute;
          left: 60px;
          bottom: 50px;
        }

        .footer__copyright {
          font-family: var(--font-medium, -apple-system, sans-serif);
          font-size: 14px;
          letter-spacing: -0.28px;
          color: rgba(101, 138, 8, 0.3);
          margin: 0;
        }

        .footer__controls-mobile {
          display: none;
        }

        /* Mobile styles */
        .footer.mobile {
          gap: calc(40px * var(--sf, 1));
        }

        .footer.mobile .footer__inner {
          padding: calc(40px * var(--sf, 1)) calc(20px * var(--sf, 1));
          gap: calc(40px * var(--sf, 1));
        }

        .footer.mobile .footer__top {
          width: calc(400px * var(--sf, 1));
        }

        .footer.mobile .footer__brand {
          width: 100%;
        }

        .footer.mobile .footer__controls {
          display: none;
        }

        .footer.mobile .footer__nav {
          flex-direction: column;
          gap: calc(30px * var(--sf, 1));
        }

        .footer.mobile .footer__nav-column {
          width: 100%;
          gap: calc(16px * var(--sf, 1));
        }

        .footer.mobile .footer__nav-header {
          font-size: calc(14px * var(--sf, 1));
          margin-bottom: calc(8px * var(--sf, 1));
        }

        .footer.mobile .footer__link {
          font-size: calc(14px * var(--sf, 1));
        }

        .footer.mobile .footer__controls-mobile {
          display: flex;
          gap: calc(20px * var(--sf, 1));
        }

        .footer.mobile .footer__bottom {
          position: relative;
          left: auto;
          bottom: auto;
          display: flex;
          flex-direction: column;
          gap: calc(30px * var(--sf, 1));
        }

        .footer.mobile .footer__copyright {
          font-size: calc(12px * var(--sf, 1));
        }
      </style>

      <footer class="footer">
        <div class="footer__inner">
          <div class="footer__top">
            <div class="footer__brand">
              <span class="footer__brand-name">0001</span>
              <span class="footer__tagline" data-i18n="We deliver digital products">We deliver digital products</span>
            </div>
            <div class="footer__controls">
              <button class="footer__toggle" id="lang-toggle">English</button>
              <button class="footer__toggle" data-i18n="Light">Light</button>
            </div>
          </div>

          <nav class="footer__nav">
            <div class="footer__nav-column">
              <span class="footer__nav-header" data-i18n="Company">Company</span>
              <a href="/services" class="footer__link" data-i18n="Services">Services</a>
              <a href="/about" class="footer__link" data-i18n="About us">About us</a>
              <a href="/sentences" class="footer__link" data-i18n="9999 Sentences">9999 Sentences</a>
              <a href="/contact" class="footer__link footer__link--contact" data-i18n="Contact us">Contact us</a>
            </div>
            <div class="footer__nav-column">
              <span class="footer__nav-header" data-i18n="Work">Work</span>
              <a href="/projects" class="footer__link" data-i18n="Projects">Projects</a>
              <a href="/products" class="footer__link" data-i18n="Products">Products</a>
              <a href="#" class="footer__link" data-i18n="Architecture">Architecture</a>
            </div>
            <div class="footer__nav-column">
              <span class="footer__nav-header" data-i18n="Other">Other</span>
              <a href="https://www.linkedin.com/company/000one/" class="footer__link" target="_blank" data-i18n="LinkedIn">LinkedIn</a>
              <a href="https://www.instagram.com/0001hq/" class="footer__link" target="_blank" data-i18n="Instagram">Instagram</a>
              <a href="/terms" class="footer__link" data-i18n="Terms and conditions">Terms and conditions</a>
            </div>
          </nav>
        </div>

        <div class="footer__bottom">
          <div class="footer__controls-mobile">
            <button class="footer__toggle" id="lang-toggle-mobile">English</button>
            <button class="footer__toggle" data-i18n="Light">Light</button>
          </div>
          <p class="footer__copyright">0001.dev © ${currentYear}</p>
        </div>
      </footer>
    `;

    // Add event listeners
    this.shadowRoot.querySelector('#lang-toggle')?.addEventListener('click', () => this.handleLanguageToggle());
    this.shadowRoot.querySelector('#lang-toggle-mobile')?.addEventListener('click', () => this.handleLanguageToggle());
  }
}

customElements.define('one-footer', OneFooter);
