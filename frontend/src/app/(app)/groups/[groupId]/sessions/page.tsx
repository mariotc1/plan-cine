'use client';

import { use } from 'react';
import { motion } from 'framer-motion';
import { useSessions } from '@/hooks/useSessions';
import { SessionCard } from '@/components/sessions/SessionCard';
import { EmptyState } from '@/components/shared/EmptyState';
import { SkeletonCard } from '@/components/shared/LoadingSpinner';
import { staggerContainer } from '@/lib/animations';
import { CinemaSession } from '@/types';

interface Props {
  params: Promise<{ groupId: string }>;
}

function getGroupKey(session: CinemaSession): string {
  const dateStr = session.actual_end_at || session.started_at || session.created_at;
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24);

  if (diffDays < 7) return '__week__';

  const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  if (month === thisMonth) return '__month__';
  return month;
}

function getGroupLabel(key: string, first: CinemaSession): string {
  if (key === '__week__') return 'Esta semana';
  if (key === '__month__') return 'Este mes';
  const dateStr = first.actual_end_at || first.started_at || first.created_at;
  return new Date(dateStr).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
}

function groupFinished(sessions: CinemaSession[]) {
  const map = new Map<string, CinemaSession[]>();
  for (const s of sessions) {
    const key = getGroupKey(s);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(s);
  }
  return Array.from(map.entries()).map(([key, items]) => ({
    key,
    label: getGroupLabel(key, items[0]),
    items,
  }));
}

export default function SessionsPage({ params }: Props) {
  const { groupId } = use(params);
  const { data: sessions, isLoading } = useSessions(groupId);

  const inProgress = sessions?.filter((s) => s.status === 'in_progress') ?? [];
  const finished = sessions?.filter((s) => s.status === 'finished') ?? [];
  const groups = groupFinished(finished);

  if (isLoading) {
    return (
      <div className="px-5 space-y-3 pt-2">
        {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
      </div>
    );
  }

  if (!inProgress.length && !finished.length) {
    return (
      <EmptyState
        emoji="🎭"
        title="Sin sesiones todavía"
        description="Usa la ruleta para elegir una película y empezar vuestra primera sesión"
      />
    );
  }

  return (
    <div className="pb-8">
      {/* Viendo ahora */}
      {inProgress.length > 0 && (
        <div className="px-5 pt-2 pb-5">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-emerald-400 mb-3">
            Viendo ahora
          </h2>
          <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-3">
            {inProgress.map((s) => (
              <SessionCard key={s.id} session={s} groupId={groupId} />
            ))}
          </motion.div>
        </div>
      )}

      {/* Historial agrupado por mes */}
      {groups.map(({ key, label, items }) => (
        <div key={key}>
          <div className="sticky top-0 z-10 bg-zinc-950 px-5 py-2.5 border-b border-white/[0.04]">
            <div className="flex items-baseline gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 capitalize">
                {label}
              </span>
              <span className="text-xs text-zinc-600">
                · {items.length} {items.length === 1 ? 'película' : 'películas'}
              </span>
            </div>
          </div>
          <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="px-5 pt-3 pb-5 space-y-3"
          >
            {items.map((s) => (
              <SessionCard key={s.id} session={s} groupId={groupId} hideStatus />
            ))}
          </motion.div>
        </div>
      ))}
    </div>
  );
}
