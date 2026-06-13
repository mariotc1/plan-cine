'use client';

import { use } from 'react';
import { motion } from 'framer-motion';
import { useGroupStats } from '@/hooks/useGroups';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { EmptyState } from '@/components/shared/EmptyState';
import { RatingStars } from '@/components/sessions/RatingStars';
import { getPlatform, getGenre } from '@/lib/constants';
import { fadeInUp, staggerContainer, staggerItem } from '@/lib/animations';

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

  return (
    <div className="px-5 pb-8">
      <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-4">
        {/* Overview */}
        <motion.div variants={staggerItem} className="grid grid-cols-2 gap-3">
          <StatCard emoji="🎬" label="Películas vistas" value={String(stats.total_watched)} />
          <StatCard emoji="⏱" label="Horas de cine" value={`${stats.total_hours}h`} />
        </motion.div>

        {/* Favorites */}
        <motion.div variants={staggerItem} className="grid grid-cols-2 gap-3">
          <StatCard
            emoji={platform?.emoji ?? '📺'}
            label="Plataforma favorita"
            value={platform?.label ?? 'N/A'}
          />
          <StatCard
            emoji={genre?.emoji ?? '🎭'}
            label="Género favorito"
            value={genre?.label ?? 'N/A'}
          />
        </motion.div>

        {/* People */}
        {(stats.most_proposer || stats.most_demanding || stats.most_generous) && (
          <motion.div variants={staggerItem} className="bg-zinc-900 rounded-2xl border border-white/5 p-5 space-y-4">
            <h3 className="text-sm font-medium text-zinc-400">Protagonistas</h3>
            {stats.most_proposer && (
              <PersonStat
                label="💡 Quien más propone"
                user={stats.most_proposer.user}
                value={`${stats.most_proposer.count} películas`}
              />
            )}
            {stats.most_generous && (
              <PersonStat
                label="😊 Más generoso"
                user={stats.most_generous.user}
                value={`${stats.most_generous.avg_score}★`}
              />
            )}
            {stats.most_demanding && (
              <PersonStat
                label="😤 Más exigente"
                user={stats.most_demanding.user}
                value={`${stats.most_demanding.avg_score}★`}
              />
            )}
          </motion.div>
        )}

        {/* Best rated */}
        {stats.best_rated_movie && (
          <motion.div variants={staggerItem} className="bg-zinc-900 rounded-2xl border border-white/5 p-5">
            <h3 className="text-sm font-medium text-zinc-400 mb-3">🏆 Mejor valorada</h3>
            <p className="font-semibold text-white text-lg">{stats.best_rated_movie.title}</p>
            <p className="text-sm text-zinc-500 mt-1">{stats.best_rated_movie.duration_formatted}</p>
          </motion.div>
        )}

        {/* Top 10 */}
        {stats.top_10.length > 0 && (
          <motion.div variants={staggerItem} className="bg-zinc-900 rounded-2xl border border-white/5 p-5">
            <h3 className="text-sm font-medium text-zinc-400 mb-4">Top películas</h3>
            <div className="space-y-3">
              {stats.top_10.map((item, i) => (
                <div key={item.movie.id} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-zinc-600 text-sm font-mono w-5 flex-shrink-0">{i + 1}</span>
                    <p className="text-sm text-white truncate">{item.movie.title}</p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <RatingStars value={Math.round(item.avg_rating)} readonly size={13} />
                    <span className="text-xs text-zinc-400">{item.avg_rating}</span>
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

function StatCard({ emoji, label, value }: { emoji: string; label: string; value: string }) {
  return (
    <div className="bg-zinc-900 rounded-2xl border border-white/5 p-4">
      <div className="text-2xl mb-2">{emoji}</div>
      <p className="text-lg font-bold text-white">{value}</p>
      <p className="text-xs text-zinc-500 mt-0.5">{label}</p>
    </div>
  );
}

function PersonStat({
  label,
  user,
  value,
}: {
  label: string;
  user: { name: string; avatar: string; color: string };
  value: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <span
          className="w-8 h-8 rounded-full flex items-center justify-center"
          style={{ backgroundColor: `${user.color}25` }}
        >
          {user.avatar}
        </span>
        <div>
          <p className="text-xs text-zinc-500">{label}</p>
          <p className="text-sm font-medium text-white">{user.name}</p>
        </div>
      </div>
      <span className="text-sm text-zinc-400">{value}</span>
    </div>
  );
}
