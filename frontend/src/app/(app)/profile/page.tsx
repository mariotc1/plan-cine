'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { statsApi } from '@/lib/api';
import { PersonalStats } from '@/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { AVATARS, COLORS, getPlatform, getGenre } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { LogOut, Pencil, Check, X } from 'lucide-react';
import { fadeInUp, staggerContainer, staggerItem } from '@/lib/animations';

export default function ProfilePage() {
  const { user, logout, updateProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name ?? '');
  const [avatar, setAvatar] = useState(user?.avatar ?? '🎬');
  const [color, setColor] = useState(user?.color ?? '#6366f1');
  const [saving, setSaving] = useState(false);

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

  return (
    <div className="px-5 pt-14 pb-8">
      <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-6">

        {/* Avatar + name */}
        <motion.div variants={staggerItem} className="flex flex-col items-center pt-4">
          <div
            className="w-20 h-20 rounded-3xl flex items-center justify-center text-4xl mb-4 shadow-lg"
            style={{ backgroundColor: `${color || user.color}30` }}
          >
            {avatar || user.avatar}
          </div>
          {!editing ? (
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white">{user.name}</h2>
              <p className="text-sm text-zinc-500 mt-1">{user.email}</p>
              <button
                onClick={() => setEditing(true)}
                className="flex items-center gap-1.5 mt-3 text-sm text-indigo-400 hover:text-indigo-300 mx-auto"
              >
                <Pencil size={13} /> Editar perfil
              </button>
            </div>
          ) : (
            <div className="w-full max-w-xs space-y-4">
              <div>
                <Label className="text-zinc-400 text-xs mb-2 block">Nombre</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-zinc-900 border-zinc-800 text-white rounded-xl h-11"
                />
              </div>
              <div>
                <Label className="text-zinc-400 text-xs mb-2 block">Avatar</Label>
                <div className="grid grid-cols-8 gap-2">
                  {AVATARS.map((a) => (
                    <button
                      key={a}
                      type="button"
                      onClick={() => setAvatar(a)}
                      className={cn(
                        'aspect-square rounded-xl text-xl flex items-center justify-center transition-all',
                        avatar === a ? 'bg-indigo-500/30 ring-2 ring-indigo-500' : 'bg-zinc-900'
                      )}
                    >
                      {a}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label className="text-zinc-400 text-xs mb-2 block">Color</Label>
                <div className="flex gap-2 flex-wrap">
                  {COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setColor(c)}
                      className={cn(
                        'w-8 h-8 rounded-full transition-transform',
                        color === c ? 'scale-125 ring-2 ring-white ring-offset-2 ring-offset-zinc-950' : ''
                      )}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 h-11 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white"
                >
                  <Check size={16} className="mr-1" /> Guardar
                </Button>
                <Button
                  onClick={handleCancel}
                  variant="outline"
                  className="flex-1 h-11 rounded-xl border-zinc-700 bg-zinc-900 text-zinc-300"
                >
                  <X size={16} className="mr-1" /> Cancelar
                </Button>
              </div>
            </div>
          )}
        </motion.div>

        {/* Personal stats */}
        {stats && (
          <motion.div variants={staggerItem} className="space-y-3">
            <h3 className="text-sm font-medium text-zinc-500">Mis estadísticas</h3>
            <div className="grid grid-cols-2 gap-3">
              <StatCard emoji="🎬" label="Vistas" value={String(stats.movies_watched)} />
              <StatCard emoji="💡" label="Propuestas" value={String(stats.movies_added)} />
              <StatCard emoji="⭐" label="Nota media" value={stats.average_score ? `${stats.average_score}★` : 'N/A'} />
              <StatCard emoji="⏱" label="Horas de cine" value={`${stats.hours_accumulated}h`} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <StatCard
                emoji={genre?.emoji ?? '🎭'}
                label="Género favorito"
                value={genre?.label ?? 'N/A'}
              />
              <StatCard
                emoji={platform?.emoji ?? '📺'}
                label="Plataforma fav."
                value={platform?.label ?? 'N/A'}
              />
            </div>
          </motion.div>
        )}

        {/* Logout */}
        <motion.div variants={staggerItem}>
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 h-12 rounded-xl border border-red-900/50 text-red-400 hover:bg-red-950/20 transition-colors text-sm font-medium"
          >
            <LogOut size={16} /> Cerrar sesión
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
}

function StatCard({ emoji, label, value }: { emoji: string; label: string; value: string }) {
  return (
    <div className="bg-zinc-900 rounded-2xl border border-white/5 p-4">
      <div className="text-xl mb-2">{emoji}</div>
      <p className="text-base font-bold text-white">{value}</p>
      <p className="text-xs text-zinc-500 mt-0.5">{label}</p>
    </div>
  );
}
