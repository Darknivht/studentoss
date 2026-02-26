import { useEffect, useState, useCallback } from 'react';

interface ServiceWorkerUpdate {
  isUpdateAvailable: boolean;
  updateServiceWorker: () => void;
}

export function usePWAUpdate(): ServiceWorkerUpdate {
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);

  const updateServiceWorker = useCallback(() => {
    if (waitingWorker) {
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
      setIsUpdateAvailable(false);
      window.location.reload();
    }
  }, [waitingWorker]);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    const checkForUpdates = async () => {
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        if (!registration) return;

        // Check if there's already a waiting worker
        if (registration.waiting) {
          setWaitingWorker(registration.waiting);
          setIsUpdateAvailable(true);
        }

        // Listen for new updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (!newWorker) return;

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              setWaitingWorker(newWorker);
              setIsUpdateAvailable(true);
            }
          });
        });

        // Auto-check for updates every 30 minutes
        const interval = setInterval(() => {
          registration.update();
        }, 30 * 60 * 1000);

        return () => clearInterval(interval);
      } catch (err) {
        console.error('SW update check failed:', err);
      }
    };

    checkForUpdates();

    // When the new SW takes over, reload the page
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    });
  }, []);

  return { isUpdateAvailable, updateServiceWorker };
}
