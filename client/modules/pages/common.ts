/**
 * Common page module
 * For pages that only need language initialization
 */
import { initLanguage } from '../shared';

// Auto-initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => initLanguage());
} else {
  initLanguage();
}
