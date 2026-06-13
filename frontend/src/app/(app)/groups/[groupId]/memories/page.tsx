'use client';

import { use } from 'react';
import { motion } from 'framer-motion';
import { useGroupMemories } from '@/hooks/useGroups';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { EmptyState } from '@/components/shared/EmptyState';
import { RatingStars } from '@/components/sessions/RatingStars';
import { getPlatform } from '@/lib/constants';
import { formatDate } from '@/lib/utils';
import { staggerContainer, staggerItem } from '@/lib/animations';

interface Props {
  params: Promise<{ groupId: string }>;
}

export default function MemoriesPage({ params }: Props) {
  const { groupId } = use(params);
  const { data: memories, isLoading } = useGroupMemories(groupId);

  if (isLoading) return <LoadingSpinner />;
  if (!memories?.length) {
    return (
      <EmptyState
        emoji="📸"
        title="Sin recuerdos todavía"
        description="Aquí aparecerán las películas que visteis hace exactamente un año"
      />
    );
  }

  return (
    <div className="px-5 pb-8">
      <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-4">
        {memories.map((memory, i) => {
          const platform = getPlatform(memory.movie.platform);
          return (
            <motion.div
              key={i}
              variants={staggerItem}
              className="bg-zinc-900 rounded-2xl border border-white/5 overflow-hidden"
            >
              {/* Memory header */}
              <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 px-5 py-3 border-b border-white/5">
                <p className="text-xs font-medium text-indigo-400">
                  📸 Hace {memory.years_ago} {memory.years_ago === 1 ? 'año' : 'años'}
                </p>
                <p className="text-xs text-zinc-500 mt-0.5">{formatDate(memory.date)}</p>
              </div>

              <div className="p-5">
                <h3 className="font-semibold text-white text-lg mb-1">{memory.movie.title}</h3>
                <div className="flex items-center gap-2 text-sm text-zinc-500 mb-4">
                  <span>{memory.movie.duration_formatted}</span>
                  {platform && (
                    <>
                      <span>·</span>
                      <span style={{ color: platform.color }}>{platform.emoji} {platform.label}</span>
                    </>
                  )}
                </div>

                {/* Participants */}
                <div className="flex items-center gap-2 mb-4">
                  {memory.participants.map((p) => (
                    <span
                      key={p.id}
                      className="w-7 h-7 rounded-full flex items-center justify-center text-sm"
                      style={{ backgroundColor: `${p.color}25` }}
                      title={p.name}
                    >
                      {p.avatar}
                    </span>
                  ))}
                </div>

                {/* Ratings */}
                {memory.ratings.length > 0 && (
                  <div className="space-y-2">
                    {memory.ratings.map((rating) => (
                      <div key={rating.id} className="flex items-center justify-between">
                        <span className="text-sm text-zinc-400">{rating.user.name}</span>
                        <RatingStars value={rating.score} readonly size={14} />
                      </div>
                    ))}
                    {memory.average_rating && (
                      <div className="flex items-center gap-2 pt-2 border-t border-zinc-800">
                        <span className="text-xs text-zinc-500">Media</span>
                        <span className="text-sm font-semibold text-white">{memory.average_rating} ★</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}
