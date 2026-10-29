/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** The API origin; empty means the same origin (`/api`, proxied by nginx in Docker). */
  readonly VITE_API_URL?: string;
  /** `'true'` in the public preview build (GitHub Pages): shows the "sample data" ribbon. */
  readonly VITE_PREVIEW?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
