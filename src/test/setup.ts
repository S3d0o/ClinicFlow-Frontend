import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeEach } from 'vitest';
import { initI18n } from '@/app/i18n';

// Tests read English text; a test that switches language is reset before the next one
initI18n('en');
beforeEach(() => {
  initI18n('en');
});

afterEach(() => {
  cleanup();
  localStorage.clear();
});
