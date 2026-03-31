/**
 * one-footer Web Component
 * Styled footer with language / contact .button controls
 *
 * Usage: <one-footer></one-footer>
 */
import type { Translations, SupportedLanguage } from "../modules/types";
import { LANGUAGE_NAMES, SUPPORTED_LANGUAGES } from "../modules/types";
import {
  TRANSLATIONS_PATH,
  DEFAULT_LANGUAGE,
  LANGUAGE_STORAGE_KEY,
} from "../modules/shared/constants";
import footerButtonsCss from "../design/css/buttons.css?raw";
import { setDSOneLanguage } from "../modules/shared/ds-one";

class OneFooter extends HTMLElement {
  private _translations: Translations | null = null;
  private readonly handleLanguageChange = (): void => this.updateText();

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback(): void {
    this.render();
    this.loadTranslations();
    this.checkMobile();
    document.addEventListener("language-changed", this.handleLanguageChange);
    window.addEventListener("language-changed", this.handleLanguageChange);
  }

  disconnectedCallback(): void {
    document.removeEventListener("language-changed", this.handleLanguageChange);
    window.removeEventListener("language-changed", this.handleLanguageChange);
  }

  private checkMobile(): void {
    const isMobile = document.documentElement.classList.contains("mobile");
    const footer = this.shadowRoot?.querySelector(".footer");
    if (isMobile && footer) {
      footer.classList.add("mobile");
    }
  }

  private async loadTranslations(): Promise<void> {
    try {
      const res = await fetch(TRANSLATIONS_PATH);
      this._translations = await res.json();
      this.updateText();
    } catch (e) {
      console.error("Failed to load translations:", e);
    }
  }

  private updateText(): void {
    const lang = (localStorage.getItem(LANGUAGE_STORAGE_KEY) ||
      DEFAULT_LANGUAGE) as SupportedLanguage;
    if (!this.shadowRoot) return;

    if (this._translations) {
      this.shadowRoot
        .querySelectorAll<HTMLElement>("[data-i18n]")
        .forEach((el) => {
          const key = el.dataset.i18n;
          if (key) {
            el.textContent = this.getTranslatedText(key, lang);
          }
        });
    }

    const langText = LANGUAGE_NAMES[lang] || "English";
    this.shadowRoot
      .querySelectorAll<HTMLElement>('[data-role="lang"]')
      .forEach((btn) => {
        btn.textContent = langText;
      });
  }

  private async handleLanguageToggle(): Promise<void> {
    const currentLang = (localStorage.getItem(LANGUAGE_STORAGE_KEY) ||
      DEFAULT_LANGUAGE) as SupportedLanguage;
    const currentIndex = SUPPORTED_LANGUAGES.indexOf(currentLang);
    const nextIndex = (currentIndex + 1) % SUPPORTED_LANGUAGES.length;
    await setDSOneLanguage(SUPPORTED_LANGUAGES[nextIndex]);
    this.updateText();
  }

  private getTranslatedText(key: string, lang: SupportedLanguage): string {
    return (
      this._translations?.[lang]?.[key] ||
      this._translations?.[DEFAULT_LANGUAGE]?.[key] ||
      key
    );
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
          font-family: var(--typeface-canon, Georgia, serif);
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
          color: var(--footer-copyright, rgba(101, 138, 8, 0.3));
          margin: 0;
        }

        .footer__controls-mobile {
          display: none;
        }

        /* Mobile styles */
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
          gap: calc(10px * var(--sf, 1));
          align-items: center;
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
              <button type="button" class="button" data-role="lang">English</button>
            </div>
          </div>

          <nav class="footer__nav">
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
            <div class="footer__nav-column">
              <span class="footer__nav-header" data-i18n="Other">Other</span>
              <a href="https://www.linkedin.com/company/000one/" class="footer__link" target="_blank" data-i18n="LinkedIn">LinkedIn</a>
              <a href="https://www.instagram.com/0001hq/" class="footer__link" target="_blank" data-i18n="Instagram">Instagram</a>
            </div>
          </nav>
        </div>

        <div class="footer__bottom">
          <div class="footer__controls-mobile">
            <button type="button" class="button" data-role="lang">English</button>
          </div>
          <p class="footer__copyright">0001.dev © ${currentYear}</p>
        </div>
      </footer>
    `;

    this.shadowRoot.querySelectorAll('[data-role="lang"]').forEach((btn) => {
      btn.addEventListener("click", () => this.handleLanguageToggle());
    });
  }
}

customElements.define("one-footer", OneFooter);
