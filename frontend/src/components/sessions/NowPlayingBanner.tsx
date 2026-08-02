'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { useActiveSession } from '@/hooks/useSessions';

interface Props {
  groupId: string;
}

function useRemainingLabel(estimatedEndAt?: string): string {
  const [label, setLabel] = useState('');

  useEffect(() => {
    if (!estimatedEndAt) { setLabel(''); return; }

    const compute = () => {
      const end = new Date(estimatedEndAt);
      const now = new Date();
      const diff = Math.round((end.getTime() - now.getTime()) / 60_000);

      if (diff <= 0) {
        setLabel('Terminando...');
      } else {
        const hh = String(end.getHours()).padStart(2, '0');
        const mm = String(end.getMinutes()).padStart(2, '0');
        setLabel(`${diff} min · termina a las ${hh}:${mm}`);
      }
    };

    compute();
    const id = setInterval(compute, 60_000);
    return () => clearInterval(id);
  }, [estimatedEndAt]);

  return label;
}

export function NowPlayingBanner({ groupId }: Props) {
  const router = useRouter();
  const session = useActiveSession(groupId);
  const label = useRemainingLabel(session?.estimated_end_at);

  return (
    <AnimatePresence>
      {session && (
        <motion.button
          key="now-playing"
          initial={{ opacity: 0, y: -12, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -12, scale: 0.97 }}
          transition={{ type: 'spring', stiffness: 440, damping: 38 }}
          onClick={() => router.push(`/groups/${groupId}/sessions/${session.id}`)}
          className="mx-4 mb-2 w-[calc(100%-2rem)] flex items-center gap-3 px-4 py-3 rounded-2xl bg-emerald-500/12 border border-emerald-500/25 active:bg-emerald-500/20 transition-colors text-left"
        >
          {/* Pulsing dot */}
          <span className="relative flex-shrink-0 w-2.5 h-2.5">
            <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-60" />
            <span className="relative block w-2.5 h-2.5 rounded-full bg-emerald-400" />
          </span>

          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-bold text-white leading-tight truncate">
              {session.movie?.title ?? 'Viendo ahora'}
            </p>
            {label && (
              <p className="text-[11px] text-emerald-400 mt-0.5 leading-none">{label}</p>
            )}
          </div>

          {/* Participants */}
          {session.participants.length > 0 && (
            <div className="flex -space-x-1.5 flex-shrink-0">
              {session.participants.slice(0, 3).map((p) => (
                <span
                  key={p.id}
                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs ring-2 ring-zinc-950"
                  style={{ backgroundColor: `${p.color}25` }}
                >
                  {p.avatar}
                </span>
              ))}
            </div>
          )}

          <ChevronRight size={14} className="text-emerald-500 flex-shrink-0" />
        </motion.button>
      )}
    </AnimatePresence>
  );
}
