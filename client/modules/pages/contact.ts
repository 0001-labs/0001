/**
 * Contact page module
 * Handles multi-step contact form with topic selection
 */
import type { ContactFormData, ContactMode, Translations } from '../types';
import {
  getCurrentLanguage,
  getTranslation,
  initLanguage,
  loadTranslations,
  updatePlaceholders,
} from '../shared';

let currentMode: ContactMode = 'services';
const selectedServices = new Set<string>();
const selectedTechstack = new Set<string>();

function setContactProgressStep(step: 1 | 2): void {
  const bar = document.getElementById('contact-progress');
  if (!bar) return;
  bar.dataset.step = String(step);
  bar.setAttribute('aria-valuenow', String(step));
}

/**
 * Initialize mode toggle tabs
 */
function initModeToggle(): void {
  const modeBtns = document.querySelectorAll<HTMLButtonElement>('.contact-mode-btn');
  const modeServices = document.getElementById('mode-services');
  const modeTechstack = document.getElementById('mode-techstack');

  modeBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const mode = btn.dataset.mode as ContactMode;
      if (mode === currentMode) return;

      currentMode = mode;

      // Update button states
      modeBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');

      // Show/hide modes
      if (mode === 'services') {
        modeServices?.classList.remove('hidden');
        modeTechstack?.classList.add('hidden');
      } else {
        modeServices?.classList.add('hidden');
        modeTechstack?.classList.remove('hidden');
      }
    });
  });
}

/**
 * Initialize topic selection
 */
function initTopicSelection(): void {
  const options = document.querySelectorAll<HTMLElement>('.contact-option');

  options.forEach((option) => {
    option.addEventListener('click', () => {
      const value = option.dataset.value;
      if (!value) return;

      const isInTechstack = option.closest('#mode-techstack') !== null;
      const targetSet = isInTechstack ? selectedTechstack : selectedServices;

      if (option.classList.contains('selected')) {
        option.classList.remove('selected');
        targetSet.delete(value);
      } else {
        option.classList.add('selected');
        targetSet.add(value);
      }
    });
  });

  // Pre-select topic from URL query param
  const urlParams = new URLSearchParams(window.location.search);
  const topicParam = urlParams.get('topic');
  if (topicParam) {
    const option = document.querySelector<HTMLElement>(`.contact-option[data-value="${topicParam}"]`);
    if (option) {
      option.classList.add('selected');
      const isInTechstack = option.closest('#mode-techstack') !== null;
      if (isInTechstack) {
        selectedTechstack.add(topicParam);
      } else {
        selectedServices.add(topicParam);
      }
    }
  }
}

/**
 * Display selected topics in step 2
 */
function displaySelectedTopics(): void {
  const selectedTopicsDisplay = document.getElementById('selected-topics-display');
  if (!selectedTopicsDisplay) return;

  selectedTopicsDisplay.innerHTML = '';

  // Add services selections
  if (selectedServices.size > 0) {
    const servicesLabel = document.createElement('span');
    servicesLabel.className = 'contact-topic-label';
    servicesLabel.textContent = 'Services:';
    selectedTopicsDisplay.appendChild(servicesLabel);
    selectedServices.forEach((topic) => {
      const tag = document.createElement('span');
      tag.className = 'contact-topic-tag';
      tag.textContent = topic;
      selectedTopicsDisplay.appendChild(tag);
    });
  }

  // Add tech stack selections
  if (selectedTechstack.size > 0) {
    const techLabel = document.createElement('span');
    techLabel.className = 'contact-topic-label';
    techLabel.textContent = 'Tech:';
    selectedTopicsDisplay.appendChild(techLabel);
    selectedTechstack.forEach((topic) => {
      const tag = document.createElement('span');
      tag.className = 'contact-topic-tag';
      tag.textContent = topic;
      selectedTopicsDisplay.appendChild(tag);
    });
  }
}

/**
 * Initialize step navigation
 */
function initStepNavigation(): void {
  const nextBtn = document.getElementById('next-btn');
  const step1 = document.getElementById('step-1');
  const step2 = document.getElementById('step-2');

  nextBtn?.addEventListener('click', () => {
    const hasSelections = selectedServices.size > 0 || selectedTechstack.size > 0;
    if (!hasSelections) {
      alert('Please select at least one topic.');
      return;
    }

    displaySelectedTopics();

    // Switch to step 2
    step1?.classList.remove('active');
    step2?.classList.add('active');
    setContactProgressStep(2);
  });
}

/**
 * Initialize form submission
 */
function initFormSubmission(): void {
  const form = document.getElementById('message-form') as HTMLFormElement | null;

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const submitBtn = form.querySelector<HTMLButtonElement>('button[type="submit"]');
    if (!submitBtn) return;

    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Sending...';
    submitBtn.disabled = true;

    const formData = new FormData(form);
    const data: ContactFormData = {
      topics: Array.from(selectedServices),
      techstack: Array.from(selectedTechstack),
      name: formData.get('name') as string,
      company: formData.get('company') as string || undefined,
      email: formData.get('email') as string,
      phone: formData.get('phone') as string || undefined,
      message: formData.get('message') as string,
    };

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        window.location.href = '/thank-you';
      } else {
        throw new Error('Failed to submit');
      }
    } catch (error) {
      console.error('Form submission error:', error);
      alert('Failed to send message. Please try again.');
      submitBtn.textContent = originalText;
      submitBtn.disabled = false;
    }
  });
}

function applyContactDataI18n(translations: Translations): void {
  const lang = getCurrentLanguage();
  document.querySelectorAll<HTMLElement>('[data-i18n]').forEach((el) => {
    const key = el.dataset.i18n;
    if (key) {
      el.textContent = getTranslation(translations, key, lang);
    }
  });
}

/**
 * Placeholders + static labels (h1, Next, …)
 */
async function initPlaceholders(): Promise<void> {
  const translations = await loadTranslations();
  updatePlaceholders(translations);
  applyContactDataI18n(translations);

  const refresh = (): void => {
    updatePlaceholders(translations);
    applyContactDataI18n(translations);
  };

  document.addEventListener('language-changed', refresh);
  window.addEventListener('language-changed', refresh);
}

/**
 * Initialize the contact form
 */
export function initContactForm(): void {
  setContactProgressStep(1);
  initModeToggle();
  initTopicSelection();
  initStepNavigation();
  initFormSubmission();
  initPlaceholders();
}

/**
 * Initialize the contact page
 */
function init(): void {
  initContactForm();
  initLanguage();
}

// Auto-initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
