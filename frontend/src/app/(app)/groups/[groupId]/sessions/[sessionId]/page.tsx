'use client';

import { use, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useSession, useFinishSession, useReturnToPending, useRateSession } from '@/hooks/useSessions';
import { useAuthStore } from '@/stores/authStore';
import { RatingStars } from '@/components/sessions/RatingStars';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { getPlatform, getGenre } from '@/lib/constants';
import { formatDate, formatTime } from '@/lib/utils';
import { ArrowLeft, Clock, Users, Calendar, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Props {
  params: Promise<{ groupId: string; sessionId: string }>;
}

export default function SessionDetailPage({ params }: Props) {
  const { groupId, sessionId } = use(params);
  const router = useRouter();
  const { data: session, isLoading, refetch } = useSession(groupId, sessionId);
  const { user } = useAuthStore();
  const finishSession = useFinishSession(groupId);
  const returnToPending = useReturnToPending(groupId);
  const rateSession = useRateSession();

  const [selectedScore, setSelectedScore] = useState(0);
  const [submittingRating, setSubmittingRating] = useState(false);

  // Auto-refetch when estimated_end_at arrives so the UI picks up backend auto-finish
  useEffect(() => {
    if (!session?.estimated_end_at || session.status !== 'in_progress') return;
    const delay = new Date(session.estimated_end_at).getTime() - Date.now() + 8000;
    if (delay <= 0) {
      refetch();
      return;
    }
    const t = setTimeout(() => refetch(), delay);
    return () => clearTimeout(t);
  }, [session?.estimated_end_at, session?.status, refetch]);

  if (isLoading || !session) return <LoadingSpinner />;

  const platform = session.movie ? getPlatform(session.movie.platform) : null;
  const genre = session.movie ? getGenre(session.movie.genre) : null;
  const userParticipated = session.participants.some((p) => p.id === user?.id);
  const userRating = session.ratings.find((r) => r.user.id === user?.id);
  const canRate = session.status === 'finished' && userParticipated && !userRating;
  const isInProgress = session.status === 'in_progress';

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
    pending:     { label: 'Pendiente',  dot: 'bg-zinc-500',    text: 'text-zinc-400',    bg: 'bg-zinc-800' },
    in_progress: { label: 'En curso',   dot: 'bg-emerald-400', text: 'text-emerald-400', bg: 'bg-emerald-500/15' },
    finished:    { label: 'Vista',      dot: 'bg-indigo-400',  text: 'text-indigo-400',  bg: 'bg-indigo-500/15' },
    cancelled:   { label: 'Cancelada',  dot: 'bg-red-400',     text: 'text-red-400',     bg: 'bg-red-500/15' },
  };
  const sc = STATUS_CONFIG[session.status];

  return (
    <div>
      {/* Breadcrumb */}
      <div className="px-5 pt-3 pb-4">
        <motion.button
          whileTap={{ scale: 0.85 }}
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          <ArrowLeft size={15} />
          <span className="text-sm font-medium">Sesiones</span>
        </motion.button>
      </div>

      <div className="px-5 pb-10 space-y-4">
        {/* Title + status */}
        <div>
          <h1 className="text-2xl font-bold text-white leading-tight">
            {session.movie?.title || 'Sesión'}
          </h1>
          <div className="flex items-center gap-2 mt-2">
            {session.started_at && (
              <p className="text-sm text-zinc-500">{formatDate(session.started_at)}</p>
            )}
            <span className={cn('text-xs font-semibold px-2.5 py-1 rounded-full', sc.text, sc.bg)}>
              {sc.label}
            </span>
          </div>
        </div>

        {/* Movie info card */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-zinc-900 rounded-2xl border border-white/5 p-5"
        >
          <div className="flex flex-wrap items-center gap-2 mb-4">
            {platform && (
              <span
                className="text-xs font-medium px-2.5 py-1 rounded-full"
                style={{ backgroundColor: `${platform.color}22`, color: platform.color }}
              >
                {platform.emoji} {platform.label}
              </span>
            )}
            {genre && (
              <span className="text-xs text-zinc-400">{genre.emoji} {genre.label}</span>
            )}
            <span className="flex items-center gap-1 text-xs text-zinc-500">
              <Clock size={11} /> {session.movie?.duration_formatted}
            </span>
          </div>

          <div className="space-y-2">
            {session.started_at && (
              <div className="flex items-center gap-2 text-sm text-zinc-400">
                <Calendar size={13} className="flex-shrink-0" />
                <span>Inicio: {formatTime(session.started_at)}</span>
              </div>
            )}
            {session.estimated_end_at && (
              <div className="flex items-center gap-2 text-sm text-zinc-500">
                <Clock size={13} className="flex-shrink-0" />
                <span>Fin estimado: {formatTime(session.estimated_end_at)}</span>
              </div>
            )}
          </div>

          {session.average_rating && (
            <div className="flex items-center gap-2 mt-4 pt-4 border-t border-white/[0.06]">
              <RatingStars value={Math.round(session.average_rating)} readonly size={16} />
              <span className="text-sm font-semibold text-zinc-300">{session.average_rating}</span>
              <span className="text-xs text-zinc-600">
                ({session.ratings.length} valoracion{session.ratings.length !== 1 ? 'es' : ''})
              </span>
            </div>
          )}
        </motion.div>

        {/* Participants */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-zinc-900 rounded-2xl border border-white/5 p-5"
        >
          <div className="flex items-center gap-2 mb-3">
            <Users size={13} className="text-zinc-500" />
            <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
              Participantes · {session.participants.length}
            </h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {session.participants.map((p) => (
              <div key={p.id} className="flex items-center gap-2 bg-white/[0.04] rounded-xl px-3 py-2">
                <span
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-sm"
                  style={{ backgroundColor: `${p.color}25` }}
                >
                  {p.avatar}
                </span>
                <span className="text-sm text-zinc-300 font-medium">{p.name}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Ratings list */}
        <AnimatePresence>
          {session.ratings.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-zinc-900 rounded-2xl border border-white/5 p-5"
            >
              <div className="flex items-center gap-2 mb-4">
                <Star size={13} className="text-zinc-500" />
                <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Valoraciones</h3>
              </div>
              <div className="space-y-3">
                {session.ratings.map((rating) => (
                  <div key={rating.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-sm"
                        style={{ backgroundColor: `${rating.user.color}25` }}
                      >
                        {rating.user.avatar}
                      </span>
                      <span className="text-sm text-zinc-300">{rating.user.name}</span>
                    </div>
                    <RatingStars value={rating.score} readonly size={15} />
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Rate */}
        {canRate && (
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15 }}
            className="bg-zinc-900 rounded-2xl border border-indigo-500/20 p-5"
          >
            <p className="text-sm font-semibold text-white mb-1">¿Qué te ha parecido?</p>
            <p className="text-xs text-zinc-500 mb-5">{session.movie?.title}</p>
            <div className="flex justify-center mb-5">
              <RatingStars value={selectedScore} onChange={setSelectedScore} size={38} />
            </div>
            <Button
              onClick={handleRate}
              disabled={!selectedScore || submittingRating}
              className="w-full h-12 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-semibold"
            >
              {submittingRating ? 'Guardando...' : 'Enviar valoración'}
            </Button>
          </motion.div>
        )}

        {/* Actions (in_progress only) */}
        {isInProgress && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-3 pt-1"
          >
            <Button
              onClick={() => finishSession.mutateAsync(sessionId)}
              disabled={finishSession.isPending}
              className="w-full h-12 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-semibold"
            >
              {finishSession.isPending ? 'Guardando...' : 'Terminamos la película'}
            </Button>
            <Button
              onClick={() => returnToPending.mutateAsync(sessionId)}
              disabled={returnToPending.isPending}
              variant="ghost"
              className="w-full h-12 rounded-xl bg-red-500/8 hover:bg-red-500/15 border border-red-500/20 text-red-400 hover:text-red-300 font-medium transition-colors"
            >
              {returnToPending.isPending ? 'Volviendo...' : 'No la terminamos — volver a la lista'}
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
