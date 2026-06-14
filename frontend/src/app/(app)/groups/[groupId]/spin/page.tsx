'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { SpinWheel } from '@/components/spin/SpinWheel';
import { StartSessionSheet } from '@/components/sessions/StartSessionSheet';
import { useMovies, useRandomMovie } from '@/hooks/useMovies';
import { useGroupMembers } from '@/hooks/useGroups';
import { useCreateSession, useStartSession } from '@/hooks/useSessions';
import { Movie } from '@/types';
import { toast } from 'sonner';

interface Props {
  params: Promise<{ groupId: string }>;
}

export default function SpinPage({ params }: Props) {
  const { groupId } = use(params);
  const router = useRouter();
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [showStart, setShowStart] = useState(false);

  const { data: movies } = useMovies(groupId, { status: 'pending' });
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

  const handleWatch = (movie: Movie) => {
    setSelectedMovie(movie);
    setShowStart(true);
  };

  const handleStart = async (participantIds: string[]) => {
    if (!selectedMovie) return;
    try {
      const sessionRes = await createSession.mutateAsync({
        movie_id: selectedMovie.id,
        participant_ids: participantIds,
      });
      const session = sessionRes.data.data;
      await startSession.mutateAsync(session.id);
      setShowStart(false);
      router.push(`/groups/${groupId}/sessions/${session.id}`);
    } catch {
      toast.error('Error al iniciar la sesión');
    }
  };

  return (
    <div>
      <SpinWheel
        movies={movies ?? []}
        onSpin={handleSpin}
        onWatch={handleWatch}
      />

      <StartSessionSheet
        open={showStart}
        onClose={() => setShowStart(false)}
        movie={selectedMovie}
        members={members?.map((m) => m.user) ?? []}
        onStart={handleStart}
        loading={createSession.isPending || startSession.isPending}
      />
    </div>
  );
}
