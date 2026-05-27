'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { getToken, onMessage } from 'firebase/messaging';
import { messaging } from '@/lib/firebase';

const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
const SW_PATH = '/firebase-messaging-sw.js';
const TOKEN_CACHE_KEY = 'fcm_token';

export type PushPermission = 'default' | 'granted' | 'denied';

interface UsePushNotificationsResult {
  permission: PushPermission;
  supported: boolean;
  requestPermission: () => Promise<void>;
}

export function usePushNotifications(): UsePushNotificationsResult {
  const [permission, setPermission] = useState<PushPermission>('default');
  const registeredRef = useRef(false);

  const supported =
    typeof window !== 'undefined' &&
    'Notification' in window &&
    'serviceWorker' in navigator &&
    !!messaging &&
    !!VAPID_KEY;

  useEffect(() => {
    if (!supported) return;
    setPermission(Notification.permission as PushPermission);
  }, [supported]);

  // Foreground message handler — shows a Notification while the tab is open
  useEffect(() => {
    if (!supported || !messaging) return;
    const unsubscribe = onMessage(messaging, (payload) => {
      if (Notification.permission !== 'granted') return;
      const title = payload.notification?.title ?? 'Piums';
      const body = payload.notification?.body ?? '';
      new Notification(title, {
        body,
        icon: '/icons/icon-192x192.png',
        data: payload.data,
      });
    });
    return unsubscribe;
  }, [supported]);

  const registerToken = useCallback(async () => {
    if (!messaging || !VAPID_KEY || registeredRef.current) return;
    try {
      const swReg = await navigator.serviceWorker.register(SW_PATH);
      const token = await getToken(messaging, {
        vapidKey: VAPID_KEY,
        serviceWorkerRegistration: swReg,
      });
      if (!token) return;

      const cached = localStorage.getItem(TOKEN_CACHE_KEY);
      if (cached === token) {
        registeredRef.current = true;
        return;
      }

      await fetch('/api/notifications/push-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ token, platform: 'web' }),
      });

      localStorage.setItem(TOKEN_CACHE_KEY, token);
      registeredRef.current = true;
    } catch {
      // Non-fatal: push works without backend confirmation
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (!supported) return;
    const result = await Notification.requestPermission();
    setPermission(result as PushPermission);
    if (result === 'granted') {
      await registerToken();
    }
  }, [supported, registerToken]);

  // Auto-register if the user already granted permission in a previous session
  useEffect(() => {
    if (supported && Notification.permission === 'granted') {
      registerToken();
    }
  }, [supported, registerToken]);

  return { permission, supported, requestPermission };
}
