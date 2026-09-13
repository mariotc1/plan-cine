'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { BottomNav } from '@/components/shared/BottomNav';
import { Sidebar } from '@/components/shared/Sidebar';
import { InstallBanner } from '@/components/shared/InstallBanner';
import { NotificationBanner } from '@/components/shared/NotificationBanner';
import { OfflineBanner } from '@/components/shared/OfflineBanner';
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
    <div className="min-h-screen lg:flex">
      <Sidebar />

      {/* Content column — 480px centered card on mobile/tablet, fills the remaining
          width next to the sidebar on desktop (capped only on very wide monitors so
          line lengths stay sane — never a fixed narrow box on a big screen) */}
      <div className="lg:flex-1 lg:min-w-0">
        <div className="max-w-[480px] mx-auto min-h-screen relative sm:shadow-[0_0_0_1px_rgba(255,255,255,0.06)] lg:max-w-none lg:shadow-none 2xl:max-w-[1800px]">
          <OfflineBanner />
          <main className="pb-20 lg:pb-12">
            {children}
          </main>
          <BottomNav />
          <NotificationBanner />
          <InstallBanner />
          <PullToRefresh />
        </div>
      </div>
    </div>
  );
}
