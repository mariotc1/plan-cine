'use client';

import { useState, useEffect, useCallback } from 'react';

type Platform = 'android' | 'ios' | 'other';

interface PWAInstallState {
  canInstall: boolean;
  isInstalled: boolean;
  platform: Platform;
  install: () => Promise<void>;
  dismiss: () => void;
}

const DISMISSED_KEY = 'pwa-install-dismissed';

function detectPlatform(): Platform {
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua) && !(ua as unknown as { MSStream?: unknown }).MSStream) return 'ios';
  if (/android/i.test(ua)) return 'android';
  return 'other';
}

function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    ('standalone' in navigator && (navigator as { standalone?: boolean }).standalone === true)
  );
}

export function usePWAInstall(): PWAInstallState {
  const [deferredPrompt, setDeferredPrompt] = useState<Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> } | null>(null);
  const [canInstall, setCanInstall] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [platform, setPlatform] = useState<Platform>('other');

  useEffect(() => {
    setPlatform(detectPlatform());

    if (isStandalone()) {
      setIsInstalled(true);
      return;
    }

    if (localStorage.getItem(DISMISSED_KEY) === 'true') return;

    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }

    // Android: capture install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> });
      setCanInstall(true);
    };
    window.addEventListener('beforeinstallprompt', handler);

    // Detect installed via event
    const installedHandler = () => {
      setIsInstalled(true);
      setCanInstall(false);
      setDeferredPrompt(null);
    };
    window.addEventListener('appinstalled', installedHandler);

    // iOS: show instructions banner if not installed
    const detectedPlatform = detectPlatform();
    if (detectedPlatform === 'ios') {
      setCanInstall(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', installedHandler);
    };
  }, []);

  const install = useCallback(async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
        setCanInstall(false);
        setDeferredPrompt(null);
      }
    }
  }, [deferredPrompt]);

  const dismiss = useCallback(() => {
    localStorage.setItem(DISMISSED_KEY, 'true');
    setCanInstall(false);
  }, []);

  return { canInstall, isInstalled, platform, install, dismiss };
}
