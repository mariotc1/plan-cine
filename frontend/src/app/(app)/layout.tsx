'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { BottomNav } from '@/components/shared/BottomNav';
import { InstallBanner } from '@/components/shared/InstallBanner';
import { NotificationBanner } from '@/components/shared/NotificationBanner';
import { PullToRefresh } from '@/components/shared/PullToRefresh';
import { usePushNotifications } from '@/hooks/usePushNotifications';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();
  usePushNotifications();

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/');
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Centered column — full width on mobile, 480px centered on desktop */}
      <div className="max-w-[480px] mx-auto min-h-screen bg-zinc-950 relative sm:shadow-[0_0_0_1px_rgba(255,255,255,0.06)]">
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
