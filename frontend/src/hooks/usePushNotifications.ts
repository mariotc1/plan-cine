'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { pushApi } from '@/lib/api';

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const arr = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) arr[i] = rawData.charCodeAt(i);
  return arr.buffer;
}

async function syncSubscriptionToBackend(sub: PushSubscription): Promise<void> {
  const json = sub.toJSON();
  const keys = json.keys ?? {};
  if (!keys.p256dh || !keys.auth) return;
  try {
    await pushApi.subscribe({ endpoint: json.endpoint!, p256dh: keys.p256dh, auth: keys.auth });
  } catch {
    // Will retry on next mount
  }
}

export async function subscribeToPush(): Promise<boolean> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return false;
  const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!vapidKey) return false;
  try {
    const reg = await navigator.serviceWorker.ready;
    const existing = await reg.pushManager.getSubscription();
    if (existing) {
      await syncSubscriptionToBackend(existing);
      return true;
    }
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidKey),
    });
    await syncSubscriptionToBackend(sub);
    return true;
  } catch {
    return false;
  }
}

export function usePushNotifications() {
  const { isAuthenticated } = useAuthStore();
  useEffect(() => {
    if (!isAuthenticated) return;
    if (typeof window === 'undefined') return;
    if (!('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;
    subscribeToPush();
  }, [isAuthenticated]);
}

export async function requestPushPermission(): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) return false;
  if (Notification.permission === 'denied') return false;
  if (Notification.permission === 'granted') return subscribeToPush();
  const result = await Notification.requestPermission();
  if (result !== 'granted') return false;
  return subscribeToPush();
}

export function isPushSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'Notification' in window &&
    'serviceWorker' in navigator &&
    'PushManager' in window
  );
}
