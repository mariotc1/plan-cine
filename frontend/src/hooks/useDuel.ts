'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { duelsApi } from '@/lib/api';
import { Duel } from '@/types';

function duelKey(groupId: string) {
  return ['duel', groupId, 'active'];
}

export function useActiveDuel(groupId: string, enabled = true) {
  return useQuery<Duel | null>({
    queryKey: duelKey(groupId),
    queryFn: async () => {
      try {
        const res = await duelsApi.getActive(groupId);
        return res.data.data ?? null;
      } catch (e: unknown) {
        if ((e as { response?: { status?: number } }).response?.status === 404) return null;
        throw e;
      }
    },
    enabled,
    refetchInterval: (query) => {
      const data = query.state.data;
      if (!data) return false;
      if (data.status === 'voting' || data.status === 'tie') return 4000;
      return false;
    },
    staleTime: 0,
  });
}

export function useCreateDuel(groupId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => duelsApi.create(groupId),
    onSuccess: (res) => {
      qc.setQueryData(duelKey(groupId), res.data.data);
    },
  });
}

export function useVoteDuel(groupId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ duelId, movieId }: { duelId: string; movieId: string }) =>
      duelsApi.vote(groupId, duelId, movieId),
    onSuccess: (res) => {
      qc.setQueryData(duelKey(groupId), res.data.data);
    },
  });
}

export function useCloseDuel(groupId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (duelId: string) => duelsApi.close(groupId, duelId),
    onSuccess: (res) => {
      qc.setQueryData(duelKey(groupId), res.data.data);
    },
  });
}

export function useResolveDuel(groupId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ duelId, action }: { duelId: string; action: 'revote' | 'random' }) =>
      duelsApi.resolve(groupId, duelId, action),
    onSuccess: (res) => {
      qc.setQueryData(duelKey(groupId), res.data.data);
    },
  });
}

export function useCancelDuel(groupId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (duelId: string) => duelsApi.cancel(groupId, duelId),
    onSuccess: () => {
      qc.setQueryData(duelKey(groupId), null);
    },
  });
}
