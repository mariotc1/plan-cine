'use client';

import { use } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowLeft, Copy } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useGroup } from '@/hooks/useGroups';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

const TABS = [
  { label: 'Películas', href: '' },
  { label: 'Rueda', href: '/spin' },
  { label: 'Sesiones', href: '/sessions' },
  { label: 'Stats', href: '/stats' },
];

interface Props {
  children: React.ReactNode;
  params: Promise<{ groupId: string }>;
}

export default function GroupLayout({ children, params }: Props) {
  const { groupId } = use(params);
  const { data: group } = useGroup(groupId);
  const pathname = usePathname();
  const router = useRouter();

  const copyCode = () => {
    if (group?.invitation_code) {
      navigator.clipboard.writeText(group.invitation_code);
      toast.success('Código copiado al portapapeles');
    }
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="px-5 pt-14 pb-0">
        <div className="flex items-center justify-between mb-1">
          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={() => router.push('/groups')}
            className="flex items-center justify-center w-9 h-9 rounded-full bg-zinc-800 text-zinc-300"
          >
            <ArrowLeft size={18} />
          </motion.button>
          {group && (
            <button
              onClick={copyCode}
              className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              <Copy size={12} />
              <span className="font-mono tracking-wide">{group.invitation_code}</span>
            </button>
          )}
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight mt-3">
          {group?.name || '...'}
        </h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 px-5 pt-4 pb-0 overflow-x-auto scrollbar-none">
        {TABS.map((tab) => {
          const href = `/groups/${groupId}${tab.href}`;
          const isActive = tab.href === ''
            ? pathname === `/groups/${groupId}`
            : pathname.startsWith(href);

          return (
            <Link
              key={tab.href}
              href={href}
              className={cn(
                'flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-colors whitespace-nowrap',
                isActive
                  ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                  : 'text-zinc-500 hover:text-zinc-300'
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      <div className="mt-4">{children}</div>
    </div>
  );
}
