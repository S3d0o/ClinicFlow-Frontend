import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App';
import './index.css';

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

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </React.StrictMode>
);
