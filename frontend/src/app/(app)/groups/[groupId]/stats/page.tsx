'use client';

import React, { use } from 'react';
import { motion } from 'framer-motion';
import { useGroupStats } from '@/hooks/useGroups';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { EmptyState } from '@/components/shared/EmptyState';
import { RatingStars } from '@/components/sessions/RatingStars';
import { getPlatform, getGenre } from '@/lib/constants';
import { PlatformLogo } from '@/components/ui/PlatformLogo';
import { staggerContainer, staggerItem } from '@/lib/animations';

interface Props {
  params: Promise<{ groupId: string }>;
}

export default function StatsPage({ params }: Props) {
  const { groupId } = use(params);
  const { data: stats, isLoading } = useGroupStats(groupId);

  if (isLoading) return <LoadingSpinner />;
  if (!stats || stats.total_watched === 0) {
    return (
      <EmptyState
        emoji="📊"
        title="Sin estadísticas todavía"
        description="Completad vuestra primera sesión de cine para ver estadísticas"
      />
    );
  }

  const platform = stats.favorite_platform ? getPlatform(stats.favorite_platform) : null;
  const genre = stats.favorite_genre ? getGenre(stats.favorite_genre) : null;
  const top = (stats.top_10 ?? []).slice(0, 10);

  return (
    <div className="px-5 pb-8">
      <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-3">

        {/* Overview */}
        <motion.div variants={staggerItem} className="grid grid-cols-2 gap-3">
          <StatCard emoji="🎬" label="películas vistas" value={String(stats.total_watched)} />
          <StatCard emoji="⏱" label="horas de cine" value={`${stats.total_hours}h`} />
        </motion.div>

        {/* Favoritos */}
        <motion.div variants={staggerItem} className="grid grid-cols-2 gap-3">
          <StatCard
            logo={platform ? <PlatformLogo platform={stats.favorite_platform!} size={22} color={platform.color} /> : undefined}
            emoji="📺"
            label="plataforma favorita"
            value={platform?.label ?? '—'}
          />
          <StatCard
            emoji={genre?.emoji ?? '🎭'}
            label="género favorito"
            value={genre?.label ?? '—'}
          />
        </motion.div>

        {/* Protagonistas */}
        {(stats.most_proposer || stats.most_demanding || stats.most_generous) && (
          <motion.div variants={staggerItem} className="bg-zinc-900 rounded-2xl border border-white/5 overflow-hidden">
            <div className="px-5 pt-4 pb-1">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Protagonistas</h3>
            </div>
            <div className="divide-y divide-white/[0.04]">
              {stats.most_proposer && (
                <ProtagonistRow
                  role="Quien más propone"
                  emoji="💡"
                  user={stats.most_proposer.user}
                  value={`${stats.most_proposer.count} pelis`}
                />
              )}
              {stats.most_generous && (
                <ProtagonistRow
                  role="Más generoso"
                  emoji="😊"
                  user={stats.most_generous.user}
                  value={`★ ${stats.most_generous.avg_score}`}
                />
              )}
              {stats.most_demanding && (
                <ProtagonistRow
                  role="Más exigente"
                  emoji="😤"
                  user={stats.most_demanding.user}
                  value={`★ ${stats.most_demanding.avg_score}`}
                />
              )}
            </div>
          </motion.div>
        )}

        {/* Top películas */}
        {top.length > 0 && (
          <motion.div variants={staggerItem} className="bg-zinc-900 rounded-2xl border border-white/5 overflow-hidden">
            <div className="px-5 pt-4 pb-1">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Top {top.length} películas
              </h3>
            </div>
            <div className="divide-y divide-white/[0.04]">
              {top.map((item, i) => (
                <div key={item.movie.id} className="flex items-center gap-3 px-5 py-3">
                  <span className={`text-sm font-bold w-6 flex-shrink-0 tabular-nums ${
                    i === 0 ? 'text-amber-400' : i === 1 ? 'text-zinc-400' : i === 2 ? 'text-orange-700' : 'text-zinc-700'
                  }`}>
                    {i + 1}
                  </span>
                  <p className="flex-1 text-sm text-white truncate">{item.movie.title}</p>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <RatingStars value={Math.round(item.avg_rating)} readonly size={12} />
                    <span className="text-xs text-zinc-500 tabular-nums">{item.avg_rating}</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

      </motion.div>
    </div>
  );
}

function StatCard({ emoji, label, value, logo }: { emoji: string; label: string; value: string; logo?: React.ReactNode }) {
  return (
    <div className="bg-zinc-900 rounded-2xl border border-white/5 p-4 flex flex-col items-center text-center">
      <p className="text-2xl font-bold text-white tracking-tight leading-none flex items-center gap-1.5">
        {logo ?? <span className="text-xl">{emoji}</span>}
        <span>{value}</span>
      </p>
      <p className="text-xs text-zinc-500 mt-2">{label}</p>
    </div>
  );
}

function ProtagonistRow({
  role,
  emoji,
  user,
  value,
}: {
  role: string;
  emoji: string;
  user: { name: string; avatar: string; color: string };
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 px-5 py-3">
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
        style={{ backgroundColor: `${user.color}22` }}
      >
        {user.avatar}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white text-sm font-medium truncate">{user.name}</p>
        <p className="text-zinc-600 text-xs">{emoji} {role}</p>
      </div>
      <span className="text-sm font-semibold text-zinc-400 flex-shrink-0">{value}</span>
    </div>
  );
}
