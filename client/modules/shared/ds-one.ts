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
  } catch (error) {
    console.error('Failed to set DS one language:', error);
    // Fallback: dispatch event manually
    localStorage.setItem('language', lang);
    document.dispatchEvent(new CustomEvent('language-changed'));
  }
}
