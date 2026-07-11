'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const navItems = [
  { href: '/groups', icon: Home },
  { href: '/profile', icon: User },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50">
      <div className="max-w-[480px] mx-auto">
        {/* Top edge glow */}
        <div className="h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />

        <div className="flex items-center justify-around bg-zinc-950/95 backdrop-blur-2xl px-8 pt-3 pb-[max(env(safe-area-inset-bottom),14px)]">
          {navItems.map(({ href, icon: Icon }) => {
            const isActive = pathname === href || (href !== '/' && pathname.startsWith(href));

            return (
              <Link key={href} href={href} className="flex-1 flex justify-center">
                <motion.div
                  whileTap={{ scale: 0.86 }}
                  className="flex items-center justify-center p-3"
                >
                  <Icon
                    size={24}
                    strokeWidth={isActive ? 2.2 : 1.6}
                    className={cn(
                      'transition-colors duration-200',
                      isActive ? 'text-indigo-400' : 'text-zinc-600'
                    )}
                  />
                </motion.div>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
