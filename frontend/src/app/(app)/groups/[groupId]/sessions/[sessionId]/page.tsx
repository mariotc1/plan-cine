'use client';

import { use, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useSession, useStartSession, useFinishSession, useReturnToPending, useRescheduleSession, useRateSession } from '@/hooks/useSessions';
import { useGroupMembers, useGroup } from '@/hooks/useGroups';
import { useAuthStore } from '@/stores/authStore';
import { RatingStars } from '@/components/sessions/RatingStars';
import { ScheduleSessionSheet } from '@/components/sessions/ScheduleSessionSheet';
import { ConfirmSheet } from '@/components/sessions/ConfirmSheet';
import { ShareCardSheet } from '@/components/sessions/ShareCardSheet';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { getPlatform, getGenre } from '@/lib/constants';
import { formatDate, formatTime } from '@/lib/utils';
import Image from 'next/image';
import { ArrowLeft, Clock, Film, Users, Calendar, Star, CalendarDays, Play } from 'lucide-react';
import { PlatformLogo } from '@/components/ui/PlatformLogo';
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
  const startSession = useStartSession(groupId);
  const finishSession = useFinishSession(groupId);
  const returnToPending = useReturnToPending(groupId);
  const rescheduleSession = useRescheduleSession(groupId);
  const rateSession = useRateSession();

  const { data: groupMembers = [] } = useGroupMembers(groupId);
  const { data: group } = useGroup(groupId);
  const members = groupMembers.map((m) => m.user);

  const [promptScore, setPromptScore] = useState(0);
  const [submittingRating, setSubmittingRating] = useState(false);
  const [showRatingPrompt, setShowRatingPrompt] = useState(false);
  const [showEditSheet, setShowEditSheet] = useState(false);
  const [showConfirmCancel, setShowConfirmCancel] = useState(false);
  const [showShareCard, setShowShareCard] = useState(false);

  // Auto-refetch when estimated_end_at arrives so the UI picks up backend auto-finish
  useEffect(() => {
    if (!session?.estimated_end_at || session.status !== 'in_progress') return;
    const delay = new Date(session.estimated_end_at).getTime() - Date.now() + 8000;
    if (delay <= 0) { refetch(); return; }
    const t = setTimeout(() => refetch(), delay);
    return () => clearTimeout(t);
  }, [session?.estimated_end_at, session?.status, refetch]);

  const userParticipated = session?.participants.some((p) => p.id === user?.id);
  const userRating = session?.ratings.find((r) => r.user.id === user?.id);
  const canRate = session?.status === 'finished' && userParticipated && !userRating;
  const isInProgress = session?.status === 'in_progress';
  const isScheduled = session?.status === 'scheduled';

  // Auto-show rating prompt when session ends and user can rate
  useEffect(() => {
    if (!canRate) return;
    const t = setTimeout(() => setShowRatingPrompt(true), 500);
    return () => clearTimeout(t);
  }, [canRate]);

  if (isLoading || !session) return <LoadingSpinner />;

  const platform = session.movie ? getPlatform(session.movie.platform) : null;
  const genre = session.movie ? getGenre(session.movie.genre) : null;

  const handleRate = async (score: number, closePrompt = false) => {
    if (!score) return;
    setSubmittingRating(true);
    try {
      await rateSession.mutateAsync({ sessionId, score });
      if (closePrompt) setShowRatingPrompt(false);
      await refetch();
    } finally {
      setSubmittingRating(false);
    }
  };

  const STATUS_CONFIG: Record<string, { label: string; dot: string; text: string; bg: string }> = {
    scheduled:   { label: 'Programada', dot: 'bg-amber-400',   text: 'text-amber-400',   bg: 'bg-amber-500/15' },
    pending:     { label: 'Pendiente',  dot: 'bg-zinc-500',    text: 'text-zinc-400',    bg: 'bg-zinc-800' },
    in_progress: { label: 'En curso',   dot: 'bg-emerald-400', text: 'text-emerald-400', bg: 'bg-emerald-500/15' },
    finished:    { label: 'Vista',      dot: 'bg-indigo-400',  text: 'text-indigo-400',  bg: 'bg-indigo-500/15' },
    cancelled:   { label: 'Cancelada',  dot: 'bg-red-400',     text: 'text-red-400',     bg: 'bg-red-500/15' },
  };
  const sc = STATUS_CONFIG[session.status] ?? STATUS_CONFIG.pending;

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
          className="bg-zinc-900 rounded-2xl border border-white/5 overflow-hidden"
        >
          <div className="flex gap-4 p-5">
            <div className="flex-shrink-0 w-[60px] h-[88px] rounded-xl overflow-hidden">
              {session.movie?.poster_path ? (
                <Image
                  src={`https://image.tmdb.org/t/p/w185${session.movie.poster_path}`}
                  alt={session.movie.title ?? ''}
                  width={60} height={88}
                  className="w-full h-full object-cover"
                  unoptimized
                />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center"
                  style={{ backgroundColor: platform?.color ? `${platform.color}18` : 'rgba(255,255,255,0.04)' }}
                >
                  <Film size={20} className="text-zinc-600" />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                {platform && (
                  <span
                    className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full"
                    style={{ backgroundColor: `${platform.color}22`, color: platform.color }}
                  >
                    <PlatformLogo platform={session.movie!.platform} size={11} color={platform.color} />
                    {platform.label}
                  </span>
                )}
                {genre && <span className="text-xs text-zinc-400">{genre.emoji} {genre.label}</span>}
                <span className="flex items-center gap-1 text-xs text-zinc-500">
                  <Clock size={11} /> {session.movie?.duration_formatted}
                </span>
              </div>

              <div className="space-y-2">
                {session.scheduled_at && (
                  <div className="flex items-center gap-2 text-sm text-amber-400/90">
                    <CalendarDays size={13} className="flex-shrink-0" />
                    <span>
                      {new Date(session.scheduled_at).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                      {' a las '}
                      {new Date(session.scheduled_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                )}
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
            </div>
          </div>

          {session.average_rating && (
            <div className="flex items-center gap-2 px-5 py-4 border-t border-white/[0.06]">
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


        {/* Share card — finished sessions */}
        {session.status === 'finished' && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <button
              onClick={() => setShowShareCard(true)}
              className="w-full h-11 rounded-2xl border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06] text-zinc-400 hover:text-zinc-200 text-sm font-medium flex items-center justify-center gap-2 transition-all"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13"/>
              </svg>
              Compartir valoración
            </button>
          </motion.div>
        )}

        {/* Actions (scheduled) */}
        {isScheduled && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-2.5 pt-1"
          >
            {/* Primary row: Edit + Start now — equal halves */}
            <div className="flex gap-2.5">
              <Button
                onClick={() => setShowEditSheet(true)}
                className="flex-1 h-12 rounded-xl bg-amber-500/90 hover:bg-amber-500 text-zinc-950 font-semibold text-sm flex items-center justify-center gap-1.5"
              >
                <CalendarDays size={14} /> Editar sesión
              </Button>
              <Button
                onClick={async () => {
                  await startSession.mutateAsync(sessionId);
                  await refetch();
                }}
                disabled={startSession.isPending}
                className="flex-1 h-12 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-semibold text-sm flex items-center justify-center gap-1.5 transition-colors"
              >
                <Play size={13} fill="currentColor" />
                {startSession.isPending ? 'Iniciando...' : 'Empezar ahora'}
              </Button>
            </div>

            {/* Destructive: Cancel — minimal prominence */}
            <div className="flex justify-center pt-1">
              <button
                onClick={() => setShowConfirmCancel(true)}
                className="text-sm text-red-400/70 hover:text-red-400 transition-colors font-medium"
              >
                Cancelar sesión
              </button>
            </div>
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

      {/* ─── Rating prompt sheet ─────────────────────────────── */}
      <AnimatePresence>
        {showRatingPrompt && canRate && (
          <>
            <motion.div
              key="rating-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/75 z-[60] backdrop-blur-sm"
            />

            <motion.div
              key="rating-sheet"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 340, damping: 34 }}
              className="fixed bottom-0 left-0 right-0 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 sm:w-[480px] z-[61] bg-zinc-950 rounded-t-3xl overflow-hidden border-t border-white/[0.08]"
            >
              {/* Poster hero — flush al top para que el overflow-hidden recorte las esquinas */}
              {session.movie?.poster_path ? (
                <div className="relative w-full h-52">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`https://image.tmdb.org/t/p/w342${session.movie.poster_path}`}
                    alt={session.movie.title ?? ''}
                    className="w-full h-full object-cover object-center"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/50 to-transparent" />
                </div>
              ) : (
                <div className="pt-5" />
              )}

              <div className="px-6 pt-4 pb-[max(env(safe-area-inset-bottom),28px)]">

                {/* Personalized message */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.12 }}
                  className="mb-6"
                >
                  <p className="text-zinc-400 text-[15px] leading-snug">
                    Hey{' '}
                    <span className="text-white font-semibold">{user?.name}</span>,
                    ¿qué te pareció?
                  </p>
                  <h2 className="text-xl font-bold text-white leading-tight mt-1 truncate">
                    {session.movie?.title}
                  </h2>
                </motion.div>

                {/* Stars — large and prominent */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring', stiffness: 320 }}
                  className="flex justify-center mb-7"
                >
                  <RatingStars value={promptScore} onChange={setPromptScore} size={52} />
                </motion.div>

                {/* Actions */}
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.28 }}
                  className="space-y-3"
                >
                  <Button
                    onClick={() => handleRate(promptScore, true)}
                    disabled={!promptScore || submittingRating}
                    className="w-full h-12 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-semibold disabled:opacity-35 transition-all"
                  >
                    {submittingRating ? 'Guardando...' : 'Enviar valoración'}
                  </Button>
                </motion.div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Edit session sheet (participants + date/time) */}
      <ScheduleSessionSheet
        open={showEditSheet}
        onClose={() => setShowEditSheet(false)}
        movie={session?.movie ?? null}
        members={members}
        editMode
        initialParticipantIds={session?.participants.map((p) => p.id)}
        initialScheduledAt={session?.scheduled_at}
        loading={rescheduleSession.isPending}
        onSchedule={async (participantIds, scheduledAt) => {
          await rescheduleSession.mutateAsync({ sessionId, scheduledAt, participantIds });
          setShowEditSheet(false);
          await refetch();
        }}
      />

      {/* Share card sheet */}
      {session && (
        <ShareCardSheet
          open={showShareCard}
          onClose={() => setShowShareCard(false)}
          session={session}
          groupName={group?.name}
        />
      )}

      {/* Cancel confirmation */}
      <ConfirmSheet
        open={showConfirmCancel}
        onClose={() => setShowConfirmCancel(false)}
        title="¿Cancelar la sesión?"
        message="La película volverá a la lista de pendientes y podrás programarla de nuevo cuando quieras."
        confirmLabel="Sí, cancelar sesión"
        cancelLabel="Mantener"
        loading={returnToPending.isPending}
        onConfirm={async () => {
          await returnToPending.mutateAsync(sessionId);
          router.replace(`/groups/${groupId}/sessions`);
        }}
      />
    </div>
  );
}
