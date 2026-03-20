// Service Worker Registration
// This script registers the service worker for PWA functionality

const ENABLE_PWA = false;

export function registerServiceWorker() {
  if (typeof window === 'undefined') {
    return;
  }

  const unregisterLegacyServiceWorkers = () => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => {
          console.log('[PWA] Unregistering old service worker:', registration.scope);
          registration.unregister();
        });
      });
    }
  };

  if (!ENABLE_PWA) {
    unregisterLegacyServiceWorkers();
    return;
  }

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
        });

        console.log('[PWA] Service Worker registered:', registration.scope);

        // Check for updates every hour
        setInterval(() => {
          registration.update();
        }, 60 * 60 * 1000);

        // Handle updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;

          if (!newWorker) {
            return;
          }

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New service worker available, show update notification
              showUpdateNotification(newWorker);
            }
          });
        });

        // Handle controller change (new SW activated)
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          console.log('[PWA] New Service Worker activated, reloading...');
          window.location.reload();
        });
      } catch (error) {
        console.error('[PWA] Service Worker registration failed:', error);
      }
    });
  } else {
    console.log('[PWA] Service Workers not supported in this browser');
  }
}

function showUpdateNotification(worker: ServiceWorker) {
  const notification = document.createElement('div');
  notification.id = 'sw-update-notification';
  notification.innerHTML = `
    <div style="
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.3);
      padding: 20px;
      max-width: 320px;
      z-index: 10000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
    ">
      <div style="display: flex; align-items: start; gap: 12px;">
        <div style="
          width: 40px;
          height: 40px;
          background: linear-gradient(135deg, #9333EA 0%, #7E22CE 100%);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        ">
          <svg width="20" height="20" fill="white" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clip-rule="evenodd" />
          </svg>
        </div>
        <div style="flex: 1;">
          <h4 style="margin: 0 0 8px; font-size: 15px; font-weight: 600; color: #1f2937;">
            Nueva versión disponible
          </h4>
          <p style="margin: 0 0 12px; font-size: 13px; color: #6b7280; line-height: 1.5;">
            Hay una actualización lista. Haz clic en actualizar para obtener las últimas mejoras.
          </p>
          <div style="display: flex; gap: 8px;">
            <button id="sw-update-btn" style="
              padding: 8px 16px;
              background: linear-gradient(135deg, #9333EA 0%, #7E22CE 100%);
              color: white;
              border: none;
              border-radius: 6px;
              font-weight: 600;
              font-size: 13px;
              cursor: pointer;
              transition: transform 0.2s;
            ">
              Actualizar
            </button>
            <button id="sw-dismiss-btn" style="
              padding: 8px 16px;
              background: transparent;
              color: #6b7280;
              border: none;
              border-radius: 6px;
              font-weight: 500;
              font-size: 13px;
              cursor: pointer;
            ">
              Después
            </button>
          </div>
        </div>
        <button id="sw-close-btn" style="
          width: 24px;
          height: 24px;
          background: transparent;
          border: none;
          cursor: pointer;
          color: #9ca3af;
          flex-shrink: 0;
        ">
          <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(notification);

  // Update button
  document.getElementById('sw-update-btn')?.addEventListener('click', () => {
    worker.postMessage({ type: 'SKIP_WAITING' });
  });

  // Dismiss button
  document.getElementById('sw-dismiss-btn')?.addEventListener('click', () => {
    notification.remove();
  });

  // Close button
  document.getElementById('sw-close-btn')?.addEventListener('click', () => {
    notification.remove();
  });
}

// Offline/Online detection
export function setupNetworkDetection() {
  if (typeof window === 'undefined') {
    return;
  }

  let offlineNotification: HTMLDivElement | null = null;

  const showOfflineNotification = () => {
    if (offlineNotification) return;

    offlineNotification = document.createElement('div');
    offlineNotification.id = 'offline-notification';
    offlineNotification.innerHTML = `
      <div style="
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        background: #f59e0b;
        color: white;
        padding: 12px;
        text-align: center;
        font-size: 14px;
        font-weight: 500;
        z-index: 10001;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
      ">
        <span style="display: inline-flex; align-items: center; gap: 8px;">
          <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
          </svg>
          Sin conexión a Internet - Trabajando en modo offline
        </span>
      </div>
    `;
    document.body.appendChild(offlineNotification);
  };

  const hideOfflineNotification = () => {
    if (offlineNotification) {
      offlineNotification.remove();
      offlineNotification = null;
    }
  };

  window.addEventListener('online', () => {
    console.log('[PWA] Back online');
    hideOfflineNotification();
  });

  window.addEventListener('offline', () => {
    console.log('[PWA] Gone offline');
    showOfflineNotification();
  });

  // Check initial state
  if (!navigator.onLine) {
    showOfflineNotification();
  }
}
