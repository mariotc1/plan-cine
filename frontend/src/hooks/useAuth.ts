'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { authApi, userApi } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'sonner';

export function useAuth() {
  const { user, isAuthenticated, setAuth, setUser, logout: storeLogout } = useAuthStore();
  const router = useRouter();

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await authApi.login({ email, password });
      setAuth(res.data.data, res.data.token);
      router.push('/groups');
    },
    [setAuth, router]
  );

  const register = useCallback(
    async (data: {
      name: string;
      email: string;
      password: string;
      password_confirmation: string;
      avatar?: string;
      color?: string;
    }) => {
      const res = await authApi.register(data);
      setAuth(res.data.data, res.data.token);
      router.push('/groups');
    },
    [setAuth, router]
  );

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {}
    storeLogout();
    router.push('/login');
  }, [storeLogout, router]);

  const updateProfile = useCallback(
    async (data: { name?: string; avatar?: string; color?: string }) => {
      const res = await userApi.updateProfile(data);
      setUser(res.data.data);
      toast.success('Perfil actualizado');
    },
    [setUser]
  );

  return { user, isAuthenticated, login, register, logout, updateProfile };
}
