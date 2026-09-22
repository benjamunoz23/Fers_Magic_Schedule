// sw.js — Service Worker para "Fer's Magic Schedule"
// Este archivo SOLO sirve si alojas fers-magic-schedule.html en un dominio real
// (GitHub Pages, Netlify, Vercel, etc.), guardando sw.js en la MISMA carpeta.
// Dentro de una vista previa/artifact no se puede registrar un Service Worker real,
// así que la app funciona igual sin él: esto es un extra para cuando tengas hosting propio.
//
// Qué hace:
// 1. Cachea el HTML para que la app cargue más rápido / funcione sin internet.
// 2. Permite mostrar notificaciones vía registration.showNotification()
//    (usado como respaldo si el JS de la página llama a fireNotification()).
//
// Lo que NO hace (y no puede hacer ningún Service Worker sin backend):
// - Avisar con la app totalmente cerrada después de mucho rato. Eso requiere
//   Web Push real (VAPID) con un servidor que envíe el push en el momento exacto.

const CACHE_NAME = "fers-magic-schedule-v1";
const APP_SHELL = [
  "./",
  "./index.html"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => {
      return (
        cached ||
        fetch(event.request).catch(() => cached)
      );
    })
  );
});

// Si en el futuro conectas un servidor de Web Push real, este handler
// recibiría el push y mostraría la notificación aunque la app esté cerrada.
self.addEventListener("push", (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch (e) {}
  const title = data.title || "Fer's Magic Schedule";
  const body = data.body || "";
  event.waitUntil(self.registration.showNotification(title, { body }));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: "window" }).then((clientsArr) => {
      if (clientsArr.length > 0) return clientsArr[0].focus();
      return self.clients.openWindow("./index.html");
    })
  );
});
