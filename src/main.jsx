import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './ds/index.js';
import './app.css';
import App from './App.jsx';
import { iniciarTema } from './tema.js';

iniciarTema();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  // Quando sai uma versão nova, o service worker novo assume e a página recarrega uma vez.
  const jaTinha = !!navigator.serviceWorker.controller;
  let recarregou = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!jaTinha || recarregou) return;
    recarregou = true;
    window.location.reload();
  });
  // clique numa notificação com o app já aberto
  navigator.serviceWorker.addEventListener('message', (e) => {
    if (e.data && e.data.tipo === 'abrir' && typeof e.data.url === 'string' && e.data.url.startsWith('#/')) window.location.hash = e.data.url;
  });
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').then((r) => {
      document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') r.update().catch(() => {}); });
    }).catch(() => {});
  });
}
