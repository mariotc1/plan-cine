'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { groupsApi } from '@/lib/api';
import { Group, GroupMember, GroupStats, Memory } from '@/types';
import { toast } from 'sonner';

export function useGroups() {
  return useQuery<Group[]>({
    queryKey: ['groups'],
    queryFn: async () => {
      const res = await groupsApi.list();
      return res.data.data;
    },
  });
}

export function useGroup(id: string) {
  return useQuery<Group>({
    queryKey: ['groups', id],
    queryFn: async () => {
      const res = await groupsApi.get(id);
      return res.data.data;
    },
    enabled: !!id,
  });
}

export function useGroupMembers(id: string) {
  return useQuery<GroupMember[]>({
    queryKey: ['groups', id, 'members'],
    queryFn: async () => {
      const res = await groupsApi.members(id);
      return res.data.data;
    },
    enabled: !!id,
  });
}

export function useGroupStats(id: string) {
  return useQuery<GroupStats>({
    queryKey: ['groups', id, 'stats'],
    queryFn: async () => {
      const res = await groupsApi.stats(id);
      return res.data.data;
    },
    enabled: !!id,
  });
}

export function useGroupMemories(id: string) {
  return useQuery<Memory[]>({
    queryKey: ['groups', id, 'memories'],
    queryFn: async () => {
      const res = await groupsApi.memories(id);
      return res.data.data;
    },
    enabled: !!id,
  });
}

export function useCreateGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; description?: string }) => groupsApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['groups'] });
      toast.success('Grupo creado correctamente');
    },
    onError: () => toast.error('Error al crear el grupo'),
  });
}

export function useJoinGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (code: string) => groupsApi.join(code),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['groups'] });
      toast.success(`Te has unido a ${res.data.data.name}`);
    },
    onError: () => toast.error('Código inválido o ya eres miembro'),
  });
}

export function useLeaveGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => groupsApi.leave(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['groups'] });
      toast.success('Has salido del grupo');
    },
  });
}
