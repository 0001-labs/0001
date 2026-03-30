/**
 * one-services-menu Web Component
 * A compact services dropdown for the home page.
 *
 * Usage: <one-services-menu></one-services-menu>
 */

type Cleanup = () => void;

class OneServicesMenu extends HTMLElement {
  private cleanup: Cleanup | null = null;

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback(): void {
    this.render();

    const root = this.shadowRoot;
    if (!root) return;

    const details = root.querySelector<HTMLDetailsElement>('details');
    if (!details) return;

    const captureOpts: AddEventListenerOptions = { capture: true };

    const onDocPointerDown = (ev: PointerEvent): void => {
      if (!details.open) return;
      const path = (ev.composedPath?.() ?? []) as EventTarget[];
      if (!path.includes(this)) {
        details.open = false;
      }
    };

    const onDocKeyDown = (ev: KeyboardEvent): void => {
      if (ev.key === 'Escape' && details.open) {
        details.open = false;
      }
    };

    const onMenuClick = (ev: Event): void => {
      const target = ev.target as HTMLElement | null;
      if (!target) return;
      const link = target.closest('a');
      if (link && details.open) {
        details.open = false;
      }
    };

    document.addEventListener('pointerdown', onDocPointerDown, captureOpts);
    document.addEventListener('keydown', onDocKeyDown);
    root.addEventListener('click', onMenuClick);

    this.cleanup = () => {
      document.removeEventListener('pointerdown', onDocPointerDown, captureOpts);
      document.removeEventListener('keydown', onDocKeyDown);
      root.removeEventListener('click', onMenuClick);
    };
  }

  disconnectedCallback(): void {
    this.cleanup?.();
    this.cleanup = null;
  }

  private render(): void {
    if (!this.shadowRoot) return;

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          font-family: var(--font-regular, -apple-system, BlinkMacSystemFont, sans-serif);
          color: var(--base-slate, #1e1e1e);
        }

        details {
          position: relative;
          display: inline-block;
        }

        summary {
          list-style: none;
          cursor: pointer;
          user-select: none;
          -webkit-user-select: none;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 6px 10px;
          border-radius: 999px;
          background: rgba(204, 255, 77, 0.55);
          color: var(--base-slate, #1e1e1e);
          border: 1px solid rgba(0, 0, 0, 0.08);
          box-shadow: 0 2px 10px rgba(0,0,0,0.06);
        }

        summary::-webkit-details-marker {
          display: none;
        }

        .label {
          font-family: var(--font-medium, -apple-system, BlinkMacSystemFont, sans-serif);
          font-size: 16px;
          letter-spacing: -0.32px;
        }

        .caret {
          font-size: 12px;
          opacity: 0.75;
          transform: translateY(1px);
        }

        details[open] summary {
          background: rgba(204, 255, 77, 0.85);
        }

        details[open] .caret {
          transform: translateY(1px) rotate(180deg);
        }

        .panel {
          position: absolute;
          top: calc(100% + 10px);
          left: 50%;
          transform: translateX(-50%);
          width: min(560px, calc(100vw - 40px));
          background: var(--tau99-brand, #f2ffcf);
          border: 1px solid rgba(0, 0, 0, 0.1);
          border-radius: 18px;
          box-shadow: 0 18px 45px rgba(0,0,0,0.12);
          padding: 18px 18px 14px;
          display: grid;
          grid-template-columns: 1fr 1fr 0.8fr;
          gap: 14px;
          z-index: 1000;
        }

        .col {
          display: flex;
          flex-direction: column;
          gap: 10px;
          padding: 8px 10px;
          border-radius: 14px;
          background: rgba(255, 255, 255, 0.55);
        }

        .heading {
          font-family: var(--font-medium, -apple-system, BlinkMacSystemFont, sans-serif);
          font-size: 12px;
          letter-spacing: -0.24px;
          text-transform: uppercase;
          color: rgba(30, 30, 30, 0.65);
        }

        a {
          display: inline-flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          padding: 8px 10px;
          border-radius: 12px;
          font-size: 16px;
          letter-spacing: -0.32px;
          text-decoration: none;
          color: var(--base-slate, #1e1e1e);
          transition: background 120ms ease, transform 120ms ease;
        }

        a:hover {
          background: rgba(204, 255, 77, 0.55);
          transform: translateY(-1px);
        }

        .cta {
          grid-column: 1 / -1;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
          padding: 10px 10px 0;
        }

        .cta a {
          font-family: var(--font-medium, -apple-system, BlinkMacSystemFont, sans-serif);
          background: rgba(204, 255, 77, 0.65);
        }

        .cta a:hover {
          background: rgba(204, 255, 77, 0.9);
        }

        .hint {
          font-size: 12px;
          letter-spacing: -0.24px;
          color: rgba(30, 30, 30, 0.55);
          white-space: nowrap;
        }

        @media (prefers-reduced-motion: reduce) {
          a {
            transition: none;
          }
          a:hover {
            transform: none;
          }
        }
      </style>

      <details>
        <summary aria-label="Services menu">
          <span class="label">Services:</span>
          <span class="caret" aria-hidden="true">▼</span>
        </summary>

        <div class="panel" role="menu" aria-label="Services">
          <div class="col">
            <div class="heading">Frontend</div>
            <a role="menuitem" href="/contact?topic=SEO">SEO</a>
            <a role="menuitem" href="/contact?topic=Speed+optimizing">Speed optimizing</a>
            <a role="menuitem" href="/contact?topic=Marketing+sites">Marketing sites</a>
          </div>

          <div class="col">
            <div class="heading">Backend</div>
            <a role="menuitem" href="/contact?topic=API+development">API development</a>
            <a role="menuitem" href="/contact?topic=Database+design">Database design</a>
            <a role="menuitem" href="/contact?topic=Cloud+infrastructure">Cloud infrastructure</a>
          </div>

          <div class="col">
            <div class="heading">AI</div>
            <a role="menuitem" href="/contact?topic=AI+Agents">Agents</a>
            <a role="menuitem" href="/contact?topic=MCP">MCP</a>
          </div>

          <div class="cta">
            <a role="menuitem" href="/services">All services</a>
            <span class="hint">Esc to close</span>
          </div>
        </div>
      </details>
    `;
  }
}

customElements.define('one-services-menu', OneServicesMenu);
