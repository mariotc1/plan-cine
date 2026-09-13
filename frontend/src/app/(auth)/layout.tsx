'use client';

import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  // Register has a lot more form content (avatar + color pickers + 4 fields) —
  // a wider card lets its fields pair up side by side instead of one long column.
  const isWide = pathname === '/register';

  return (
    <div
      className="relative min-h-[100dvh] flex flex-col items-center px-5 overflow-y-auto lg:justify-center lg:px-6"
      style={{ paddingTop: 'max(env(safe-area-inset-top), 16px)', paddingBottom: '40px' }}
    >
      {/* Desktop-only ambient glow behind the card */}
      <div
        className="hidden lg:block fixed inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(560px circle at 50% 42%, rgba(99,102,241,0.14), transparent 70%)',
        }}
      />

      <div
        className={cn(
          'relative z-10 w-full max-w-sm my-auto py-4 lg:bg-zinc-900/50 lg:border lg:border-white/[0.07] lg:rounded-3xl lg:px-10 lg:py-12 lg:shadow-2xl lg:shadow-black/50',
          isWide && 'lg:max-w-2xl'
        )}
      >
        {children}
      </div>
    </div>
  );
}
