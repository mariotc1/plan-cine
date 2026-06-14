'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { BottomNav } from '@/components/shared/BottomNav';
import { InstallBanner } from '@/components/shared/InstallBanner';
import { NotificationBanner } from '@/components/shared/NotificationBanner';
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
      <main className="pb-20">
        {children}
      </main>
      <BottomNav />
      <NotificationBanner />
      <InstallBanner />
    </div>
  );
}
