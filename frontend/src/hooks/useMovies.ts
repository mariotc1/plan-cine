'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { moviesApi, tmdbApi } from '@/lib/api';
import { Movie } from '@/types';
import { toast } from 'sonner';

interface MovieFilters {
  status?: string;
  platform?: string;
  genre?: string;
  max_duration?: number;
}

export function useMovies(groupId: string, filters?: MovieFilters) {
  return useQuery<Movie[]>({
    queryKey: ['groups', groupId, 'movies', filters],
    queryFn: async () => {
      const res = await moviesApi.list(groupId, filters);
      return res.data.data;
    },
    enabled: !!groupId,
  });
}

export function useRandomMovie(groupId: string) {
  return useMutation({
    mutationFn: () => moviesApi.random(groupId),
  });
}

export function useCreateMovie(groupId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      title: string;
      duration_minutes: number;
      platform: string;
      genre: string;
      tmdb_id?: number;
      poster_path?: string;
    }) => moviesApi.create(groupId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['groups', groupId, 'movies'] });
      toast.success('Película añadida');
    },
    onError: () => toast.error('Error al añadir la película'),
  });
}

export function useUpdateMovie(groupId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: object }) => moviesApi.update(groupId, id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['groups', groupId, 'movies'] });
      toast.success('Película actualizada');
    },
    onError: () => toast.error('Error al actualizar la película'),
  });
}

export function useDeleteMovie(groupId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => moviesApi.delete(groupId, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['groups', groupId, 'movies'] });
      toast.success('Película eliminada');
    },
  });
}

export function useEnrichMovies(groupId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => tmdbApi.enrich(groupId),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['groups', groupId, 'movies'] });
      const { updated, total } = res.data;
      if (updated > 0) {
        toast.success(`${updated} de ${total} películas actualizadas con portada`);
      } else {
        toast.info('No se encontraron coincidencias en TMDB');
      }
    },
    onError: () => toast.error('Error al obtener portadas'),
  });
}
