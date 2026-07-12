'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { SpinWheel } from '@/components/spin/SpinWheel';
import { StartSessionSheet } from '@/components/sessions/StartSessionSheet';
import { ScheduleSessionSheet } from '@/components/sessions/ScheduleSessionSheet';
import { useMovies, useRandomMovie } from '@/hooks/useMovies';
import { useGroupMembers } from '@/hooks/useGroups';
import { useCreateSession, useStartSession } from '@/hooks/useSessions';
import { useFilterStore } from '@/stores/filterStore';
import { Movie } from '@/types';
import { toast } from 'sonner';

interface Props {
  params: Promise<{ groupId: string }>;
}

export default function SpinPage({ params }: Props) {
  const { groupId } = use(params);
  const router = useRouter();
  const [watchMovie, setWatchMovie] = useState<Movie | null>(null);
  const [scheduleMovie, setScheduleMovie] = useState<Movie | null>(null);

  const filtersRaw = useFilterStore((s) => s.filters[groupId]);
  const filters = filtersRaw ?? {};
  const { data: movies } = useMovies(groupId, { ...filters, status: 'pending' });
  const { data: members } = useGroupMembers(groupId);
  const randomMovie = useRandomMovie(groupId);
  const createSession = useCreateSession(groupId);
  const startSession = useStartSession(groupId);

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
      <SpinWheel
        movies={movies ?? []}
        onSpin={handleSpin}
        onWatch={(movie) => setWatchMovie(movie)}
        onSchedule={(movie) => setScheduleMovie(movie)}
      />

      <StartSessionSheet
        open={!!watchMovie}
        onClose={() => setWatchMovie(null)}
        movie={watchMovie}
        members={members?.map((m) => m.user) ?? []}
        onStart={handleStartNow}
        loading={createSession.isPending || startSession.isPending}
      />

      <ScheduleSessionSheet
        open={!!scheduleMovie}
        onClose={() => setScheduleMovie(null)}
        movie={scheduleMovie}
        members={members?.map((m) => m.user) ?? []}
        onSchedule={handleSchedule}
        loading={createSession.isPending}
      />
    </div>
  );
}
