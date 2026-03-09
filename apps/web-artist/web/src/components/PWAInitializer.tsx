'use client';

import { useEffect } from 'react';
import { InstallPrompt } from '@/components/InstallPrompt';
import { registerServiceWorker, setupNetworkDetection } from '@/lib/pwa';

export function PWAInitializer() {
  useEffect(() => {
    // Register service worker
    registerServiceWorker();
    
    // Setup network detection
    setupNetworkDetection();
  }, []);

  return <InstallPrompt />;
}
