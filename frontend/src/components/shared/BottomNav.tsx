'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const navItems = [
  { href: '/groups', icon: Home, label: 'Grupos' },
  { href: '/profile', icon: User, label: 'Perfil' },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/8 bg-zinc-950/90 backdrop-blur-xl safe-area-bottom">
      <div className="flex items-center justify-around h-16 px-6">
        {navItems.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href || (href !== '/' && pathname.startsWith(href));
          return (
            <Link key={href} href={href} className="flex flex-col items-center gap-1 flex-1">
              <motion.div
                whileTap={{ scale: 0.85 }}
                className={cn(
                  'flex flex-col items-center gap-1 transition-colors',
                  isActive ? 'text-indigo-400' : 'text-zinc-500'
                )}
              >
                <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
                <span className="text-[10px] font-medium">{label}</span>
              </motion.div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
