import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { i18n, i18nPromise } from './i18n';

i18nPromise.then(() => {
  const savedLanguage = localStorage.getItem('preferredLanguage');
  if (savedLanguage) {
    i18n.changeLanguage(savedLanguage);
  }

  const root = createRoot(document.getElementById('root'));
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
});

reportWebVitals();