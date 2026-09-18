'use client';

import { use, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Film } from 'lucide-react';
import { useMovies, useCreateMovie, useUpdateMovie, useDeleteMovie } from '@/hooks/useMovies';
import { useGroupMembers } from '@/hooks/useGroups';
import { useCreateSession, useStartSession } from '@/hooks/useSessions';
import { MovieCard } from '@/components/movies/MovieCard';
import { AddMovieSheet } from '@/components/movies/AddMovieSheet';
import { MovieDetailSheet } from '@/components/movies/MovieDetailSheet';
import { MovieFilters } from '@/components/movies/MovieFilters';
import { StartSessionSheet } from '@/components/sessions/StartSessionSheet';
import { ScheduleSessionSheet } from '@/components/sessions/ScheduleSessionSheet';
import { EmptyState } from '@/components/shared/EmptyState';
import { MovieCardSkeleton } from '@/components/movies/MovieCardSkeleton';
import { ResponsiveSheet } from '@/components/shared/ResponsiveSheet';
import { Button } from '@/components/ui/button';
import { staggerContainer } from '@/lib/animations';
import { useFilterStore } from '@/stores/filterStore';
import { Movie } from '@/types';
import { toast } from 'sonner';

interface Props {
  params: Promise<{ groupId: string }>;
}

export default function MoviesPage({ params }: Props) {
  const { groupId } = use(params);
  const router = useRouter();

  const [showAdd, setShowAdd] = useState(false);
  const [editMovie, setEditMovie] = useState<Movie | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Movie | null>(null);
  const [watchNowMovie, setWatchNowMovie] = useState<Movie | null>(null);
  const [scheduleMovie, setScheduleMovie] = useState<Movie | null>(null);
  const [detailMovie, setDetailMovie] = useState<Movie | null>(null);

  const [searchQuery, setSearchQuery] = useState('');

  const filtersRaw = useFilterStore((s) => s.filters[groupId]);
  const filters = filtersRaw ?? {};
  const setFilters = useFilterStore((s) => s.setFilters);

  const { data: movies, isLoading } = useMovies(groupId, { ...filters, status: 'pending' });

  const filteredMovies = useMemo(() => {
    if (!searchQuery.trim()) return movies ?? [];
    const q = searchQuery.toLowerCase();
    return (movies ?? []).filter((m) => m.title.toLowerCase().includes(q));
  }, [movies, searchQuery]);

  const { data: members } = useGroupMembers(groupId);
  const createMovie = useCreateMovie(groupId);
  const updateMovie = useUpdateMovie(groupId);
  const deleteMovie = useDeleteMovie(groupId);
  const createSession = useCreateSession(groupId);
  const startSession = useStartSession(groupId);

  const handleAdd = async (data: {
    title: string;
    duration_minutes: number;
    platform: string;
    genre: string;
    notes?: string;
  }) => {
    if (editMovie) {
      await updateMovie.mutateAsync({ id: editMovie.id, data });
      setEditMovie(null);
    } else {
      await createMovie.mutateAsync(data);
    }
    setShowAdd(false);
  };

  const handleEdit = (movie: Movie) => {
    setEditMovie(movie);
    setShowAdd(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteMovie.mutateAsync(deleteTarget.id);
    setDeleteTarget(null);
  };

  const handleClose = () => {
    setShowAdd(false);
    setEditMovie(null);
  };

  const handleWatchNow = (movie: Movie) => {
    setWatchNowMovie(movie);
  };

  const handleStartSession = async (participantIds: string[]) => {
    if (!watchNowMovie) return;
    try {
      const sessionRes = await createSession.mutateAsync({
        movie_id: watchNowMovie.id,
        participant_ids: participantIds,
      });
      const session = sessionRes.data.data;
      await startSession.mutateAsync(session.id);
      setWatchNowMovie(null);
      router.push(`/groups/${groupId}/sessions/${session.id}`);
    } catch {
      toast.error('Error al iniciar la sesión');
    }
  };

  const handleScheduleSession = async (participantIds: string[], scheduledAt: string) => {
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
    <div className="px-5 pb-28 lg:px-8">

      {/* Search + Filters unified toolbar */}
      <MovieFilters
        filters={filters}
        onChange={(f) => setFilters(groupId, f)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onAddMovie={() => setShowAdd(true)}
      />

      <div className="mt-3">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => <MovieCardSkeleton key={i} />)}
          </div>
        ) : !filteredMovies.length ? (
          <EmptyState
            icon={<Film size={30} />}
            title={
              searchQuery
                ? 'Sin resultados'
                : Object.keys(filters).length > 0
                ? 'Sin resultados con estos filtros'
                : 'Nada pendiente por ver'
            }
            description={
              searchQuery
                ? `No hay películas que coincidan con "${searchQuery}"`
                : Object.keys(filters).length > 0
                ? 'Prueba ajustando los filtros o borrándolos'
                : 'Añade la primera película al grupo y empieza la lista.'
            }
          />
        ) : (
          <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="space-y-3 lg:space-y-0 lg:grid lg:grid-cols-[repeat(auto-fill,380px)] lg:gap-4 lg:items-start"
          >
            <AnimatePresence mode="popLayout">
              {filteredMovies.map((movie) => (
                <MovieCard
                  key={movie.id}
                  movie={movie}
                  onTap={setDetailMovie}
                  onEdit={handleEdit}
                  onDelete={setDeleteTarget}
                  onWatchNow={handleWatchNow}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      <AddMovieSheet
        open={showAdd}
        onClose={handleClose}
        onSubmit={handleAdd}
        loading={createMovie.isPending || updateMovie.isPending}
        editMovie={editMovie}
      />

      <MovieDetailSheet
        movie={detailMovie}
        onClose={() => setDetailMovie(null)}
        onWatchNow={handleWatchNow}
        onSchedule={(movie) => { setDetailMovie(null); setScheduleMovie(movie); }}
        onEdit={handleEdit}
        onDelete={setDeleteTarget}
      />

      {/* Ver ahora sheet */}
      <StartSessionSheet
        open={!!watchNowMovie}
        onClose={() => setWatchNowMovie(null)}
        movie={watchNowMovie}
        members={members?.map((m) => m.user) ?? []}
        onStart={handleStartSession}
        loading={createSession.isPending || startSession.isPending}
      />

      {/* Programar sheet */}
      <ScheduleSessionSheet
        open={!!scheduleMovie}
        onClose={() => setScheduleMovie(null)}
        movie={scheduleMovie}
        members={members?.map((m) => m.user) ?? []}
        onSchedule={handleScheduleSession}
        loading={createSession.isPending}
      />

      {/* Delete confirm sheet */}
      <ResponsiveSheet open={!!deleteTarget} onClose={() => setDeleteTarget(null)} size="sm">
        {deleteTarget && (
          <div className="px-6 pb-[max(env(safe-area-inset-bottom),24px)] lg:pb-8">
            <div className="flex flex-col items-center text-center mb-6 pt-2">
              <div className="w-14 h-14 rounded-2xl bg-red-500/10 flex items-center justify-center mb-4">
                <Trash2 size={22} className="text-red-400" />
              </div>
              <h2 className="text-white font-bold text-xl">Eliminar película</h2>
              <p className="text-zinc-400 text-sm mt-2 leading-relaxed max-w-xs">
                «{deleteTarget.title}» se eliminará de la lista permanentemente.
              </p>
            </div>
            <div className="space-y-3">
              <Button
                onClick={handleDelete}
                disabled={deleteMovie.isPending}
                className="w-full h-12 rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold"
              >
                {deleteMovie.isPending ? 'Eliminando...' : 'Sí, eliminar'}
              </Button>
              <Button
                onClick={() => setDeleteTarget(null)}
                variant="ghost"
                className="w-full h-12 rounded-xl text-zinc-400"
              >
                Cancelar
              </Button>
            </div>
          </div>
        )}
      </ResponsiveSheet>
    </div>
  );
}
