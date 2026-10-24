import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './app/App';
import { initI18n } from './app/i18n';
import { createMockServices } from './mocks/create-mock-services';
import { reloadOnceForChunkError } from './shared/lib/chunk-reload';
import './styles/index.css';

// A preloaded chunk from an older deploy is gone: reload to pick up the new version
window.addEventListener('vite:preloadError', (event) => {
  if (reloadOnceForChunkError()) event.preventDefault();
});

// Prevent Radix UI from shifting the page when dropdowns open
const observer = new MutationObserver(() => {
  const style = document.body.getAttribute('style') || '';
  if (style.includes('pointer-events: none')) {
    document.body.style.removeProperty('pointer-events');
  }
  if (style.includes('padding-right')) {
    document.body.style.removeProperty('padding-right');
  }
});
observer.observe(document.body, { attributes: true, attributeFilter: ['style'] });

initI18n();

// The V2 API isn't built yet, so the app runs on the in-memory mock backend (src/mocks). The HTTP
// adapters will be wired in here, behind the same `Services` interfaces.
const services = createMockServices();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App services={services} />
  </React.StrictMode>
);
