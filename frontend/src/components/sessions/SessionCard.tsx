'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { CinemaSession } from '@/types';
import { RatingStars } from './RatingStars';
import { Clock, Film, ChevronRight, CalendarDays } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { staggerItem } from '@/lib/animations';

const STATUS_CONFIG: Record<string, { label: string; textColor: string; bgColor: string; accentColor: string }> = {
  scheduled:   { label: 'Programada', textColor: 'text-amber-400',   bgColor: 'bg-amber-500/15',    accentColor: '#f59e0b' },
  pending:     { label: 'Pendiente',  textColor: 'text-zinc-400',    bgColor: 'bg-zinc-800',        accentColor: '#71717a' },
  in_progress: { label: 'En curso',   textColor: 'text-emerald-400', bgColor: 'bg-emerald-500/15',  accentColor: '#10b981' },
  finished:    { label: 'Vista',      textColor: 'text-indigo-400',  bgColor: 'bg-indigo-500/15',   accentColor: '#6366f1' },
  cancelled:   { label: 'Cancelada',  textColor: 'text-red-400',     bgColor: 'bg-red-500/15',      accentColor: '#ef4444' },
};

interface SessionCardProps {
  session: CinemaSession;
  groupId: string;
  hideStatus?: boolean;
}

export function SessionCard({ session, groupId, hideStatus }: SessionCardProps) {
  const config = STATUS_CONFIG[session.status] ?? STATUS_CONFIG.pending;
  const isInProgress = session.status === 'in_progress';
  const isScheduled = session.status === 'scheduled';

  return (
    <motion.div variants={staggerItem} whileTap={{ scale: 0.985 }}>
      <Link href={`/groups/${groupId}/sessions/${session.id}`}>
        <div className={cn(
          'bg-zinc-900 rounded-2xl border overflow-hidden transition-colors active:bg-zinc-800/60',
          isInProgress ? 'border-emerald-500/20' : isScheduled ? 'border-amber-500/20' : 'border-white/[0.06]',
        )}>
          {/* Status accent line */}
          <div
            className="h-[2px] w-full"
            style={{
              background: `linear-gradient(to right, ${config.accentColor}70, ${config.accentColor}10)`,
            }}
          />

          <div className="p-4">
            <div className="flex gap-3.5 items-start">

              {/* Poster */}
              <div className="flex-shrink-0 w-[52px] h-[76px] rounded-xl overflow-hidden ring-1 ring-white/[0.07]">
                {session.movie?.poster_path ? (
                  <Image
                    src={`https://image.tmdb.org/t/p/w92${session.movie.poster_path}`}
                    alt={session.movie.title}
                    width={52}
                    height={76}
                    className="w-full h-full object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-white/[0.04]">
                    <Film size={16} className="text-zinc-700" />
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 pt-0.5">

                {/* Title row */}
                <div className="flex items-center gap-2 mb-1.5">
                  {isInProgress && (
                    <span className="flex-shrink-0 w-2 h-2 rounded-full bg-emerald-400" />
                  )}
                  {isScheduled && (
                    <span className="flex-shrink-0 w-2 h-2 rounded-full bg-amber-400" />
                  )}
                  <h3 className="text-[15px] font-bold text-white leading-tight line-clamp-2 flex-1">
                    {session.movie?.title || 'Sin película'}
                  </h3>
                  {!hideStatus && (
                    <span className={cn(
                      'text-[11px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0',
                      config.textColor, config.bgColor,
                    )}>
                      {config.label}
                    </span>
                  )}
                </div>

                {/* Meta */}
                <div className="flex items-center gap-1.5 text-[11px] text-zinc-600 mb-1">
                  {session.movie && (
                    <>
                      <Clock size={10} />
                      <span>{session.movie.duration_formatted}</span>
                      <span>·</span>
                    </>
                  )}
                  {isScheduled && session.scheduled_at ? (
                    <span className="flex items-center gap-1 text-amber-500/80">
                      <CalendarDays size={10} />
                      {new Date(session.scheduled_at).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })}
                      {' '}
                      {new Date(session.scheduled_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  ) : (
                    <span>
                      {session.actual_end_at
                        ? formatDate(session.actual_end_at)
                        : session.started_at
                        ? formatDate(session.started_at)
                        : formatDate(session.created_at)}
                    </span>
                  )}
                </div>

                {/* Participants + Rating */}
                <div className="flex items-center justify-between mt-2.5">
                  <div className="flex -space-x-1">
                    {session.participants.slice(0, 5).map((p) => (
                      <span
                        key={p.id}
                        className="w-6 h-6 rounded-full flex items-center justify-center text-xs border-2 border-zinc-900"
                        style={{ backgroundColor: `${p.color}30` }}
                        title={p.name}
                      >
                        {p.avatar}
                      </span>
                    ))}
                    {session.participants.length > 5 && (
                      <span className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] text-zinc-500 bg-zinc-800 border-2 border-zinc-900">
                        +{session.participants.length - 5}
                      </span>
                    )}
                  </div>

                  {session.average_rating ? (
                    <div className="flex items-center gap-1.5">
                      <RatingStars value={Math.round(session.average_rating)} readonly size={13} />
                      <span className="text-xs font-semibold text-zinc-400">{session.average_rating}</span>
                    </div>
                  ) : null}
                </div>
              </div>

              {/* Chevron */}
              <ChevronRight size={15} className="text-zinc-700 flex-shrink-0 self-center" />
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
