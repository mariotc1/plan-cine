'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { BottomNav } from '@/components/shared/BottomNav';
import { InstallBanner } from '@/components/shared/InstallBanner';
import { NotificationBanner } from '@/components/shared/NotificationBanner';
import { PullToRefresh } from '@/components/shared/PullToRefresh';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { authApi } from '@/lib/api';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, logout } = useAuthStore();
  const router = useRouter();
  usePushNotifications();

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/');
    }
  }, [isAuthenticated, router]);

  // Validate token against the backend once on mount.
  // Covers the case where the token is persisted in Zustand but has expired
  // on the server — the 401 interceptor handles the redirect, but we also
  // clear the store here so the landing page doesn't loop back.
  useEffect(() => {
    if (!isAuthenticated) return;
    authApi.me().catch(() => {
      logout();
      router.replace('/login');
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen">
      {/* Centered column — full width on mobile, 480px centered on desktop */}
      <div className="max-w-[480px] mx-auto min-h-screen relative sm:shadow-[0_0_0_1px_rgba(255,255,255,0.06)]">
        <main className="pb-20">
          {children}
        </main>
        <BottomNav />
        <NotificationBanner />
        <InstallBanner />
        <PullToRefresh />
      </div>
    </div>
  );
}
