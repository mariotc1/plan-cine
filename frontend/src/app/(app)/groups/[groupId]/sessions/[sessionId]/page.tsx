'use client';

import { use, useState } from 'react';
import { motion } from 'framer-motion';
import { useSession, useFinishSession, useCancelSession, useReturnToPending, useRateSession } from '@/hooks/useSessions';
import { useAuthStore } from '@/stores/authStore';
import { RatingStars } from '@/components/sessions/RatingStars';
import { PageHeader } from '@/components/shared/PageHeader';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { getPlatform } from '@/lib/constants';
import { formatDate, formatTime } from '@/lib/utils';
import { Clock, Users, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { fadeInUp, staggerContainer, staggerItem } from '@/lib/animations';
import { cn } from '@/lib/utils';

interface Props {
  params: Promise<{ groupId: string; sessionId: string }>;
}

export default function SessionDetailPage({ params }: Props) {
  const { groupId, sessionId } = use(params);
  const { data: session, isLoading, refetch } = useSession(groupId, sessionId);
  const { user } = useAuthStore();
  const finishSession = useFinishSession(groupId);
  const cancelSession = useCancelSession(groupId);
  const returnToPending = useReturnToPending(groupId);
  const rateSession = useRateSession();

  const [selectedScore, setSelectedScore] = useState(0);
  const [submittingRating, setSubmittingRating] = useState(false);

  if (isLoading || !session) return <LoadingSpinner />;

  const platform = session.movie ? getPlatform(session.movie.platform) : null;
  const userParticipated = session.participants.some((p) => p.id === user?.id);
  const userRating = session.ratings.find((r) => r.user.id === user?.id);
  const canRate = session.status === 'finished' && userParticipated && !userRating;

  const handleRate = async () => {
    if (!selectedScore) return;
    setSubmittingRating(true);
    try {
      await rateSession.mutateAsync({ sessionId, score: selectedScore });
      await refetch();
    } finally {
      setSubmittingRating(false);
    }
  };

  const STATUS_CONFIG = {
    pending: { label: 'Pendiente', color: 'text-zinc-400 bg-zinc-800' },
    in_progress: { label: '🍿 En curso', color: 'text-emerald-400 bg-emerald-500/15' },
    finished: { label: '✅ Vista', color: 'text-indigo-400 bg-indigo-500/15' },
    cancelled: { label: 'Cancelada', color: 'text-red-400 bg-red-500/15' },
  };

  const statusConfig = STATUS_CONFIG[session.status];

  return (
    <div>
      <PageHeader title={session.movie?.title || 'Sesión'} back />

      <div className="px-5 pb-8 space-y-4">
        {/* Status + movie info */}
        <motion.div {...fadeInUp} className="bg-zinc-900 rounded-2xl border border-white/5 p-5">
          <div className="flex items-start justify-between mb-4">
            <span className={cn('text-xs font-medium px-2.5 py-1 rounded-full', statusConfig.color)}>
              {statusConfig.label}
            </span>
            {session.average_rating && (
              <div className="flex items-center gap-1">
                <RatingStars value={Math.round(session.average_rating)} readonly size={16} />
                <span className="text-sm text-zinc-400 font-medium">{session.average_rating}</span>
              </div>
            )}
          </div>

          {session.movie && (
            <>
              <h2 className="text-xl font-bold text-white mb-2">{session.movie.title}</h2>
              <div className="flex items-center gap-3 flex-wrap text-sm text-zinc-400">
                <span className="flex items-center gap-1">
                  <Clock size={13} /> {session.movie.duration_formatted}
                </span>
                {platform && (
                  <span style={{ color: platform.color }}>
                    {platform.emoji} {platform.label}
                  </span>
                )}
              </div>
            </>
          )}

          {/* Times */}
          <div className="mt-4 space-y-2 text-sm">
            {session.started_at && (
              <div className="flex items-center gap-2 text-zinc-400">
                <Calendar size={13} />
                <span>{formatDate(session.started_at)} a las {formatTime(session.started_at)}</span>
              </div>
            )}
            {session.estimated_end_at && (
              <div className="flex items-center gap-2 text-zinc-500">
                <Clock size={13} />
                <span>Fin estimado: {formatTime(session.estimated_end_at)}</span>
              </div>
            )}
          </div>
        </motion.div>

        {/* Participants */}
        <motion.div {...fadeInUp} className="bg-zinc-900 rounded-2xl border border-white/5 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Users size={16} className="text-zinc-500" />
            <h3 className="text-sm font-medium text-zinc-300">Participantes</h3>
          </div>
          <motion.div variants={staggerContainer} initial="initial" animate="animate" className="flex flex-wrap gap-3">
            {session.participants.map((p) => (
              <motion.div key={p.id} variants={staggerItem} className="flex items-center gap-2">
                <span
                  className="w-8 h-8 rounded-full flex items-center justify-center text-base"
                  style={{ backgroundColor: `${p.color}25` }}
                >
                  {p.avatar}
                </span>
                <span className="text-sm text-zinc-300">{p.name}</span>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        {/* Ratings */}
        {session.ratings.length > 0 && (
          <motion.div {...fadeInUp} className="bg-zinc-900 rounded-2xl border border-white/5 p-5">
            <h3 className="text-sm font-medium text-zinc-300 mb-4">Valoraciones</h3>
            <div className="space-y-3">
              {session.ratings.map((rating) => (
                <div key={rating.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-7 h-7 rounded-full flex items-center justify-center text-sm"
                      style={{ backgroundColor: `${rating.user.color}25` }}
                    >
                      {rating.user.avatar}
                    </span>
                    <span className="text-sm text-zinc-300">{rating.user.name}</span>
                  </div>
                  <RatingStars value={rating.score} readonly size={16} />
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Rate if not rated */}
        {canRate && (
          <motion.div {...fadeInUp} className="bg-zinc-900 rounded-2xl border border-indigo-500/20 p-5">
            <p className="text-sm font-medium text-zinc-300 mb-4">¿Qué te ha parecido?</p>
            <div className="flex justify-center mb-5">
              <RatingStars value={selectedScore} onChange={setSelectedScore} size={36} />
            </div>
            <Button
              onClick={handleRate}
              disabled={!selectedScore || submittingRating}
              className="w-full h-12 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-semibold"
            >
              {submittingRating ? 'Guardando...' : 'Valorar'}
            </Button>
          </motion.div>
        )}

        {/* Actions */}
        {session.status === 'in_progress' && (
          <div className="space-y-3">
            <Button
              onClick={() => finishSession.mutateAsync(sessionId)}
              disabled={finishSession.isPending}
              className="w-full h-12 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-semibold"
            >
              ✅ Terminar película
            </Button>
            <Button
              onClick={() => returnToPending.mutateAsync(sessionId)}
              variant="outline"
              disabled={returnToPending.isPending}
              className="w-full h-12 rounded-xl border-zinc-700 bg-zinc-900 text-zinc-300 hover:bg-zinc-800"
            >
              ↩ No la terminamos — volver a pendientes
            </Button>
            <Button
              onClick={() => cancelSession.mutateAsync(sessionId)}
              variant="outline"
              disabled={cancelSession.isPending}
              className="w-full h-12 rounded-xl border-red-900/50 bg-zinc-900 text-red-400 hover:bg-red-950/30"
            >
              Cancelar sesión
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
