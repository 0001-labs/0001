/**
 * one-footer Web Component
 * Site-owned footer with language toggle and local translations.
 */
import type { Translations, SupportedLanguage } from '../modules/types';
import { LANGUAGE_NAMES, SUPPORTED_LANGUAGES } from '../modules/types';
import { TRANSLATIONS_PATH, DEFAULT_LANGUAGE, LANGUAGE_STORAGE_KEY } from '../modules/shared/constants';
import footerButtonsCss from '../design/css/buttons.css?raw';
import { setDSOneLanguage, toggleDSOneTheme } from '../modules/shared/ds-one';
import { getThemeLabel } from '../utils/theme';

class OneFooter extends HTMLElement {
  private translations: Translations | null = null;
  private readonly handleLanguageChange = (): void => this.updateText();
  private readonly handleThemeChange = (): void => this.updateThemeText();

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback(): void {
    this.render();
    void this.loadTranslations();
    document.addEventListener('language-changed', this.handleLanguageChange);
    window.addEventListener('language-changed', this.handleLanguageChange);
    document.addEventListener('theme-changed', this.handleThemeChange);
    window.addEventListener('theme-changed', this.handleThemeChange);
  }

  disconnectedCallback(): void {
    document.removeEventListener('language-changed', this.handleLanguageChange);
    window.removeEventListener('language-changed', this.handleLanguageChange);
    document.removeEventListener('theme-changed', this.handleThemeChange);
    window.removeEventListener('theme-changed', this.handleThemeChange);
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

    this.renderTermsLink(lang);

    const languageLabel = LANGUAGE_NAMES[lang] || 'English';
    this.shadowRoot.querySelectorAll<HTMLElement>('[data-role="lang"]').forEach((el) => {
      el.textContent = languageLabel;
    });

    this.updateThemeText();
  }

  private updateThemeText(): void {
    if (!this.shadowRoot) return;

    const lang = this.getCurrentLanguage();
    const themeLabel = this.getTranslatedText(getThemeLabel(), lang);
    this.shadowRoot.querySelectorAll<HTMLElement>('[data-role="theme"]').forEach((el) => {
      el.textContent = themeLabel;
    });
  }

  private renderTermsLink(lang: SupportedLanguage): void {
    if (!this.shadowRoot) return;

    const termsLink = this.shadowRoot.querySelector<HTMLElement>('[data-role="terms-link"]');
    if (!termsLink) return;

    const translatedText = this.getTranslatedText('Terms and conditions', lang);

    if (translatedText === 'Terms and conditions') {
      termsLink.classList.add('footer__link--poetry-active');
      termsLink.innerHTML = '<span class="footer__poetry-line">Terms and</span><span class="footer__poetry-line footer__poetry-line--end">conditions</span>';
      return;
    }

    if (translatedText === 'Termsconditions and') {
      termsLink.classList.add('footer__link--poetry-active');
      termsLink.innerHTML = '<span class="footer__poetry-line">Terms</span><span class="footer__poetry-line footer__poetry-line--end">conditions and</span>';
      return;
    }

    const breakIndex = translatedText.lastIndexOf(' ');
    if (breakIndex > 0) {
      const firstLine = translatedText.slice(0, breakIndex);
      const lastLine = translatedText.slice(breakIndex + 1);

      termsLink.classList.add('footer__link--poetry-active');
      termsLink.innerHTML = `<span class="footer__poetry-line">${firstLine}</span><span class="footer__poetry-line footer__poetry-line--end">${lastLine}</span>`;
      return;
    }

    termsLink.classList.remove('footer__link--poetry-active');
    termsLink.textContent = translatedText;
  }

  private async handleLanguageToggle(): Promise<void> {
    const currentLang = this.getCurrentLanguage();
    const currentIndex = SUPPORTED_LANGUAGES.indexOf(currentLang);
    const nextLang = SUPPORTED_LANGUAGES[(currentIndex + 1) % SUPPORTED_LANGUAGES.length];

    await setDSOneLanguage(nextLang);
    this.updateText();
  }

  private async handleThemeToggle(): Promise<void> {
    await toggleDSOneTheme();
    this.updateThemeText();
  }

  private render(): void {
    if (!this.shadowRoot) return;

    const currentYear = new Date().getFullYear();

    this.shadowRoot.innerHTML = `
      <style>
        ${footerButtonsCss}
      </style>
      <style>
        @font-face {
          font-family: "GT America";
          src: url("/design/fonts/GT-America-Standard-Regular.woff2") format("woff2");
          font-weight: 400;
          font-style: normal;
          font-display: swap;
        }

        @font-face {
          font-family: "GT America";
          src: url("/design/fonts/GT-America-Standard-Medium.woff2") format("woff2");
          font-weight: 500;
          font-style: normal;
          font-display: swap;
        }

        @font-face {
          font-family: "GT-Canon-M-Standard-Medium";
          src: url("/design/fonts/GT-Canon-M-Standard-Medium-Trial.woff2") format("woff2");
          font-weight: 400;
          font-style: normal;
          font-display: swap;
        }

        :host {
          display: block;
          --font-regular: "GT America";
          --font-medium: "GT America";
          --font-canon: "GT-Canon-M-Standard-Medium";
          /* Footer nav grid — Figma 150 + 150 + 100 = 400px; tweak gaps here */
          --footer-nav-cols: 150px 150px 100px;
          --footer-nav-column-gap: 0px;
        }

        .footer {
          background-color: var(--footer-background, #f2ffcf);
          position: relative;
          padding: 0;
        }

        .footer__inner {
          position: relative;
          box-sizing: border-box;
          width: 400px;
          max-width: 400px;
          margin-left: 400px;
          margin-right: 0;
          padding: 80px 0;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 80px;
        }

        .footer__mark {
          position: absolute;
          top: 64px;
          left: -49px;
          font-family: var(--font-medium);
          font-weight: 500;
          font-size: 16px;
          line-height: 1;
          letter-spacing: -0.32px;
          color: var(--base-stealth, #545);
        }

        .footer__top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          width: 100%;
          box-sizing: border-box;
        }

        .footer__tagline {
          width: 300px;
          font-family: var(--font-regular);
          font-weight: 400;
          font-size: 16px;
          line-height: 1;
          letter-spacing: -0.32px;
          color: var(--base-stealth, #545);
        }

        .footer__controls {
          display: flex;
          gap: 20px;
          align-items: center;
        }

        .footer__nav {
          display: grid;
          grid-template-columns: var(--footer-nav-cols);
          column-gap: var(--footer-nav-column-gap);
          row-gap: 0;
          align-items: start;
          width: 100%;
          box-sizing: border-box;
        }

        .footer__nav-column {
          display: flex;
          flex-direction: column;
          gap: 20px;
          box-sizing: border-box;
          min-width: 0;
        }

        .footer__nav-column--company,
        .footer__nav-column--work {
          width: 100%;
        }

        /* Figma 2077:139 — 30px between section label and first link */
        .footer__nav-heading-group {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 30px;
          width: 100%;
        }

        /* Other column — third grid track */
        .footer__nav-column--other {
          align-items: flex-start;
          text-align: left;
        }

        .footer__nav-column--other .footer__nav-heading-group {
          align-items: flex-start;
        }

        .footer__nav-column--other .footer__nav-header {
          display: block;
          text-align: left;
          width: 100%;
        }

        .footer__nav-column--other .footer__link {
          text-align: left;
          align-self: stretch;
        }

        .footer__nav-header {
          font-family: var(--font-medium);
          font-weight: 500;
          font-size: 16px;
          line-height: 15px;
          min-height: 15px;
          letter-spacing: -0.32px;
          color: var(--footer-link-color, #ff4438);
          margin: 0;
          text-decoration: none;
        }

        :host-context(html[lang="ja"]) .footer__nav-header {
          font-weight: 500;
          -webkit-text-stroke: 0.2px currentColor;
        }

        .footer__link {
          font-family: var(--font-canon);
          font-weight: 400;
          font-size: 16px;
          letter-spacing: -0.32px;
          line-height: 20px;
          min-height: 20px;
          color: var(--footer-link-color, #ff4438);
          text-decoration: none;
          margin: 0;
          padding: 0;
          display: flex;
          align-items: center;
        }

        .footer__link--sans {
          font-family: var(--font-regular);
          font-size: 16px;
          min-height: 20px;
        }

        .footer__link--with-icon {
          gap: 7px;
          white-space: nowrap;
        }

        .footer__link--with-icon a {
          color: inherit;
          text-decoration: none;
        }

        .footer__link-icon {
          width: 16px;
          height: 16px;
          flex: 0 0 auto;
        }

        .footer__link--poetry {
          width: 100px;
          text-align: right;
          align-items: flex-start;
        }

        .footer__link--poetry-active {
          display: flex;
          flex-direction: column;
          align-items: stretch;
          text-align: left;
        }

        .footer__poetry-line {
          display: block;
          width: 100%;
          line-height: 20px;
        }

        .footer__poetry-line--end {
          text-align: right;
        }

        .footer__nav-column > a.button {
          display: inline-block;
          align-self: flex-start;
          box-sizing: border-box;
          height: 16px;
          max-height: 16px;
          min-height: 16px;
          padding: 0;
          margin: 0;
          line-height: 16px;
          font-size: 14px;
          letter-spacing: -0.28px;
          font-weight: 400;
          font-family: var(--font-regular);
          vertical-align: top;
          overflow: hidden;
          color: var(--footer-control-text, #ff4438);
          background-color: var(--footer-control-background, #ccff4d);
        }

        .footer__nav-column > a.button:hover,
        .footer__nav-column > a.button:focus-visible {
          text-decoration: none;
        }

        .footer__controls .button:hover,
        .footer__controls .button:focus-visible,
        .footer__controls-mobile .button:hover,
        .footer__controls-mobile .button:focus-visible {
          opacity: 1;
          background-color: var(--footer-control-background, #ccff4d);
          text-decoration: none;
        }

        /* 30px between last work link and Contact */
        .footer__nav-column--work > a.button {
          margin-top: 10px;
        }

        .footer__link:hover {
          text-decoration: none;
        }

        .footer__link--dimmed {
          color: var(--footer-link-dimmed, rgba(255, 68, 56, 0.4));
          font-size: 12px;
        }

        .footer__controls-mobile {
          display: none;
        }

        .footer__bottom {
          position: absolute;
          left: 0;
          bottom: 76px;
          width: 200px;
          height: 20px;
          min-height: 20px;
          box-sizing: border-box;
        }

        .footer__copyright {
          font-family: var(--font-medium);
          font-weight: 500;
          font-size: 14px;
          letter-spacing: -0.28px;
          line-height: 20px;
          min-height: 20px;
          color: var(--footer-copyright, rgba(255, 68, 56, 0.32));
          margin: 0;
          text-align: right;
        }

        @media (max-width: 768px) {
          .footer__inner {
            width: 100%;
            max-width: 100%;
            margin-left: 0;
            padding: calc(32px * var(--sf)) calc(20px * var(--sf)) calc(48px * var(--sf));
            gap: calc(32px * var(--sf));
          }

          .footer__mark {
            position: static;
            order: -1;
            font-size: calc(16px * var(--sf));
            letter-spacing: calc(-0.32px * var(--sf));
          }

          .footer__top {
            width: 100%;
            flex-direction: column;
            align-items: flex-start;
            gap: calc(16px * var(--sf));
          }

          .footer__tagline {
            width: 100%;
            max-width: 300px;
            font-size: calc(16px * var(--sf));
            letter-spacing: calc(-0.32px * var(--sf));
            line-height: 1.3;
          }

          .footer__controls {
            display: none;
          }

          .footer__nav {
            grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
            column-gap: calc(16px * var(--sf));
            row-gap: calc(24px * var(--sf));
            align-items: start;
            max-width: 400px;
            width: 100%;
          }

          .footer__nav-column--company {
            grid-column: 1;
            grid-row: 1;
          }

          .footer__nav-column--work {
            grid-column: 1;
            grid-row: 2;
          }

          .footer__nav-column--other {
            grid-column: 2;
            grid-row: 1 / span 2;
            align-self: start;
            display: flex;
            flex-direction: column;
            gap: calc(16px * var(--sf));
            align-items: flex-start;
            text-align: left;
            width: 100%;
            min-width: 0;
          }

          .footer__nav-column {
            width: 100%;
            min-width: 0;
            gap: calc(16px * var(--sf));
          }

          .footer__nav-column--other .footer__link,
          .footer__nav-column--other .footer__nav-heading-group {
            align-self: flex-start;
            text-align: left;
          }

          .footer__nav-column--other .footer__nav-heading-group {
            align-items: flex-start;
          }

          .footer__nav-heading-group {
            gap: calc(24px * var(--sf));
          }

          .footer__nav-column--other .footer__controls-mobile {
            display: flex;
            gap: calc(12px * var(--sf));
          }

          .footer__controls-mobile .button {
            font-size: calc(14px * var(--sf));
            letter-spacing: calc(-0.28px * var(--sf));
            height: calc(16px * var(--sf));
            max-height: calc(16px * var(--sf));
            min-height: calc(16px * var(--sf));
            line-height: calc(16px * var(--sf));
          }

          .footer__nav-header {
            font-size: calc(14px * var(--sf));
            line-height: calc(15px * var(--sf));
            min-height: calc(15px * var(--sf));
            margin-bottom: 0;
          }

          .footer__link {
            font-size: calc(14px * var(--sf));
            letter-spacing: calc(-0.28px * var(--sf));
            line-height: calc(20px * var(--sf));
            min-height: calc(20px * var(--sf));
          }

          .footer__nav-column > a.button {
            font-size: calc(14px * var(--sf));
            letter-spacing: calc(-0.28px * var(--sf));
            height: calc(16px * var(--sf));
            max-height: calc(16px * var(--sf));
            min-height: calc(16px * var(--sf));
            line-height: calc(16px * var(--sf));
          }

          .footer__nav-column--work > a.button {
            margin-top: calc(14px * var(--sf)); /* 16px column gap + 14 = 30px to previous link */
          }

          .footer__bottom {
            position: static;
            left: auto;
            bottom: auto;
            width: 100%;
            max-width: 200px;
            margin-top: 0;
          }

          .footer__copyright {
            font-size: calc(12px * var(--sf));
            color: rgba(255, 68, 56, 0.45);
          }
        }
      </style>

      <footer class="footer">
        <div class="footer__inner">
          <p class="footer__mark">0001</p>
          <div class="footer__top">
            <span class="footer__tagline" data-i18n="We deliver digital products">We deliver digital products</span>
            <div class="footer__controls">
              <button type="button" class="button" data-role="lang">English</button>
              <button type="button" class="button" data-role="theme">Light</button>
            </div>
          </div>

          <nav class="footer__nav">
            <div class="footer__nav-column footer__nav-column--work">
              <div class="footer__nav-heading-group">
                <span class="footer__nav-header" data-i18n="Work">Work</span>
                <a href="/0001-projects.html" class="footer__link footer__link--sans" data-i18n="Projects">Projects</a>
              </div>
              <a href="/products" class="footer__link footer__link--sans" data-i18n="Products">Products</a>
              <span class="footer__link footer__link--sans footer__link--with-icon">
                <a href="/open-source" data-i18n="Open Source">Open Source</a>
                <a href="https://github.com/0001-labs" target="_blank" rel="noreferrer" aria-label="0001-labs on GitHub">
                <svg class="footer__link-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.1.79-.25.79-.56v-2.17c-3.2.7-3.87-1.36-3.87-1.36-.52-1.33-1.28-1.68-1.28-1.68-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.19 1.76 1.19 1.03 1.75 2.69 1.24 3.34.95.1-.74.4-1.24.73-1.53-2.55-.29-5.24-1.28-5.24-5.68 0-1.25.45-2.28 1.18-3.08-.12-.29-.51-1.46.11-3.04 0 0 .96-.31 3.16 1.18A10.9 10.9 0 0 1 12 6.04c.98 0 1.96.13 2.88.39 2.19-1.49 3.15-1.18 3.15-1.18.63 1.58.24 2.75.12 3.04.74.8 1.18 1.83 1.18 3.08 0 4.41-2.69 5.38-5.25 5.67.42.36.78 1.07.78 2.16v3.15c0 .31.21.67.8.56A11.51 11.51 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z"/>
                </svg>
                </a>
              </span>
              <a href="/architecture" class="footer__link footer__link--sans" data-i18n="Architecture">Architecture</a>
              <a href="/contact" class="button" data-i18n="Contact">Contact</a>
            </div>
            <div class="footer__nav-column footer__nav-column--company">
              <div class="footer__nav-heading-group">
                <span class="footer__nav-header" data-i18n="Company">Company</span>
                <a href="/services" class="footer__link" data-i18n="Services">Services</a>
              </div>
              <a href="/about" class="footer__link" data-i18n="About">About</a>
              <a href="/sentences" class="footer__link" data-i18n="9999 Sentences">9999 Sentences</a>
            </div>

            <div class="footer__nav-column footer__nav-column--other">
              <div class="footer__nav-heading-group">
                <span class="footer__nav-header" data-i18n="Other">Other</span>
                <a
                  href="https://www.linkedin.com/company/000one/"
                  class="footer__link footer__link--sans"
                  target="_blank"
                  rel="noreferrer"
                  data-i18n="LinkedIn"
                >LinkedIn</a>
              </div>
              <a
                href="https://www.instagram.com/0001hq/"
                class="footer__link footer__link--sans"
                target="_blank"
                rel="noreferrer"
                data-i18n="Instagram"
              >Instagram</a>
              <a
                href="/terms"
                class="footer__link footer__link--sans footer__link--poetry"
                data-i18n="Terms and conditions"
                data-role="terms-link"
              >Terms and conditions</a>
              <a
                href="/privacy"
                class="footer__link footer__link--sans footer__link--dimmed"
                data-i18n="Privacy"
              >Privacy</a>
              <a
                href="/data-deletion"
                class="footer__link footer__link--sans footer__link--dimmed"
                data-i18n="Data deletion"
              >Data deletion</a>
              <a
                href="/tokushoho"
                class="footer__link footer__link--sans footer__link--dimmed"
                data-i18n="Tokushoho"
              >Tokushoho</a>
              <a
                href="https://link.0001.dev"
                class="footer__link footer__link--sans footer__link--dimmed"
                data-i18n="Link"
              >Link</a>
              <div class="footer__controls-mobile">
                <button type="button" class="button" data-role="lang">English</button>
                <button type="button" class="button" data-role="theme">Light</button>
              </div>
            </div>
          </nav>
        </div>
        <div class="footer__bottom">
          <p class="footer__copyright">0001 © ${currentYear}</p>
        </div>
      </footer>
    `;

    this.shadowRoot.querySelectorAll<HTMLElement>('[data-role="lang"]').forEach((button) => {
      button.addEventListener('click', () => {
        void this.handleLanguageToggle();
      });
    });

    this.shadowRoot.querySelectorAll<HTMLElement>('[data-role="theme"]').forEach((button) => {
      button.addEventListener('click', () => {
        void this.handleThemeToggle();
      });
    });

    this.updateText();
  }
}

if (!customElements.get('one-footer')) {
  customElements.define('one-footer', OneFooter);
}
