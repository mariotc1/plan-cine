'use client';

import { use } from 'react';
import { motion } from 'framer-motion';
import { useSessions } from '@/hooks/useSessions';
import { SessionCard } from '@/components/sessions/SessionCard';
import { EmptyState } from '@/components/shared/EmptyState';
import { SkeletonCard } from '@/components/shared/LoadingSpinner';
import { staggerContainer } from '@/lib/animations';
import { CinemaSession } from '@/types';

interface Props {
  params: Promise<{ groupId: string }>;
}

export default function SessionsPage({ params }: Props) {
  const { groupId } = use(params);
  const { data: sessions, isLoading } = useSessions(groupId);

  const inProgress = sessions?.filter((s) => s.status === 'in_progress') ?? [];
  const finished = sessions?.filter((s) => s.status === 'finished') ?? [];
  const others = sessions?.filter((s) => !['in_progress', 'finished'].includes(s.status)) ?? [];

  if (isLoading) {
    return (
      <div className="px-5 space-y-3">
        {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
      </div>
    );
  }

  if (!sessions?.length) {
    return (
      <EmptyState
        emoji="🎭"
        title="Sin sesiones todavía"
        description="Usa la rueda para elegir una película y empezar vuestra primera sesión"
      />
    );
  }

  return (
    <div className="px-5 pb-6 space-y-6">
      {inProgress.length > 0 && (
        <Section title="En curso 🍿" sessions={inProgress} groupId={groupId} />
      )}
      {finished.length > 0 && (
        <Section title="Vistas" sessions={finished} groupId={groupId} />
      )}
      {others.length > 0 && (
        <Section title="Otras" sessions={others} groupId={groupId} />
      )}
    </div>
  );
}

function Section({
  title,
  sessions,
  groupId,
}: {
  title: string;
  sessions: CinemaSession[];
  groupId: string;
}) {
  return (
    <div>
      <h2 className="text-sm font-medium text-zinc-500 mb-3">{title}</h2>
      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="space-y-3"
      >
        {sessions.map((session) => (
          <SessionCard key={session.id} session={session} groupId={groupId} />
        ))}
      </motion.div>
    </div>
  );
}
