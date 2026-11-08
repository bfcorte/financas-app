/* Service worker simples: cache-first dos arquivos do build, para abrir offline. */
const CACHE = 'financas-__VERSAO__';
const ARQUIVOS = __ARQUIVOS__;

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ARQUIVOS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k.startsWith('financas-') && k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const fontes = url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
  if (url.origin !== self.location.origin && !fontes) return;
  if (req.mode === 'navigate') {
    // Página: rede primeiro (pega versão nova na hora), cache se estiver offline.
    e.respondWith(fetch(req).then((res) => {
      if (res && res.ok) { const copia = res.clone(); caches.open(CACHE).then((c) => c.put('./', copia)); }
      return res;
    }).catch(() => caches.match('./', { ignoreSearch: true })));
    return;
  }
  e.respondWith(caches.match(req, { ignoreSearch: true }).then((r) => r || fetch(req).then((res) => {
    if (res && (res.ok || res.type === 'opaque')) { const copia = res.clone(); caches.open(CACHE).then((c) => c.put(req, copia)); }
    return res;
  })));
});

/* ---------- Notificações push ---------- */
// O iOS revoga a assinatura de quem recebe push sem mostrar nada: sempre mostra.
self.addEventListener('push', (e) => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (x) { d = { corpo: e.data ? e.data.text() : '' }; }
  const titulo = d.titulo || 'Finanças';
  e.waitUntil(self.registration.showNotification(titulo, {
    body: d.corpo || '',
    tag: d.tag || undefined,
    renotify: !!d.tag,
    icon: './icons/icon-192.png',
    badge: './icons/icon-192.png',
    data: { url: d.url || '#/painel' },
  }));
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const destino = (e.notification.data && e.notification.data.url) || '#/painel';
  const alvo = new URL(destino.startsWith('#') ? self.registration.scope + destino : destino, self.registration.scope).href;
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((lista) => {
    for (const c of lista) {
      if (c.url.startsWith(self.registration.scope) && 'focus' in c) {
        return c.focus().then((w) => (w && 'navigate' in w ? w.navigate(alvo) : c.postMessage({ tipo: 'abrir', url: destino })));
      }
    }
    return self.clients.openWindow(alvo);
  }));
});
