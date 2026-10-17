import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

afterEach(() => {
  cleanup();
  // Tests may clear all of jsdom's storage; app code must use clearSession() instead
  localStorage.clear();
});
