'use client';

import { useEffect } from 'react';
import { registerServiceWorker, setupNetworkDetection } from '@/lib/pwa';

export function PWAInitializer() {
  useEffect(() => {
    // Register service worker
    registerServiceWorker();
    
    // Setup network detection
    setupNetworkDetection();
  }, []);

  return null;
}
