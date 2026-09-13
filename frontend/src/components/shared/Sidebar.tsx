'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Home, User, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { useGroups } from '@/hooks/useGroups';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/groups', label: 'Grupos', icon: Home },
  { href: '/profile', label: 'Perfil', icon: User },
];

const STORAGE_KEY = 'plan-cine-sidebar-collapsed';
// Below this, default to collapsed (icon rail) so a halved laptop window still
// shows the desktop grid instead of a cramped one squeezed next to a full sidebar.
// A user's own toggle always overrides this default, remembered in localStorage.
const AUTO_COLLAPSE_QUERY = '(min-width: 1024px)';

export function Sidebar() {
  const pathname = usePathname();
  const { data: groups } = useGroups();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(AUTO_COLLAPSE_QUERY);
    const applyAuto = () => {
      if (localStorage.getItem(STORAGE_KEY) === null) {
        setCollapsed(!mq.matches);
      }
    };
    applyAuto();
    mq.addEventListener('change', applyAuto);
    return () => mq.removeEventListener('change', applyAuto);
  }, []);

  const toggle = () => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEY, next ? '1' : '0');
      return next;
    });
  };

  return (
    <aside
      className={cn(
        'hidden lg:flex lg:flex-col flex-shrink-0 h-screen sticky top-0 border-r border-white/[0.06] bg-zinc-950 transition-[width] duration-200 ease-out overflow-hidden',
        collapsed ? 'w-[76px]' : 'w-[272px]'
      )}
    >
      {/* Brand + collapse toggle */}
      <div
        className={cn(
          'flex items-center flex-shrink-0 pt-6 pb-5',
          collapsed ? 'justify-center px-0' : 'justify-between px-6'
        )}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <Image src="/logo.png" alt="Plan Cine" width={28} height={28} className="rounded-lg flex-shrink-0" />
          {!collapsed && (
            <span className="text-white font-bold text-[15px] tracking-tight truncate">Plan Cine</span>
          )}
        </div>
        {!collapsed && (
          <button
            onClick={toggle}
            aria-label="Colapsar barra lateral"
            className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-600 hover:text-zinc-300 hover:bg-white/[0.06] transition-colors flex-shrink-0"
          >
            <ChevronsLeft size={15} />
          </button>
        )}
      </div>

      {collapsed && (
        <div className="flex justify-center pb-3 flex-shrink-0">
          <button
            onClick={toggle}
            aria-label="Expandir barra lateral"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-600 hover:text-zinc-300 hover:bg-white/[0.06] transition-colors"
          >
            <ChevronsRight size={15} />
          </button>
        </div>
      )}

      {/* Primary nav */}
      <nav className={cn('space-y-0.5 flex-shrink-0', collapsed ? 'px-2' : 'px-3')}>
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              title={collapsed ? label : undefined}
              className={cn(
                'relative flex items-center gap-3 py-2 rounded-xl text-sm',
                collapsed ? 'justify-center px-0' : 'px-3'
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute inset-0 bg-white/[0.07] rounded-xl"
                  transition={{ type: 'spring', stiffness: 420, damping: 36 }}
                />
              )}
              <Icon
                size={17}
                strokeWidth={isActive ? 2.2 : 1.7}
                className={cn('relative z-10 flex-shrink-0', isActive ? 'text-white' : 'text-zinc-500')}
              />
              {!collapsed && (
                <span className={cn('relative z-10 font-medium truncate', isActive ? 'text-white' : 'text-zinc-500')}>
                  {label}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Quick group switcher */}
      <div className={cn('mt-6 flex-1 overflow-y-auto scrollbar-none pb-6', collapsed ? 'px-2' : 'px-3')}>
        {!collapsed && (
          <p className="px-3 text-[10px] font-semibold uppercase tracking-wider text-zinc-600 mb-2">
            Tus grupos
          </p>
        )}
        <div className="space-y-0.5">
          {groups?.map((group) => {
            const isActive = pathname.startsWith(`/groups/${group.id}`);
            return (
              <Link
                key={group.id}
                href={`/groups/${group.id}`}
                title={collapsed ? group.name : undefined}
                className={cn(
                  'relative flex items-center gap-2.5 py-2 rounded-xl text-sm',
                  collapsed ? 'justify-center px-0' : 'px-3'
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active-group"
                    className="absolute inset-0 bg-indigo-500/15 border border-indigo-500/25 rounded-xl"
                    transition={{ type: 'spring', stiffness: 420, damping: 36 }}
                  />
                )}
                <span className="relative z-10 text-base leading-none flex-shrink-0">
                  {group.avatar || '🎬'}
                </span>
                {!collapsed && (
                  <span
                    className={cn(
                      'relative z-10 truncate font-medium',
                      isActive ? 'text-white' : 'text-zinc-500'
                    )}
                  >
                    {group.name}
                  </span>
                )}
              </Link>
            );
          })}
          {!collapsed && !groups?.length && (
            <p className="px-3 text-xs text-zinc-700 leading-relaxed">Aún no tienes grupos</p>
          )}
        </div>
      </div>
    </aside>
  );
}
