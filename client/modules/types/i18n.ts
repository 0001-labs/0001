/**
 * Supported languages in the application
 */
export type SupportedLanguage = 'en' | 'da' | 'ja';
export type Theme = 'light' | 'dark';

/**
 * Structure of the translations JSON file
 */
export interface Translations {
  [lang: string]: {
    [key: string]: string;
  };
}

/**
 * Language names for display
 */
export const LANGUAGE_NAMES: Record<SupportedLanguage, string> = {
  en: 'English',
  da: 'Dansk',
  ja: '日本語',
};

/**
 * Array of supported languages for cycling
 */
export const SUPPORTED_LANGUAGES: SupportedLanguage[] = ['en', 'da', 'ja'];
