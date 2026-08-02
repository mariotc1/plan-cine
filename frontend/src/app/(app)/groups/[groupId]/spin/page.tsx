'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Shuffle, Swords } from 'lucide-react';
import { SpinWheel } from '@/components/spin/SpinWheel';
import { DuelView } from '@/components/spin/DuelView';
import { StartSessionSheet } from '@/components/sessions/StartSessionSheet';
import { ScheduleSessionSheet } from '@/components/sessions/ScheduleSessionSheet';
import { useMovies, useRandomMovie } from '@/hooks/useMovies';
import { useGroupMembers } from '@/hooks/useGroups';
import { useCreateSession, useStartSession } from '@/hooks/useSessions';
import { useFilterStore } from '@/stores/filterStore';
import { useAuthStore } from '@/stores/authStore';
import { Movie } from '@/types';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type Mode = 'ruleta' | 'duelo';

interface Props {
  params: Promise<{ groupId: string }>;
}

export default function SpinPage({ params }: Props) {
  const { groupId } = use(params);
  const router = useRouter();

  const [mode, setMode] = useState<Mode>('ruleta');
  const [watchMovie, setWatchMovie] = useState<Movie | null>(null);
  const [scheduleMovie, setScheduleMovie] = useState<Movie | null>(null);

  const currentUser = useAuthStore((s) => s.user);
  const filtersRaw = useFilterStore((s) => s.filters[groupId]);
  const filters = filtersRaw ?? {};

  const { data: movies } = useMovies(groupId, { ...filters, status: 'pending' });
  const { data: members } = useGroupMembers(groupId);
  const randomMovie = useRandomMovie(groupId);
  const createSession = useCreateSession(groupId);
  const startSession = useStartSession(groupId);

  const isAdmin = members?.some(
    (m) => m.user.id === currentUser?.id && m.role === 'admin'
  ) ?? false;

  const memberUsers = members?.map((m) => m.user) ?? [];

  const handleSpin = async (): Promise<Movie | null> => {
    try {
      const res = await randomMovie.mutateAsync();
      return res.data.data;
    } catch {
      toast.error('No hay películas pendientes');
      return null;
    }
  };

  const handleStartNow = async (participantIds: string[]) => {
    if (!watchMovie) return;
    try {
      const sessionRes = await createSession.mutateAsync({
        movie_id: watchMovie.id,
        participant_ids: participantIds,
      });
      const session = sessionRes.data.data;
      await startSession.mutateAsync(session.id);
      setWatchMovie(null);
      router.push(`/groups/${groupId}/sessions/${session.id}`);
    } catch {
      toast.error('Error al iniciar la sesión');
    }
  };

  const handleSchedule = async (participantIds: string[], scheduledAt: string) => {
    if (!scheduleMovie) return;
    try {
      await createSession.mutateAsync({
        movie_id: scheduleMovie.id,
        participant_ids: participantIds,
        scheduled_at: scheduledAt,
      });
      setScheduleMovie(null);
      toast.success('Sesión programada 📅');
      router.push(`/groups/${groupId}/sessions`);
    } catch {
      toast.error('Error al programar la sesión');
    }
  };

  return (
    <div>
      {/* Mode switcher */}
      <div className="flex gap-2 px-5 pt-1 pb-4">
        <ModeButton
          active={mode === 'ruleta'}
          onClick={() => setMode('ruleta')}
          icon={<Shuffle size={14} />}
          label="Ruleta"
          activeClass="bg-indigo-500/15 border-indigo-500/35 text-indigo-400"
        />
        <ModeButton
          active={mode === 'duelo'}
          onClick={() => setMode('duelo')}
          icon={<Swords size={14} />}
          label="Duelo"
          activeClass="bg-amber-400/15 border-amber-400/35 text-amber-400"
        />
      </div>

      {/* View */}
      <AnimatePresence mode="wait">
        {mode === 'ruleta' ? (
          <motion.div
            key="ruleta"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ type: 'spring', stiffness: 320, damping: 30 }}
          >
            <SpinWheel
              movies={movies ?? []}
              onSpin={handleSpin}
              onWatch={(movie) => setWatchMovie(movie)}
              onSchedule={(movie) => setScheduleMovie(movie)}
            />
          </motion.div>
        ) : (
          <motion.div
            key="duelo"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ type: 'spring', stiffness: 320, damping: 30 }}
          >
            {currentUser && (
              <DuelView
                groupId={groupId}
                currentUserId={currentUser.id}
                isAdmin={isAdmin}
                members={memberUsers}
                onWatch={(movie) => setWatchMovie(movie)}
                onSchedule={(movie) => setScheduleMovie(movie)}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <StartSessionSheet
        open={!!watchMovie}
        onClose={() => setWatchMovie(null)}
        movie={watchMovie}
        members={memberUsers}
        onStart={handleStartNow}
        loading={createSession.isPending || startSession.isPending}
      />

      <ScheduleSessionSheet
        open={!!scheduleMovie}
        onClose={() => setScheduleMovie(null)}
        movie={scheduleMovie}
        members={memberUsers}
        onSchedule={handleSchedule}
        loading={createSession.isPending}
      />
    </div>
  );
}

interface ModeButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  activeClass: string;
}

function ModeButton({ active, onClick, icon, label, activeClass }: ModeButtonProps) {
  return (
    <motion.button
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      className={cn(
        'flex items-center gap-1.5 h-9 px-4 rounded-xl text-[13px] font-semibold transition-all border flex-1 justify-center',
        active
          ? activeClass
          : 'bg-zinc-800/60 border-white/[0.06] text-zinc-500',
      )}
    >
      {icon}
      {label}
    </motion.button>
  );
}
