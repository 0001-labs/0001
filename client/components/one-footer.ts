/**
 * one-footer Web Component
 * Site-owned footer with language toggle and local translations.
 */
import type { Translations, SupportedLanguage } from '../modules/types';
import { LANGUAGE_NAMES, SUPPORTED_LANGUAGES } from '../modules/types';
import { TRANSLATIONS_PATH, DEFAULT_LANGUAGE, LANGUAGE_STORAGE_KEY } from '../modules/shared/constants';
import footerButtonsCss from '../design/css/buttons.css?raw';
import { setDSOneLanguage } from '../modules/shared/ds-one';

class OneFooter extends HTMLElement {
  private translations: Translations | null = null;
  private readonly handleLanguageChange = (): void => this.updateText();

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback(): void {
    this.render();
    void this.loadTranslations();
    document.addEventListener('language-changed', this.handleLanguageChange);
    window.addEventListener('language-changed', this.handleLanguageChange);
  }

  disconnectedCallback(): void {
    document.removeEventListener('language-changed', this.handleLanguageChange);
    window.removeEventListener('language-changed', this.handleLanguageChange);
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

  private getCurrentLanguage(): SupportedLanguage {
    return (localStorage.getItem(LANGUAGE_STORAGE_KEY) || DEFAULT_LANGUAGE) as SupportedLanguage;
  }

  private getTranslatedText(key: string, lang: SupportedLanguage): string {
    return this.translations?.[lang]?.[key] || this.translations?.[DEFAULT_LANGUAGE]?.[key] || key;
  }

  private updateText(): void {
    if (!this.shadowRoot) return;

    const lang = this.getCurrentLanguage();

    if (this.translations) {
      this.shadowRoot.querySelectorAll<HTMLElement>('[data-i18n]').forEach((el) => {
        const key = el.dataset.i18n;
        if (key) {
          el.textContent = this.getTranslatedText(key, lang);
        }
      });
    }

    const languageLabel = LANGUAGE_NAMES[lang] || 'English';
    this.shadowRoot.querySelectorAll<HTMLElement>('[data-role="lang"]').forEach((el) => {
      el.textContent = languageLabel;
    });
  }

  private async handleLanguageToggle(): Promise<void> {
    const currentLang = this.getCurrentLanguage();
    const currentIndex = SUPPORTED_LANGUAGES.indexOf(currentLang);
    const nextLang = SUPPORTED_LANGUAGES[(currentIndex + 1) % SUPPORTED_LANGUAGES.length];

    await setDSOneLanguage(nextLang);
    this.updateText();
  }

  private render(): void {
    if (!this.shadowRoot) return;

    const currentYear = new Date().getFullYear();

    this.shadowRoot.innerHTML = `
      <style>
        ${footerButtonsCss}
      </style>
      <style>
        :host {
          display: block;
        }

        .footer {
          background-color: var(--footer-background, #f2ffcf);
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
          font-family: "GT-Canon-M-Standard-Medium", Georgia, serif;
          font-size: 16px;
          line-height: 1;
          letter-spacing: -0.32px;
          color: var(--base-slate, #1e1e1e);
        }

        .footer__controls {
          display: flex;
          gap: 10px;
          align-items: center;
        }

        .footer__nav {
          display: flex;
          gap: 0;
        }

        .footer__nav-group--primary {
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
          color: var(--footer-link-color, #979441);
          margin-bottom: 10px;
          text-decoration: underline;
        }

        .footer__link {
          font-family: var(--font-pantheon-medium, Georgia, serif);
          font-size: 16px;
          letter-spacing: -0.32px;
          color: var(--footer-link-color, #979441);
          text-decoration: none;
        }

        .footer__link:hover {
          text-decoration: none;
        }

        .footer__link--dimmed {
          color: var(--footer-link-dimmed, rgba(151, 148, 65, 0.4));
          font-size: 12px;
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
          color: var(--footer-copyright, rgba(101, 138, 8, 0.3));
          margin: 0;
        }

        .footer__controls-mobile {
          display: none;
        }

        @media (max-width: 768px) {
          .footer__inner {
            padding: 32px 20px 0;
            gap: 32px;
          }

          .footer__top {
            width: 100%;
            flex-direction: column;
            align-items: flex-start;
            gap: 16px;
          }

          .footer__brand {
            width: 100%;
            flex-wrap: wrap;
            gap: 6px;
          }

          .footer__tagline {
            line-height: 1.3;
          }

          .footer__controls {
            display: none;
          }

          .footer__nav {
            display: grid;
            grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
            column-gap: 16px;
            align-items: start;
          }

          .footer__nav-group--primary {
            display: flex;
            flex-direction: column;
            gap: 24px;
            min-width: 0;
          }

          .footer__nav-column {
            width: 100%;
            min-width: 0;
            gap: 16px;
          }

          .footer__nav-column--other {
            display: flex;
            flex-direction: column;
            gap: 12px;
          }

          .footer__nav-column--other .footer__controls-mobile {
            display: flex;
          }

          .footer__nav-header {
            font-size: 14px;
            margin-bottom: 0;
          }

          .footer__link {
            font-size: 14px;
          }

          .footer__bottom {
            position: static;
            margin-top: 48px;
            padding-bottom: 56px;
          }

          .footer__copyright {
            font-size: 12px;
            color: rgba(101, 138, 8, 0.45);
          }
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
              <button type="button" class="button" data-role="lang">English</button>
            </div>
          </div>

          <nav class="footer__nav">
            <div class="footer__nav-group--primary">
              <div class="footer__nav-column">
                <span class="footer__nav-header" data-i18n="Company">Company</span>
                <a href="/services" class="footer__link" data-i18n="Services">Services</a>
                <a href="/about" class="footer__link" data-i18n="About us">About us</a>
                <a href="/sentences" class="footer__link" data-i18n="9999 Sentences">9999 Sentences</a>
                <a href="/tokushoho" class="footer__link">Tokushoho</a>
                <a href="/contact" class="button" data-i18n="Contact us">Contact us</a>
              </div>
              <div class="footer__nav-column">
                <span class="footer__nav-header" data-i18n="Work">Work</span>
                <a href="/products" class="footer__link" data-i18n="Products">Products</a>
                <a href="/architecture" class="footer__link" data-i18n="Architecture">Architecture</a>
              </div>
            </div>

            <div class="footer__nav-column footer__nav-column--other">
              <span class="footer__nav-header" data-i18n="Other">Other</span>
              <a
                href="https://www.linkedin.com/company/000one/"
                class="footer__link"
                target="_blank"
                rel="noreferrer"
                data-i18n="LinkedIn"
              >LinkedIn</a>
              <a
                href="https://www.instagram.com/0001hq/"
                class="footer__link"
                target="_blank"
                rel="noreferrer"
                data-i18n="Instagram"
              >Instagram</a>
              <div class="footer__controls-mobile">
                <button type="button" class="button" data-role="lang">English</button>
              </div>
            </div>
          </nav>

          <div class="footer__bottom">
            <p class="footer__copyright">0001.dev © ${currentYear}</p>
          </div>
        </div>
      </footer>
    `;

    this.shadowRoot.querySelectorAll<HTMLElement>('[data-role="lang"]').forEach((button) => {
      button.addEventListener('click', () => {
        void this.handleLanguageToggle();
      });
    });

    this.updateText();
  }
}

if (!customElements.get('one-footer')) {
  customElements.define('one-footer', OneFooter);
}
