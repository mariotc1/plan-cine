'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Users, Link2, ChevronRight, Film, Clock } from 'lucide-react';
import { useGroups, useCreateGroup, useJoinGroup } from '@/hooks/useGroups';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { staggerContainer, staggerItem } from '@/lib/animations';
import { Group } from '@/types';
import { cn } from '@/lib/utils';

const GROUP_EMOJIS = [
  '🏠', '👨‍👩‍👧‍👦', '🎬', '🍿', '🎮', '🌙',
  '🎭', '🌟', '🎉', '🏆', '❤️', '🔥',
  '🎵', '🌈', '🐶', '🏖️', '🎲', '🚀',
];

export default function GroupsPage() {
  const { data: groups, isLoading } = useGroups();
  const createGroup = useCreateGroup();
  const joinGroup = useJoinGroup();

  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [avatar, setAvatar] = useState('🏠');
  const [joinCode, setJoinCode] = useState('');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createGroup.mutateAsync({ name, description, avatar });
      setShowCreate(false);
      setName('');
      setDescription('');
      setAvatar('🏠');
    } catch {}
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await joinGroup.mutateAsync(joinCode.trim().toUpperCase());
      setShowJoin(false);
      setJoinCode('');
    } catch {}
  };

  const closeCreate = () => { setShowCreate(false); setName(''); setDescription(''); setAvatar('🏠'); };
  const closeJoin = () => { setShowJoin(false); setJoinCode(''); };

  return (
    <div className="min-h-screen">
      <PageHeader
        title="Plan Cine"
        subtitle="Tus grupos"
        action={
          <div className="flex gap-2">
            <motion.button
              whileTap={{ scale: 0.88 }}
              onClick={() => setShowJoin(true)}
              className="w-9 h-9 rounded-full bg-white/[0.07] border border-white/[0.08] flex items-center justify-center text-zinc-300"
            >
              <Link2 size={16} />
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.88 }}
              onClick={() => setShowCreate(true)}
              className="w-9 h-9 rounded-full bg-indigo-500 flex items-center justify-center text-white shadow-[0_4px_14px_-2px_rgba(99,102,241,0.55)]"
            >
              <Plus size={18} />
            </motion.button>
          </div>
        }
      />

      <div className="px-5 pb-8">
        {isLoading ? (
          <LoadingSpinner />
        ) : !groups?.length ? (
          <EmptyState
            icon={<Users size={30} />}
            title="Sin grupos todavía"
            description="Crea un grupo o únete con un código de invitación"
            action={
              <div className="flex flex-col gap-3 w-full max-w-xs">
                <Button
                  onClick={() => setShowCreate(true)}
                  className="w-full h-12 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-semibold"
                >
                  <Plus size={16} className="mr-2" /> Crear grupo
                </Button>
                <Button
                  onClick={() => setShowJoin(true)}
                  variant="outline"
                  className="w-full h-12 rounded-xl border-zinc-700 bg-zinc-900 text-zinc-200 hover:bg-zinc-800"
                >
                  <Link2 size={16} className="mr-2" /> Unirme con código
                </Button>
              </div>
            }
          />
        ) : (
          <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="space-y-3"
          >
            <AnimatePresence>
              {groups.map((group: Group) => (
                <motion.div key={group.id} variants={staggerItem} whileTap={{ scale: 0.983 }}>
                  <Link href={`/groups/${group.id}`}>
                    <div className="relative bg-zinc-900 rounded-2xl border border-white/[0.07] overflow-hidden">
                      {/* Top highlight line */}
                      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.12] to-transparent" />

                      {/* Main content */}
                      <div className="flex items-center gap-4 px-5 pt-5 pb-4">
                        <div
                          className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0"
                          style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.18) 0%, rgba(99,102,241,0.05) 100%)' }}
                        >
                          {group.avatar || '🎬'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-white text-[17px] tracking-tight truncate">{group.name}</h3>
                          {group.description && (
                            <p className="text-[13px] text-zinc-500 truncate mt-0.5">{group.description}</p>
                          )}
                        </div>
                        <ChevronRight size={15} className="text-zinc-700 flex-shrink-0" />
                      </div>

                      {/* Stats bar */}
                      <div className="flex items-center justify-center gap-4 px-5 py-3 border-t border-white/[0.05]">
                        <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                          <Users size={11} className="text-zinc-600" />
                          <span>{group.member_count} miembro{group.member_count !== 1 ? 's' : ''}</span>
                        </div>
                        <div className="w-px h-3 bg-white/10" />
                        <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                          <Film size={11} className="text-zinc-600" />
                          <span>{group.pending_movies_count} por ver</span>
                        </div>
                        {group.total_hours_watched > 0 && (
                          <>
                            <div className="w-px h-3 bg-white/10" />
                            <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                              <Clock size={11} className="text-zinc-600" />
                              <span>{group.total_hours_watched}h {group.member_count > 1 ? 'juntos' : 'vistas'}</span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      {/* ── Create Group Sheet ── */}
      <AnimatePresence>
        {showCreate && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 z-[60] backdrop-blur-sm"
              onClick={closeCreate}
            />
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 32 }}
              className="fixed bottom-0 left-0 right-0 z-[61] bg-zinc-950 border-t border-white/10 rounded-t-3xl flex flex-col"
              style={{ maxHeight: '88vh' }}
            >
              {/* Handle */}
              <div className="flex-shrink-0 flex justify-center pt-3 pb-4">
                <div className="w-10 h-1 bg-white/20 rounded-full" />
              </div>

              {/* Integrated preview header */}
              <div className="flex-shrink-0 flex items-center gap-4 px-5 mb-5">
                <div className="w-16 h-16 rounded-2xl bg-white/[0.07] border border-white/[0.08] flex items-center justify-center text-4xl flex-shrink-0 transition-all duration-200">
                  {avatar}
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-600 mb-1">Nuevo grupo</p>
                  <p className="text-white font-bold text-xl leading-tight truncate">{name || 'Nombre del grupo'}</p>
                  {(description) && (
                    <p className="text-zinc-500 text-sm truncate mt-0.5">{description}</p>
                  )}
                </div>
              </div>

              {/* Scrollable content */}
              <form
                id="create-group-form"
                onSubmit={handleCreate}
                className="flex-1 overflow-y-auto px-5 space-y-5 pb-4"
              >
                <div className="space-y-2">
                  <Label className="text-zinc-400 text-xs uppercase tracking-wider">Icono</Label>
                  <div className="grid grid-cols-6 gap-2 p-1">
                    {GROUP_EMOJIS.map((e) => (
                      <button
                        key={e}
                        type="button"
                        onClick={() => setAvatar(e)}
                        className={cn(
                          'aspect-square rounded-xl text-2xl flex items-center justify-center transition-all',
                          avatar === e
                            ? 'bg-indigo-500/25 ring-2 ring-indigo-500'
                            : 'bg-white/5 hover:bg-white/10'
                        )}
                      >
                        {e}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-zinc-400 text-xs uppercase tracking-wider">Nombre</Label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Mi grupo de cine"
                    className="bg-white/[0.04] border-white/[0.08] text-white placeholder:text-zinc-600 rounded-xl h-12"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-zinc-400 text-xs uppercase tracking-wider">
                    Descripción <span className="normal-case text-zinc-600">(opcional)</span>
                  </Label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="¿De qué va este grupo?"
                    className="bg-white/[0.04] border-white/[0.08] text-white placeholder:text-zinc-600 rounded-xl resize-none"
                    rows={2}
                  />
                </div>
              </form>

              {/* Sticky footer */}
              <div className="flex-shrink-0 px-5 pt-3 pb-[max(env(safe-area-inset-bottom),20px)] border-t border-white/[0.06] bg-zinc-950">
                <Button
                  form="create-group-form"
                  type="submit"
                  disabled={createGroup.isPending || !name.trim()}
                  className="w-full h-12 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-semibold shadow-[0_4px_20px_-4px_rgba(99,102,241,0.4)]"
                >
                  {createGroup.isPending ? 'Creando...' : 'Crear grupo'}
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Join Group Sheet ── */}
      <AnimatePresence>
        {showJoin && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 z-[60] backdrop-blur-sm"
              onClick={closeJoin}
            />
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 32 }}
              className="fixed bottom-0 left-0 right-0 z-[61] bg-zinc-950 border-t border-white/10 rounded-t-3xl px-5 pb-[max(env(safe-area-inset-bottom),28px)]"
            >
              <div className="flex justify-center pt-3 pb-4">
                <div className="w-10 h-1 bg-white/20 rounded-full" />
              </div>

              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center flex-shrink-0">
                  <Link2 size={26} className="text-indigo-400" />
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-600 mb-1">Unirse</p>
                  <p className="text-white font-bold text-xl leading-tight">Con código de invitación</p>
                </div>
              </div>

              <form id="join-group-form" onSubmit={handleJoin} className="space-y-5">
                <p className="text-zinc-500 text-sm leading-relaxed">
                  Pide el código al administrador del grupo e introdúcelo aquí.
                </p>
                <div className="space-y-2">
                  <Label className="text-zinc-400 text-xs uppercase tracking-wider">Código de invitación</Label>
                  <Input
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    placeholder="AB12CD34"
                    className="bg-white/[0.04] border-white/[0.08] text-white placeholder:text-zinc-600 rounded-xl h-14 text-center text-2xl tracking-[0.3em] font-mono uppercase"
                    maxLength={20}
                    required
                  />
                </div>
                <Button
                  type="submit"
                  disabled={joinGroup.isPending || !joinCode.trim()}
                  className="w-full h-12 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-semibold"
                >
                  {joinGroup.isPending ? 'Uniéndome...' : 'Unirme al grupo'}
                </Button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
