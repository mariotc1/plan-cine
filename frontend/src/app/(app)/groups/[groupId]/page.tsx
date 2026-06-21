'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2 } from 'lucide-react';
import { useMovies, useCreateMovie, useUpdateMovie, useDeleteMovie } from '@/hooks/useMovies';
import { useGroupMembers } from '@/hooks/useGroups';
import { useCreateSession, useStartSession } from '@/hooks/useSessions';
import { MovieCard } from '@/components/movies/MovieCard';
import { AddMovieSheet } from '@/components/movies/AddMovieSheet';
import { MovieFilters } from '@/components/movies/MovieFilters';
import { StartSessionSheet } from '@/components/sessions/StartSessionSheet';
import { EmptyState } from '@/components/shared/EmptyState';
import { SkeletonCard } from '@/components/shared/LoadingSpinner';
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

  const filtersRaw = useFilterStore((s) => s.filters[groupId]);
  const filters = filtersRaw ?? {};
  const setFilters = useFilterStore((s) => s.setFilters);

  const { data: movies, isLoading } = useMovies(groupId, { ...filters, status: 'pending' });
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

  return (
    <div className="px-5 pb-28">
      {/* Filters */}
      <MovieFilters
        filters={filters}
        onChange={(f) => setFilters(groupId, f)}
      />

      <div className="mt-5">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
          </div>
        ) : !movies?.length ? (
          <EmptyState
            emoji="🍿"
            title={Object.keys(filters).length > 0 ? 'Sin resultados' : 'Sin películas pendientes'}
            description={
              Object.keys(filters).length > 0
                ? 'Prueba a cambiar los filtros'
                : 'Añade la primera película a la lista'
            }
          />
        ) : (
          <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="space-y-3"
          >
            <AnimatePresence mode="popLayout">
              {movies.map((movie) => (
                <MovieCard
                  key={movie.id}
                  movie={movie}
                  onEdit={handleEdit}
                  onDelete={setDeleteTarget}
                  onWatchNow={handleWatchNow}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      {/* FAB */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => setShowAdd(true)}
        className="fixed bottom-24 right-5 w-14 h-14 bg-indigo-500 hover:bg-indigo-600 rounded-full flex items-center justify-center shadow-[0_8px_30px_-4px_rgba(99,102,241,0.6)] z-40 transition-colors sm:right-[max(1.25rem,calc(50%-240px+1.25rem))]"
      >
        <Plus size={24} className="text-white" />
      </motion.button>

      <AddMovieSheet
        open={showAdd}
        onClose={handleClose}
        onSubmit={handleAdd}
        loading={createMovie.isPending || updateMovie.isPending}
        editMovie={editMovie}
      />

      {/* Watch Now — start session sheet */}
      <StartSessionSheet
        open={!!watchNowMovie}
        onClose={() => setWatchNowMovie(null)}
        movie={watchNowMovie}
        members={members?.map((m) => m.user) ?? []}
        onStart={handleStartSession}
        loading={createSession.isPending || startSession.isPending}
      />

      {/* Delete confirm sheet */}
      <AnimatePresence>
        {deleteTarget && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 z-[60] backdrop-blur-sm"
              onClick={() => setDeleteTarget(null)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 32 }}
              className="fixed bottom-0 left-0 right-0 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 sm:w-[480px] z-[61] bg-zinc-950 border-t border-white/10 rounded-t-3xl px-6 pb-[max(env(safe-area-inset-bottom),24px)]"
            >
              <div className="flex justify-center pt-3 pb-4">
                <div className="w-10 h-1 bg-white/20 rounded-full" />
              </div>
              <div className="flex flex-col items-center text-center mb-6">
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
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
