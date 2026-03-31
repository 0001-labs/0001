import type { DSOneModule, SupportedLanguage } from '../types';
import { DS_ONE_CDN_URL } from './constants';

/**
 * Dynamically import DS one module
 */
export async function importDSOne(): Promise<DSOneModule> {
  return import(/* @vite-ignore */ DS_ONE_CDN_URL) as Promise<DSOneModule>;
}

/**
 * Set language using DS one's setLanguage function
 */
export async function setDSOneLanguage(lang: SupportedLanguage): Promise<void> {
  try {
    const dsOne = await importDSOne();
    dsOne.setLanguage(lang);
    // DS one dispatches on window; also fire on document for local listeners
    document.dispatchEvent(new CustomEvent('language-changed'));
  } catch (error) {
    console.error('Failed to set DS one language:', error);
    localStorage.setItem('language', lang);
    window.dispatchEvent(new CustomEvent('language-changed'));
    document.dispatchEvent(new CustomEvent('language-changed'));
  }
}

/** No-op: site is light-only; footer theme control kept for layout compatibility */
export async function toggleDSOneTheme(): Promise<void> {}
