'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Swords, Trophy, Scale, RotateCcw, Shuffle, Play,
  CalendarDays, Check, X, Users, ChevronRight, Film,
} from 'lucide-react';
import { PlatformLogo } from '@/components/ui/PlatformLogo';
import { getPlatform } from '@/lib/constants';
import { Movie, User, Duel } from '@/types';
import {
  useActiveDuel, useCreateDuel, useVoteDuel,
  useCloseDuel, useResolveDuel, useCancelDuel,
} from '@/hooks/useDuel';
import { toast } from 'sonner';

interface DuelViewProps {
  groupId: string;
  currentUserId: string;
  isAdmin: boolean;
  members: User[];
  onWatch: (movie: Movie) => void;
  onSchedule: (movie: Movie) => void;
}

// ─── Available height for flex-filling states ────────────────────────────────
// Accounts for: safe-area-top (~44px) + group header (~56px) + tabs (~58px)
// + mt-3 (~12px) + mode-switcher (~52px) + main pb-20 (80px) = ~302px total
// Using 295px gives a small breathing room at the bottom.
const CONTENT_HEIGHT = 'calc(100svh - 295px)';

// ─── Voting / Tie movie card ──────────────────────────────────────────────────

interface DuelCardProps {
  movie: Movie;
  votedFor: boolean;
  votes: number;
  totalMembers: number;
  onVote: () => void;
  isPending: boolean;
}

function DuelCard({ movie, votedFor, votes, totalMembers, onVote, isPending }: DuelCardProps) {
  const platform = getPlatform(movie.platform);
  const percentage = totalMembers > 0 ? Math.round((votes / totalMembers) * 100) : 0;

  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      onClick={onVote}
      disabled={isPending}
      className="relative flex-1 rounded-2xl overflow-hidden border transition-all duration-200 flex flex-col min-h-0"
      style={
        votedFor
          ? { borderColor: 'rgba(251,191,36,0.5)', boxShadow: '0 0 24px -4px rgba(251,191,36,0.3)' }
          : { borderColor: 'rgba(255,255,255,0.07)' }
      }
    >
      {/* Poster — grows to fill whatever space the flex parent gives */}
      <div className="relative flex-1 min-h-[100px] overflow-hidden">
        {movie.poster_path ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`https://image.tmdb.org/t/p/w185${movie.poster_path}`}
            alt={movie.title}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ background: platform ? `${platform.color}18` : '#27272a' }}
          >
            <Film size={24} className="text-zinc-600" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/25 to-transparent" />

        <AnimatePresence>
          {votedFor && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 28 }}
              className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-amber-400 flex items-center justify-center shadow-lg"
            >
              <Check size={13} strokeWidth={3} className="text-zinc-950" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Card content — fixed height */}
      <div className="px-2.5 pt-2 pb-2.5 bg-zinc-900 flex-shrink-0">
        <p className="text-white font-bold text-[12px] leading-tight line-clamp-2 mb-1.5">
          {movie.title}
        </p>
        <div className="flex items-center gap-1 flex-wrap mb-2">
          <span className="text-[10px] text-zinc-500">{movie.duration_formatted}</span>
          {platform && (
            <span className="text-[10px]" style={{ color: platform.color }}>
              · {platform.label}
            </span>
          )}
        </div>
        <div className="space-y-1">
          <div className="h-1 rounded-full bg-zinc-800 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${percentage}%` }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className="h-full rounded-full"
              style={{ background: votedFor ? '#fbbf24' : '#6366f1' }}
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-zinc-500">{votes} {votes === 1 ? 'voto' : 'votos'}</span>
            <span className="text-[10px] font-bold" style={{ color: votedFor ? '#fbbf24' : '#a1a1aa' }}>
              {percentage}%
            </span>
          </div>
        </div>
      </div>
    </motion.button>
  );
}

// ─── Winner card ──────────────────────────────────────────────────────────────

function WinnerCard({ movie, style }: { movie: Movie; style?: React.CSSProperties }) {
  const platform = getPlatform(movie.platform);
  return (
    <div
      className="relative w-full rounded-2xl overflow-hidden border border-amber-400/30 shadow-[0_0_40px_-8px_rgba(251,191,36,0.35)] flex flex-col"
      style={style}
    >
      {movie.poster_path ? (
        <div className="relative flex-1 min-h-[80px] overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`https://image.tmdb.org/t/p/w342${movie.poster_path}`}
            alt={movie.title}
            className="absolute inset-0 w-full h-full object-cover object-top"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/10 to-transparent" />
          <div className="absolute bottom-3 left-4 flex items-center gap-2">
            <Trophy size={13} className="text-amber-400" />
            <span className="text-[11px] font-bold text-amber-400 uppercase tracking-widest">Ganadora</span>
          </div>
        </div>
      ) : (
        <div
          className="flex-1 min-h-[60px] flex items-center gap-2 px-4"
          style={{ background: platform ? `${platform.color}15` : '#27272a' }}
        >
          <Trophy size={13} className="text-amber-400" />
          <span className="text-[11px] font-bold text-amber-400 uppercase tracking-widest">Ganadora</span>
        </div>
      )}
      <div className="px-4 py-3 bg-zinc-900 flex-shrink-0">
        <h3 className="text-white font-bold text-xl leading-tight mb-1.5">{movie.title}</h3>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-zinc-400">{movie.duration_formatted}</span>
          {platform && (
            <span
              className="inline-flex items-center gap-1 text-[12px] font-medium px-2 py-0.5 rounded-full"
              style={{ backgroundColor: `${platform.color}18`, color: platform.color }}
            >
              <PlatformLogo platform={movie.platform} size={11} color={platform.color} />
              {platform.label}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Vote participant list ────────────────────────────────────────────────────

function VoteRow({ duel, members }: { duel: Duel; members: User[] }) {
  const votedCount = duel.votes.length;
  const totalCount = members.length;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <Users size={11} className="text-zinc-500" />
        <span className="text-[11px] text-zinc-500">
          {votedCount} de {totalCount} {votedCount === 1 ? 'ha votado' : 'han votado'}
        </span>
      </div>
      <div className="flex gap-1.5 flex-wrap">
        {members.map((m) => {
          const vote = duel.votes.find((v) => v.user.id === m.id);
          const votedA = vote?.movie_id === duel.movie_a.id;
          const votedB = vote?.movie_id === duel.movie_b.id;
          return (
            <div key={m.id} className="flex items-center gap-1">
              <span
                className="w-6 h-6 rounded-lg flex items-center justify-center text-xs flex-shrink-0 border"
                style={{
                  backgroundColor: `${m.color}20`,
                  borderColor: vote ? `${m.color}50` : 'rgba(255,255,255,0.06)',
                }}
                title={m.name}
              >
                {m.avatar}
              </span>
              {vote && <ChevronRight size={9} className="text-zinc-600" />}
              {votedA && <span className="text-[10px] text-zinc-400 font-medium max-w-[56px] truncate">{duel.movie_a.title}</span>}
              {votedB && <span className="text-[10px] text-zinc-400 font-medium max-w-[56px] truncate">{duel.movie_b.title}</span>}
              {!vote && <span className="text-[10px] text-zinc-600 italic">pendiente</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main DuelView ────────────────────────────────────────────────────────────

export function DuelView({ groupId, currentUserId, isAdmin, members, onWatch, onSchedule }: DuelViewProps) {
  const { data: duel, isLoading } = useActiveDuel(groupId);
  const createDuel = useCreateDuel(groupId);
  const voteDuel = useVoteDuel(groupId);
  const closeDuel = useCloseDuel(groupId);
  const resolveDuel = useResolveDuel(groupId);
  const cancelDuel = useCancelDuel(groupId);

  const myVote = duel?.votes.find((v) => v.user.id === currentUserId);
  const votedMovieId = myVote?.movie_id ?? null;

  const [randomSpinning, setRandomSpinning] = useState(false);

  function apiError(e: unknown, fallback: string): string {
    const err = e as { response?: { data?: { message?: string } } };
    return err?.response?.data?.message ?? fallback;
  }

  const handleVote = async (movieId: string) => {
    if (!duel) return;
    try {
      const res = await voteDuel.mutateAsync({ duelId: duel.id, movieId });
      const updated = res.data.data;
      if (members.length > 0 && updated.votes.length >= members.length) {
        await closeDuel.mutateAsync(updated.id);
      }
    } catch (e) {
      toast.error(apiError(e, 'Error al votar'));
    }
  };

  const handleClose = async () => {
    if (!duel) return;
    try {
      await closeDuel.mutateAsync(duel.id);
    } catch (e) {
      toast.error(apiError(e, 'Error al cerrar la votación'));
    }
  };

  const handleResolve = async (action: 'revote' | 'random') => {
    if (!duel) return;
    try {
      if (action === 'random') {
        setRandomSpinning(true);
        await new Promise<void>((resolve) => setTimeout(resolve, 2800));
        setRandomSpinning(false);
      }
      await resolveDuel.mutateAsync({ duelId: duel.id, action });
      if (action === 'revote') toast.success('¡Nueva votación iniciada!');
    } catch (e) {
      setRandomSpinning(false);
      toast.error(apiError(e, 'Error al resolver el empate'));
    }
  };

  const handleCancel = async () => {
    if (!duel) return;
    try {
      await cancelDuel.mutateAsync(duel.id);
    } catch (e) {
      toast.error(apiError(e, 'Error al cancelar el duelo'));
    }
  };

  const handleStart = async () => {
    try {
      await createDuel.mutateAsync();
    } catch (e) {
      toast.error(apiError(e, 'Error al iniciar el duelo'));
    }
  };

  if (isLoading) {
    return (
      <div className="px-5 flex flex-col gap-3" style={{ height: CONTENT_HEIGHT }}>
        <div className="skeleton h-8 w-36 rounded-xl" />
        <div className="flex gap-3 flex-1 min-h-0">
          <div className="skeleton flex-1 rounded-2xl" />
          <div className="skeleton flex-1 rounded-2xl" />
        </div>
        <div className="skeleton h-10 rounded-2xl" />
        <div className="skeleton h-12 rounded-2xl" />
      </div>
    );
  }

  // ── Winner state ────────────────────────────────────────────────────────────
  if (duel?.status === 'closed' && duel.winner_id) {
    const winner = duel.movie_a.id === duel.winner_id ? duel.movie_a : duel.movie_b;
    const loser  = duel.movie_a.id === duel.winner_id ? duel.movie_b : duel.movie_a;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
        className="px-5 flex flex-col gap-3"
        style={{ height: CONTENT_HEIGHT }}
      >
        {/* Trophy header */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <Trophy size={22} className="text-amber-400 flex-shrink-0" />
          <div>
            <p className="text-white font-bold text-xl">¡Tenemos ganadora!</p>
            <p className="text-zinc-500 text-[13px]">La votación ha concluido</p>
          </div>
        </div>

        {/* Winner card — fills remaining space */}
        <WinnerCard movie={winner} style={{ flex: 1, minHeight: 0 }} />

        {/* Loser pill */}
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <div className="w-7 h-7 rounded-lg overflow-hidden flex-shrink-0 opacity-35">
            {loser.poster_path ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={`https://image.tmdb.org/t/p/w92${loser.poster_path}`} alt={loser.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
                <Film size={12} className="text-zinc-600" />
              </div>
            )}
          </div>
          <div className="opacity-35 min-w-0">
            <p className="text-zinc-400 text-[12px] font-medium truncate">{loser.title}</p>
            <p className="text-zinc-600 text-[11px]">Queda pendiente para otro día</p>
          </div>
        </div>

        {/* CTAs */}
        <div className="flex-shrink-0 space-y-2">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => onWatch(winner)}
            className="w-full h-12 bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold rounded-2xl flex items-center justify-center gap-2 shadow-[0_4px_20px_-4px_rgba(251,191,36,0.45)] transition-colors"
          >
            <Play size={16} fill="currentColor" />
            Ver ahora
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => onSchedule(winner)}
            className="w-full h-12 bg-white/[0.06] hover:bg-white/10 text-zinc-300 font-medium rounded-2xl flex items-center justify-center gap-2 border border-white/[0.08] transition-colors"
          >
            <CalendarDays size={15} />
            Programar para más tarde
          </motion.button>
          {isAdmin && (
            <button
              onClick={handleCancel}
              className="w-full h-9 text-zinc-600 text-[13px] hover:text-zinc-400 transition-colors"
            >
              Nuevo duelo
            </button>
          )}
        </div>
      </motion.div>
    );
  }

  // ── Tie state ───────────────────────────────────────────────────────────────
  if (duel?.status === 'tie') {
    const votesA = duel.votes.filter((v) => v.movie_id === duel.movie_a.id).length;
    const votesB = duel.votes.filter((v) => v.movie_id === duel.movie_b.id).length;

    return (
      <>
        {/* Fate animation overlay */}
        <AnimatePresence>
          {randomSpinning && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 bg-zinc-950/96 backdrop-blur-xl flex flex-col items-center justify-center gap-8 px-8"
            >
              <div className="flex items-center gap-6">
                <motion.div
                  animate={{ rotate: [-6, 6, -6], x: [0, -5, 0] }}
                  transition={{ repeat: Infinity, duration: 0.55, ease: 'easeInOut' }}
                  className="w-[78px] h-[112px] rounded-xl overflow-hidden ring-2 ring-white/15 flex-shrink-0"
                >
                  {duel.movie_a.poster_path ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={`https://image.tmdb.org/t/p/w185${duel.movie_a.poster_path}`} alt={duel.movie_a.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
                      <Film size={22} className="text-zinc-600" />
                    </div>
                  )}
                </motion.div>

                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 0.7, ease: 'linear' }}
                  className="w-12 h-12 rounded-full bg-amber-400/15 border border-amber-400/30 flex items-center justify-center flex-shrink-0"
                >
                  <Shuffle size={20} className="text-amber-400" />
                </motion.div>

                <motion.div
                  animate={{ rotate: [6, -6, 6], x: [0, 5, 0] }}
                  transition={{ repeat: Infinity, duration: 0.55, ease: 'easeInOut' }}
                  className="w-[78px] h-[112px] rounded-xl overflow-hidden ring-2 ring-white/15 flex-shrink-0"
                >
                  {duel.movie_b.poster_path ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={`https://image.tmdb.org/t/p/w185${duel.movie_b.poster_path}`} alt={duel.movie_b.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
                      <Film size={22} className="text-zinc-600" />
                    </div>
                  )}
                </motion.div>
              </div>

              <div className="text-center space-y-2">
                <motion.p
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ repeat: Infinity, duration: 1.1 }}
                  className="text-white font-bold text-xl"
                >
                  La suerte está decidiendo...
                </motion.p>
                <p className="text-zinc-500 text-sm">
                  {duel.movie_a.title} vs {duel.movie_b.title}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          className="px-5 flex flex-col gap-3"
          style={{ height: CONTENT_HEIGHT }}
        >
          {/* Tie header */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center flex-shrink-0">
              <Scale size={18} className="text-indigo-400" />
            </div>
            <div>
              <p className="text-white font-bold text-lg">¡Empate!</p>
              <p className="text-zinc-500 text-[12px]">{votesA} – {votesB} · Hay que desempatar</p>
            </div>
          </div>

          {/* Tied movie cards — fill available space */}
          <div className="flex gap-3 flex-1 min-h-0">
            {[duel.movie_a, duel.movie_b].map((movie) => {
              const platform = getPlatform(movie.platform);
              return (
                <div key={movie.id} className="flex-1 flex flex-col bg-zinc-900 rounded-2xl overflow-hidden border border-white/[0.06] min-h-0">
                  <div className="relative flex-1 min-h-0 overflow-hidden">
                    {movie.poster_path ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={`https://image.tmdb.org/t/p/w185${movie.poster_path}`}
                        alt={movie.title}
                        className="absolute inset-0 w-full h-full object-cover opacity-70"
                      />
                    ) : (
                      <div
                        className="absolute inset-0 flex items-center justify-center"
                        style={{ background: platform ? `${platform.color}15` : '#27272a' }}
                      >
                        <Film size={22} className="text-zinc-600" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 to-transparent" />
                  </div>
                  <div className="px-2.5 py-2 flex-shrink-0">
                    <p className="text-zinc-300 text-[11px] font-semibold line-clamp-2 leading-tight">
                      {movie.title}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Resolution options */}
          <div className="flex-shrink-0 space-y-2">
            {isAdmin ? (
              <>
                <p className="text-zinc-500 text-[11px] text-center">Tú decides cómo desempatar:</p>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => handleResolve('revote')}
                  disabled={resolveDuel.isPending}
                  className="w-full h-12 bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-400 font-semibold rounded-2xl flex items-center justify-center gap-2 border border-indigo-500/25 transition-colors disabled:opacity-50"
                >
                  <RotateCcw size={15} />
                  Repetir votación
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => handleResolve('random')}
                  disabled={resolveDuel.isPending}
                  className="w-full h-12 bg-amber-400/15 hover:bg-amber-400/25 text-amber-400 font-semibold rounded-2xl flex items-center justify-center gap-2 border border-amber-400/25 transition-colors disabled:opacity-50"
                >
                  <Shuffle size={15} />
                  La ruleta decide
                </motion.button>
                <button
                  onClick={handleCancel}
                  disabled={cancelDuel.isPending}
                  className="w-full h-9 text-zinc-600 text-[12px] hover:text-zinc-400 transition-colors disabled:opacity-50"
                >
                  Cancelar duelo
                </button>
              </>
            ) : (
              <div className="flex items-center justify-center gap-2 py-2.5 px-4 bg-zinc-900 rounded-2xl border border-white/[0.06]">
                <Scale size={13} className="text-zinc-500" />
                <p className="text-zinc-500 text-[13px]">Esperando que el admin desempate</p>
              </div>
            )}
          </div>
        </motion.div>
      </>
    );
  }

  // ── Voting state ────────────────────────────────────────────────────────────
  if (duel?.status === 'voting') {
    const votesA = duel.votes.filter((v) => v.movie_id === duel.movie_a.id).length;
    const votesB = duel.votes.filter((v) => v.movie_id === duel.movie_b.id).length;
    const totalVoters = members.length;
    const allVoted = duel.votes.length === totalVoters;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
        className="px-5 flex flex-col gap-3"
        style={{ height: CONTENT_HEIGHT }}
      >
        {/* Header */}
        <div className="flex items-center justify-between flex-shrink-0">
          <div>
            <p className="text-white font-bold text-lg">Duelo en curso</p>
            <p className="text-zinc-500 text-[12px]">
              {allVoted ? '¡Todos han votado!' : `${duel.votes.length} de ${totalVoters} han votado`}
            </p>
          </div>
          {isAdmin && (
            <button
              onClick={handleCancel}
              disabled={cancelDuel.isPending}
              className="w-7 h-7 rounded-full bg-white/[0.08] flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* Cards — fill remaining space */}
        <div className="relative flex gap-3 flex-1 min-h-0">
          <DuelCard
            movie={duel.movie_a}
            votedFor={votedMovieId === duel.movie_a.id}
            votes={votesA}
            totalMembers={totalVoters}
            onVote={() => handleVote(duel.movie_a.id)}
            isPending={voteDuel.isPending || closeDuel.isPending}
          />

          <div className="absolute left-1/2 top-[42%] -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none">
            <div className="w-8 h-8 rounded-full bg-zinc-950 border-2 border-amber-400/40 flex items-center justify-center shadow-[0_0_16px_-2px_rgba(251,191,36,0.4)]">
              <Swords size={13} className="text-amber-400" />
            </div>
          </div>

          <DuelCard
            movie={duel.movie_b}
            votedFor={votedMovieId === duel.movie_b.id}
            votes={votesB}
            totalMembers={totalVoters}
            onVote={() => handleVote(duel.movie_b.id)}
            isPending={voteDuel.isPending || closeDuel.isPending}
          />
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 space-y-2">
          <VoteRow duel={duel} members={members} />

          {isAdmin && (
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleClose}
              disabled={closeDuel.isPending || duel.votes.length === 0}
              className="w-full h-12 bg-amber-400/15 hover:bg-amber-400/25 text-amber-400 font-semibold rounded-2xl flex items-center justify-center gap-2 border border-amber-400/25 transition-colors disabled:opacity-40"
            >
              {closeDuel.isPending ? 'Cerrando...' : 'Cerrar votación'}
            </motion.button>
          )}

          {!isAdmin && allVoted && (
            <div className="flex items-center justify-center gap-2 py-2 px-4 bg-zinc-900 rounded-2xl border border-white/[0.06]">
              <span className="text-[13px] text-zinc-400">Esperando que el admin cierre la votación</span>
            </div>
          )}
        </div>
      </motion.div>
    );
  }

  // ── No duel (idle) state ────────────────────────────────────────────────────
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 280, damping: 26 }}
      className="px-5 flex flex-col items-center justify-center"
      style={{ height: CONTENT_HEIGHT }}
    >
      <div className="w-20 h-20 rounded-[22px] bg-amber-400/10 border border-amber-400/20 flex items-center justify-center mb-5">
        <Swords size={34} className="text-amber-400" />
      </div>

      <h2 className="text-white font-bold text-2xl mb-2">Duelo de Películas</h2>
      <p className="text-zinc-500 text-[14px] text-center leading-relaxed max-w-[260px] mb-8">
        Sorteamos dos pelis y todos votáis. La más votada es la que veréis esta noche.
      </p>

      <motion.button
        whileTap={{ scale: 0.96 }}
        onClick={handleStart}
        disabled={createDuel.isPending}
        className="h-13 px-10 bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold text-[15px] rounded-2xl flex items-center gap-2.5 shadow-[0_4px_24px_-4px_rgba(251,191,36,0.45)] transition-colors disabled:opacity-50"
      >
        <Swords size={16} />
        {createDuel.isPending ? 'Iniciando...' : 'Iniciar duelo'}
      </motion.button>
    </motion.div>
  );
}
