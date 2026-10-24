import '@testing-library/jest-dom/vitest';
import { cleanup, configure } from '@testing-library/react';
import { afterEach, beforeEach } from 'vitest';
import { initI18n } from '@/app/i18n';

// Screens are lazily loaded chunks; under a parallel run the first import can take over a second
configure({ asyncUtilTimeout: 5000 });

// Browser APIs jsdom lacks that Radix Select uses to open and scroll its list
Element.prototype.hasPointerCapture ??= () => false;
Element.prototype.releasePointerCapture ??= () => {};
Element.prototype.scrollIntoView ??= () => {};

// Tests read English text; a test that switches language is reset before the next one
initI18n('en');
beforeEach(() => {
  initI18n('en');
});

afterEach(() => {
  cleanup();
  localStorage.clear();
});
