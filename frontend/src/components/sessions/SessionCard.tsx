'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { CinemaSession } from '@/types';
import { RatingStars } from './RatingStars';
import { Clock, Users } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { staggerItem } from '@/lib/animations';

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pendiente', color: 'text-zinc-400 bg-zinc-800' },
  in_progress: { label: 'En curso', color: 'text-emerald-400 bg-emerald-500/15' },
  finished: { label: 'Vista', color: 'text-indigo-400 bg-indigo-500/15' },
  cancelled: { label: 'Cancelada', color: 'text-red-400 bg-red-500/15' },
};

interface SessionCardProps {
  session: CinemaSession;
  groupId: string;
}

export function SessionCard({ session, groupId }: SessionCardProps) {
  const statusInfo = STATUS_LABELS[session.status];

  return (
    <motion.div variants={staggerItem}>
      <Link href={`/groups/${groupId}/sessions/${session.id}`}>
        <div className="bg-zinc-900 rounded-2xl border border-white/5 p-5 active:bg-zinc-800 transition-colors">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-white truncate">{session.movie?.title || 'Sin película'}</h3>
              {session.movie && (
                <div className="flex items-center gap-1 mt-1 text-xs text-zinc-500">
                  <Clock size={11} />
                  <span>{session.movie.duration_formatted}</span>
                </div>
              )}
              <p className="text-xs text-zinc-500 mt-1">
                {session.actual_end_at
                  ? formatDate(session.actual_end_at)
                  : session.started_at
                  ? formatDate(session.started_at)
                  : formatDate(session.created_at)}
              </p>
            </div>
            <span className={cn('text-xs font-medium px-2 py-1 rounded-full flex-shrink-0', statusInfo.color)}>
              {statusInfo.label}
            </span>
          </div>

          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-1 text-xs text-zinc-500">
              <Users size={12} />
              <div className="flex -space-x-1">
                {session.participants.slice(0, 4).map((p) => (
                  <span
                    key={p.id}
                    className="w-5 h-5 rounded-full flex items-center justify-center text-xs border border-zinc-950"
                    style={{ backgroundColor: `${p.color}30` }}
                    title={p.name}
                  >
                    {p.avatar}
                  </span>
                ))}
              </div>
              {session.participants.length > 4 && (
                <span className="text-zinc-600">+{session.participants.length - 4}</span>
              )}
            </div>
            {session.average_rating && (
              <div className="flex items-center gap-1">
                <RatingStars value={Math.round(session.average_rating)} readonly size={14} />
                <span className="text-xs text-zinc-400">{session.average_rating}</span>
              </div>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
