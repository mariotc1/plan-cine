'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { statsApi } from '@/lib/api';
import { PersonalStats } from '@/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { COLORS, getPlatform, getGenre } from '@/lib/constants';
import { AvatarPicker } from '@/components/ui/AvatarPicker';
import { PlatformLogo } from '@/components/ui/PlatformLogo';
import { ResponsiveSheet } from '@/components/shared/ResponsiveSheet';
import { cn } from '@/lib/utils';
import { LogOut, Pencil } from 'lucide-react';
import { staggerContainer, staggerItem } from '@/lib/animations';

export default function ProfilePage() {
  const { user, logout, updateProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name ?? '');
  const [avatar, setAvatar] = useState(user?.avatar ?? '🎬');
  const [color, setColor] = useState(user?.color ?? '#6366f1');
  const [saving, setSaving] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const { data: stats } = useQuery<PersonalStats>({
    queryKey: ['personal-stats'],
    queryFn: async () => {
      const res = await statsApi.personal();
      return res.data.data;
    },
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProfile({ name, avatar, color });
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setName(user?.name ?? '');
    setAvatar(user?.avatar ?? '🎬');
    setColor(user?.color ?? '#6366f1');
    setEditing(false);
  };

  if (!user) return null;

  const platform = stats?.favorite_platform ? getPlatform(stats.favorite_platform) : null;
  const genre = stats?.favorite_genre ? getGenre(stats.favorite_genre) : null;

  const logoutButton = (
    <button
      onClick={() => setShowLogoutConfirm(true)}
      className="w-full flex items-center justify-center gap-2 h-12 rounded-xl bg-red-500/[0.07] border border-red-500/20 text-red-400 hover:bg-red-500/[0.12] transition-colors text-sm font-medium"
    >
      <LogOut size={15} />
      Cerrar sesión
    </button>
  );

  return (
    <div className="px-5 pb-8 lg:px-8 lg:pb-12" style={{ paddingTop: 'max(env(safe-area-inset-top), 16px)' }}>
      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="space-y-5 lg:space-y-8 lg:max-w-2xl"
      >

        {/* Avatar + identity — stacked on mobile, horizontal row on desktop */}
        <motion.div variants={staggerItem} className="flex flex-col items-center pt-2 lg:flex-row lg:items-center lg:gap-5 lg:pt-0">
          <div className="relative">
            <div
              className="w-24 h-24 rounded-3xl flex items-center justify-center text-5xl"
              style={{ backgroundColor: `${user.color}25`, boxShadow: `0 0 0 2px ${user.color}35` }}
            >
              {user.avatar}
            </div>
            <button
              onClick={() => { setEditing(true); setName(user.name); setAvatar(user.avatar); setColor(user.color); }}
              aria-label="Editar perfil"
              className="absolute -bottom-1.5 -right-1.5 w-7 h-7 bg-indigo-500 rounded-full flex items-center justify-center shadow-lg border-2 border-zinc-950"
            >
              <Pencil size={11} className="text-white" />
            </button>
          </div>
          <div className="text-center mt-4 lg:text-left lg:mt-0">
            <h2 className="text-xl font-bold text-white lg:text-2xl">{user.name}</h2>
            <p className="text-sm text-zinc-600 mt-0.5">{user.email}</p>
          </div>
        </motion.div>

        {/* Stats — below the identity, contained width so cards stay a sensible size */}
        {stats && (
          <motion.div variants={staggerItem} className="space-y-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-600">Mis estadísticas</p>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="bg-zinc-900 rounded-2xl border border-white/5 p-4 lg:p-5 flex flex-col">
                <p className="text-3xl font-bold text-white tracking-tight leading-none">{stats.movies_watched}</p>
                <p className="text-xs text-zinc-500 mt-2">películas vistas</p>
              </div>
              <div className="bg-zinc-900 rounded-2xl border border-white/5 p-4 lg:p-5 flex flex-col">
                <p className="text-3xl font-bold text-white tracking-tight leading-none">
                  {stats.hours_accumulated}<span className="text-lg text-zinc-500 ml-0.5">h</span>
                </p>
                <p className="text-xs text-zinc-500 mt-2">de cine acumuladas</p>
              </div>
              <div className="bg-zinc-900 rounded-2xl border border-white/5 p-4 lg:p-5 flex flex-col">
                <p className="text-3xl font-bold text-white tracking-tight leading-none">
                  {stats.average_score ?? '—'}
                </p>
                <p className="text-xs text-zinc-500 mt-2">nota media</p>
              </div>
              <div className="bg-zinc-900 rounded-2xl border border-white/5 p-4 lg:p-5 flex flex-col">
                <p className="text-3xl font-bold text-white tracking-tight leading-none">{stats.movies_added}</p>
                <p className="text-xs text-zinc-500 mt-2">pelis propuestas</p>
              </div>
            </div>

            <div className="bg-zinc-900 rounded-2xl border border-white/5 divide-y divide-white/[0.04]">
              <StatRow
                emoji={genre?.emoji ?? '🎭'}
                label="Género favorito"
                value={genre?.label ?? '—'}
              />
              <StatRow
                emoji="📺"
                logo={platform ? <PlatformLogo platform={stats.favorite_platform!} size={16} color={platform.color} /> : undefined}
                label="Plataforma favorita"
                value={platform?.label ?? '—'}
              />
            </div>
          </motion.div>
        )}

        {/* Logout — always last, bottom of the page */}
        <motion.div variants={staggerItem}>
          {logoutButton}
        </motion.div>

      </motion.div>

      {/* Edit sheet */}
      <ResponsiveSheet open={editing} onClose={handleCancel} size="md">
        <div className="px-5 pb-[max(env(safe-area-inset-bottom),28px)] lg:pb-8">
          {/* Profile preview header */}
          <div className="flex items-center gap-4 mb-6 lg:pr-8">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-4xl flex-shrink-0 transition-all duration-200"
              style={{ backgroundColor: `${color}28` }}
            >
              {avatar}
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-600 mb-1">Editar perfil</p>
              <p className="text-white font-bold text-xl leading-tight truncate">{name || 'Tu nombre'}</p>
            </div>
          </div>

          <div className="space-y-5 overflow-y-auto" style={{ maxHeight: 'calc(100svh - 260px)' }}>
            <div className="space-y-2">
              <Label className="text-zinc-400 text-xs uppercase tracking-wider">Nombre</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-white/[0.04] border-white/[0.08] text-white rounded-xl h-11"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-zinc-400 text-xs uppercase tracking-wider">Avatar</Label>
              <AvatarPicker value={avatar} onChange={setAvatar} color={color} />
            </div>

            <div className="space-y-2">
              <Label className="text-zinc-400 text-xs uppercase tracking-wider">Color</Label>
              <div className="grid grid-cols-6 gap-2 p-1">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={cn(
                      'w-full aspect-square rounded-full transition-transform',
                      color === c ? 'ring-2 ring-white ring-offset-2 ring-offset-zinc-950' : 'hover:scale-105'
                    )}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="pt-5">
            <Button
              onClick={handleSave}
              disabled={saving || !name.trim()}
              className="w-full h-12 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-semibold"
            >
              {saving ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        </div>
      </ResponsiveSheet>

      {/* Logout confirm sheet */}
      <ResponsiveSheet open={showLogoutConfirm} onClose={() => setShowLogoutConfirm(false)} size="sm">
        <div className="px-6 pb-[max(env(safe-area-inset-bottom),24px)] lg:pb-8">
          <div className="flex flex-col items-center text-center mb-7 pt-2">
            <div className="w-14 h-14 rounded-2xl bg-zinc-800 flex items-center justify-center mb-4">
              <LogOut size={22} className="text-zinc-300" />
            </div>
            <h2 className="text-white font-bold text-xl">¿Cerrar sesión?</h2>
            <p className="text-zinc-500 text-sm mt-2 leading-relaxed">
              Tendrás que volver a iniciar sesión para acceder a Plan Cine.
            </p>
          </div>
          <div className="space-y-3">
            <Button
              onClick={logout}
              className="w-full h-12 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-semibold"
            >
              Sí, cerrar sesión
            </Button>
            <Button
              onClick={() => setShowLogoutConfirm(false)}
              variant="ghost"
              className="w-full h-12 rounded-xl text-zinc-400 font-medium"
            >
              Cancelar
            </Button>
          </div>
        </div>
      </ResponsiveSheet>
    </div>
  );
}

function StatRow({ emoji, label, value, logo }: { emoji: string; label: string; value: string; logo?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 px-5 py-3.5">
      <span className="min-w-6 flex items-center justify-center flex-shrink-0">
        {logo ?? <span className="text-base">{emoji}</span>}
      </span>
      <span className="flex-1 text-sm text-zinc-400">{label}</span>
      <span className="text-sm font-semibold text-white">{value}</span>
    </div>
  );
}
