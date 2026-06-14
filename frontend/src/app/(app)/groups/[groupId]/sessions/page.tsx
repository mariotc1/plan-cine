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

  if (isLoading) {
    return (
      <div className="px-5 space-y-3">
        {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
      </div>
    );
  }

  if (!inProgress.length && !finished.length) {
    return (
      <EmptyState
        emoji="🎭"
        title="Sin sesiones todavía"
        description="Usa la ruleta para elegir una película y empezar vuestra primera sesión"
      />
    );
  }

  return (
    <div className="px-5 pb-8 space-y-6">
      {inProgress.length > 0 && (
        <Section title="Viendo ahora" sessions={inProgress} groupId={groupId} highlight />
      )}
      {finished.length > 0 && (
        <Section title="Vistas" sessions={finished} groupId={groupId} />
      )}
    </div>
  );
}

function Section({
  title,
  sessions,
  groupId,
  highlight,
}: {
  title: string;
  sessions: CinemaSession[];
  groupId: string;
  highlight?: boolean;
}) {
  return (
    <div>
      <h2 className={cn('text-xs font-semibold uppercase tracking-wider mb-3', highlight ? 'text-emerald-400' : 'text-zinc-500')}>
        {title}
      </h2>
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

// cn imported inline to avoid extra import line
function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(' ');
}
