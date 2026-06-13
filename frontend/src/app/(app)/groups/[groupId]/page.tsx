'use client';

import { use, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus } from 'lucide-react';
import { useMovies, useCreateMovie, useUpdateMovie, useDeleteMovie } from '@/hooks/useMovies';
import { MovieCard } from '@/components/movies/MovieCard';
import { AddMovieSheet } from '@/components/movies/AddMovieSheet';
import { MovieFilters } from '@/components/movies/MovieFilters';
import { EmptyState } from '@/components/shared/EmptyState';
import { LoadingSpinner, SkeletonCard } from '@/components/shared/LoadingSpinner';
import { staggerContainer } from '@/lib/animations';
import { Movie } from '@/types';

interface Filters {
  platform?: string;
  genre?: string;
  max_duration?: number;
}

interface Props {
  params: Promise<{ groupId: string }>;
}

export default function MoviesPage({ params }: Props) {
  const { groupId } = use(params);
  const [showAdd, setShowAdd] = useState(false);
  const [editMovie, setEditMovie] = useState<Movie | null>(null);
  const [filters, setFilters] = useState<Filters>({});

  const { data: movies, isLoading } = useMovies(groupId, { ...filters, status: 'pending' });
  const createMovie = useCreateMovie(groupId);
  const updateMovie = useUpdateMovie(groupId);
  const deleteMovie = useDeleteMovie(groupId);

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

  const handleDelete = async (movie: Movie) => {
    if (confirm(`¿Eliminar "${movie.title}"?`)) {
      await deleteMovie.mutateAsync(movie.id);
    }
  };

  const handleClose = () => {
    setShowAdd(false);
    setEditMovie(null);
  };

  return (
    <div className="px-5 pb-6">
      {/* Filters */}
      <MovieFilters filters={filters} onChange={setFilters} />

      <div className="mt-4">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
          </div>
        ) : !movies?.length ? (
          <EmptyState
            emoji="🍿"
            title="Sin películas pendientes"
            description="Añade la primera película a la lista"
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
                  onDelete={handleDelete}
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
        className="fixed bottom-24 right-5 w-14 h-14 bg-indigo-500 hover:bg-indigo-600 rounded-full flex items-center justify-center shadow-[0_8px_30px_-4px_rgba(99,102,241,0.6)] z-40 transition-colors"
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
    </div>
  );
}
