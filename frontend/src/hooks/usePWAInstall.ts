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

    // Always register (and re-check for updates on) the service worker, regardless
    // of install/dismissed state — this used to be gated behind the early returns
    // below, which meant it stopped running the moment the PWA was installed or the
    // banner dismissed, exactly when a stale SW mattered most. A stuck old SW then
    // served an old cached shell forever, with no way to notice a new deploy.
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').then((reg) => {
        reg.update().catch(() => {});
      }).catch(() => {});

      // If a new SW takes control mid-session, reload once to pick up the fresh
      // build instead of leaving the tab running on stale JS indefinitely.
      let reloaded = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (reloaded) return;
        reloaded = true;
        window.location.reload();
      });
    }

    if (isStandalone()) {
      setIsInstalled(true);
      return;
    }

    if (localStorage.getItem(DISMISSED_KEY) === 'true') return;

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
