'use client';

import { useEffect } from 'react';
import { InstallPrompt } from '@/components/InstallPrompt';
import { registerServiceWorker, setupNetworkDetection } from '@/lib/pwa';
import { usePushNotifications } from '@/hooks/usePushNotifications';

function PushNotificationManager() {
  const { supported, permission, requestPermission } = usePushNotifications();

  // Auto-prompt once, 3 seconds after load, if permission hasn't been decided yet
  useEffect(() => {
    if (!supported || permission !== 'default') return;
    const timer = setTimeout(() => {
      requestPermission();
    }, 3000);
    return () => clearTimeout(timer);
  }, [supported, permission, requestPermission]);

  return null;
}

export function PWAInitializer() {
  useEffect(() => {
    registerServiceWorker();
    setupNetworkDetection();
  }, []);

  return (
    <>
      <PushNotificationManager />
      <InstallPrompt />
    </>
  );
}
