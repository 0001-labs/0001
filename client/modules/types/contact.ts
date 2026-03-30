/**
 * Contact form data structure
 */
export interface ContactFormData {
  name: string;
  company?: string;
  email: string;
  phone?: string;
  message: string;
  topics: string[];
  techstack: string[];
}

/**
 * Contact form mode (services vs tech stack selection)
 */
export type ContactMode = 'services' | 'techstack';

/**
 * API response from contact form submission
 */
export interface ContactApiResponse {
  success: boolean;
  message?: string;
  error?: string;
}
