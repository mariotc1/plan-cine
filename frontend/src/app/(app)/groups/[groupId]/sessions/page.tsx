'use client';

import { use } from 'react';
import { motion } from 'framer-motion';
import { Clapperboard } from 'lucide-react';
import { useSessions } from '@/hooks/useSessions';
import { useGroupMemories } from '@/hooks/useGroups';
import { SessionCard } from '@/components/sessions/SessionCard';
import { EmptyState } from '@/components/shared/EmptyState';
import { SessionCardSkeleton } from '@/components/sessions/SessionCardSkeleton';
import { RatingStars } from '@/components/sessions/RatingStars';
import { getPlatform } from '@/lib/constants';
import { formatDate } from '@/lib/utils';
import { staggerContainer, staggerItem } from '@/lib/animations';
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
  const { data: memories } = useGroupMemories(groupId);

  const scheduled = sessions?.filter((s) => s.status === 'scheduled').sort((a, b) =>
    new Date(a.scheduled_at!).getTime() - new Date(b.scheduled_at!).getTime()
  ) ?? [];
  const inProgress = sessions?.filter((s) => s.status === 'in_progress') ?? [];
  const finished = sessions?.filter((s) => s.status === 'finished') ?? [];
  const groups = groupFinished(finished);

  if (isLoading) {
    return (
      <div className="px-5 space-y-3 pt-2">
        {[1, 2, 3].map((i) => <SessionCardSkeleton key={i} />)}
      </div>
    );
  }

  if (!scheduled.length && !inProgress.length && !finished.length) {
    return (
      <EmptyState
        icon={<Clapperboard size={30} />}
        title="Todavía no habéis visto nada juntos"
        description="Elegid una película de la lista, pulsad «Ver ahora» y empezad vuestra primera sesión de cine."
      />
    );
  }

  return (
    <div className="pb-8">
      {/* Programadas */}
      {scheduled.length > 0 && (
        <div className="px-5 pt-2 pb-5">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-amber-400 mb-3">
            Próximas
          </h2>
          <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-3">
            {scheduled.map((s) => (
              <SessionCard key={s.id} session={s} groupId={groupId} />
            ))}
          </motion.div>
        </div>
      )}

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
          <div className="sticky top-0 z-10 bg-transparent px-5 py-2.5 border-b border-white/[0.04]">
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

      {/* Recuerdos */}
      {memories && memories.length > 0 && (
        <div className="px-5 pb-8">
          <div className="flex items-baseline gap-2 py-2.5 mb-3 border-t border-white/[0.04]">
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">Recuerdos</span>
            <span className="text-xs text-zinc-600">· Tal día como hoy</span>
          </div>
          <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-3">
            {memories.map((memory, i) => {
              const platform = getPlatform(memory.movie.platform);
              return (
                <motion.div
                  key={i}
                  variants={staggerItem}
                  className="bg-zinc-900 rounded-2xl border border-white/[0.06] overflow-hidden"
                >
                  <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 px-4 py-2.5 border-b border-white/[0.04] flex items-center gap-2">
                    <span className="text-sm">📸</span>
                    <p className="text-[11px] font-semibold text-indigo-400">
                      Hace {memory.years_ago} {memory.years_ago === 1 ? 'año' : 'años'} · {formatDate(memory.date)}
                    </p>
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-white text-[15px] mb-1 leading-tight">{memory.movie.title}</h3>
                    <div className="flex items-center gap-2 text-[11px] text-zinc-500 mb-3">
                      <span>{memory.movie.duration_formatted}</span>
                      {platform && (
                        <>
                          <span>·</span>
                          <span style={{ color: platform.color }}>{platform.emoji} {platform.label}</span>
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 mb-3">
                      {memory.participants.map((p) => (
                        <span
                          key={p.id}
                          className="w-6 h-6 rounded-lg flex items-center justify-center text-xs"
                          style={{ backgroundColor: `${p.color}20` }}
                          title={p.name}
                        >
                          {p.avatar}
                        </span>
                      ))}
                    </div>
                    {memory.ratings.length > 0 && (
                      <div className="space-y-1.5 pt-2.5 border-t border-white/[0.05]">
                        {memory.ratings.map((rating) => (
                          <div key={rating.id} className="flex items-center justify-between">
                            <span className="text-[11px] text-zinc-400">{rating.user.name}</span>
                            <RatingStars value={rating.score} readonly size={12} />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      )}
    </div>
  );
}
