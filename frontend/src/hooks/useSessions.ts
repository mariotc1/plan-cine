'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sessionsApi, ratingsApi } from '@/lib/api';
import { CinemaSession } from '@/types';
import { toast } from 'sonner';

export function useSessions(groupId: string) {
  return useQuery<CinemaSession[]>({
    queryKey: ['groups', groupId, 'sessions'],
    queryFn: async () => {
      const res = await sessionsApi.list(groupId);
      return res.data.data;
    },
    enabled: !!groupId,
  });
}

export function useSession(groupId: string, sessionId: string) {
  return useQuery<CinemaSession>({
    queryKey: ['groups', groupId, 'sessions', sessionId],
    queryFn: async () => {
      const res = await sessionsApi.get(groupId, sessionId);
      return res.data.data;
    },
    enabled: !!groupId && !!sessionId,
  });
}

export function useCreateSession(groupId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { movie_id: string; participant_ids: string[] }) =>
      sessionsApi.create(groupId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['groups', groupId, 'sessions'] });
      qc.invalidateQueries({ queryKey: ['groups', groupId, 'movies'] });
    },
    onError: () => toast.error('Error al crear la sesión'),
  });
}

export function useStartSession(groupId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (sessionId: string) => sessionsApi.start(groupId, sessionId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['groups', groupId, 'sessions'] });
      toast.success('¡Que empiece el cine! 🎬');
    },
  });
}

export function useFinishSession(groupId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (sessionId: string) => sessionsApi.finish(groupId, sessionId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['groups', groupId, 'sessions'] });
      qc.invalidateQueries({ queryKey: ['groups', groupId, 'movies'] });
      toast.success('¡Película finalizada! ¿Qué os ha parecido?');
    },
  });
}

export function useCancelSession(groupId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (sessionId: string) => sessionsApi.cancel(groupId, sessionId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['groups', groupId, 'sessions'] });
      qc.invalidateQueries({ queryKey: ['groups', groupId, 'movies'] });
      toast.success('Sesión cancelada');
    },
  });
}

export function useReturnToPending(groupId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (sessionId: string) => sessionsApi.returnToPending(groupId, sessionId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['groups', groupId, 'sessions'] });
      qc.invalidateQueries({ queryKey: ['groups', groupId, 'movies'] });
      toast.success('Película devuelta a pendientes');
    },
  });
}

export function useRateSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ sessionId, score }: { sessionId: string; score: number }) =>
      ratingsApi.rate(sessionId, score),
    onSuccess: (_, { sessionId }) => {
      qc.invalidateQueries({ queryKey: ['sessions', sessionId] });
      toast.success('¡Valoración guardada! ⭐');
    },
  });
}
