// Firebase Messaging Service Worker
// Handles push notifications when the app is in the background or closed.
// Uses Firebase compat SDK loaded from CDN (cannot use ES modules in SW).

importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyA5AhYFPMaykoF8TQXidqQo1DZ6eb1Zl6E',
  authDomain: 'piums-artista.firebaseapp.com',
  projectId: 'piums-artista',
  storageBucket: 'piums-artista.firebasestorage.app',
  messagingSenderId: '967320828042',
  appId: '1:967320828042:web:ab90c17f49a99feb5a1573',
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title ?? 'Piums';
  const body = payload.notification?.body ?? '';
  const icon = '/icons/icon-192x192.png';
  const badge = '/icons/icon-72x72.png';
  const data = payload.data ?? {};

  self.registration.showNotification(title, {
    body,
    icon,
    badge,
    tag: data.tag ?? 'piums-push',
    data: data.url ?? '/',
    vibrate: [200, 100, 200],
    actions: [
      { action: 'open', title: 'Ver' },
      { action: 'close', title: 'Cerrar' },
    ],
  });
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'close') return;
  const url = event.notification.data || '/';
  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        const existing = windowClients.find((c) => c.url === url && 'focus' in c);
        if (existing) return existing.focus();
        return clients.openWindow(url);
      })
  );
});
