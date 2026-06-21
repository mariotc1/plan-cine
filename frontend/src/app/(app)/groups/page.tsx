'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Users, Link2, X, ChevronRight } from 'lucide-react';
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

// Sheet con footer anclado fuera del scroll
function BottomSheet({
  open, onClose, title, children, footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop — z-[60] para estar sobre la BottomNav (z-50) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 z-[60] backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            className="fixed bottom-0 left-0 right-0 z-[61] bg-zinc-950 border-t border-white/10 rounded-t-3xl flex flex-col"
            style={{ maxHeight: '88vh' }}
          >
            {/* Handle */}
            <div className="flex-shrink-0 flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-white/20 rounded-full" />
            </div>

            {/* Header */}
            <div className="flex-shrink-0 flex items-center justify-between px-6 py-3">
              <h2 className="text-white font-bold text-xl">{title}</h2>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto px-6 pt-1 pb-4">
              {children}
            </div>

            {/* Footer anclado — nunca se corta */}
            <div className="flex-shrink-0 px-6 pt-3 pb-[max(env(safe-area-inset-bottom),20px)] border-t border-white/[0.06] bg-zinc-950">
              {footer}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

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
              whileTap={{ scale: 0.85 }}
              onClick={() => setShowJoin(true)}
              className="w-9 h-9 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-300"
            >
              <Link2 size={16} />
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.85 }}
              onClick={() => setShowCreate(true)}
              className="w-9 h-9 rounded-full bg-indigo-500 flex items-center justify-center text-white"
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
            emoji="🎬"
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
                <motion.div key={group.id} variants={staggerItem}>
                  <Link href={`/groups/${group.id}`}>
                    <div className="bg-zinc-900 rounded-2xl border border-white/5 p-4 active:bg-zinc-800 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center text-2xl flex-shrink-0">
                          {group.avatar || '🎬'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-white text-base truncate">{group.name}</h3>
                          {group.description && (
                            <p className="text-sm text-zinc-500 truncate mt-0.5">{group.description}</p>
                          )}
                          <div className="flex items-center gap-1 mt-1.5 text-xs text-zinc-600">
                            <Users size={11} />
                            <span>{group.member_count} miembro{group.member_count !== 1 ? 's' : ''}</span>
                          </div>
                        </div>
                        <ChevronRight size={18} className="text-zinc-700 flex-shrink-0" />
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      {/* Create Group Sheet */}
      <BottomSheet
        open={showCreate}
        onClose={closeCreate}
        title="Nuevo grupo"
        footer={
          <Button
            form="create-group-form"
            type="submit"
            disabled={createGroup.isPending || !name.trim()}
            className="w-full h-12 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-semibold text-base shadow-[0_4px_20px_-4px_rgba(99,102,241,0.4)]"
          >
            {createGroup.isPending ? 'Creando...' : 'Crear grupo'}
          </Button>
        }
      >
        <form id="create-group-form" onSubmit={handleCreate} className="space-y-5">
          {/* Emoji picker */}
          <div className="space-y-3">
            <Label className="text-zinc-400 text-xs uppercase tracking-wider">Icono</Label>
            <div className="grid grid-cols-9 gap-2">
              {GROUP_EMOJIS.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setAvatar(e)}
                  className={cn(
                    'aspect-square rounded-xl text-xl flex items-center justify-center transition-all',
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

          {/* Preview en vivo */}
          <div className="flex items-center gap-4 bg-white/[0.04] rounded-2xl p-4 border border-white/[0.06]">
            <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-2xl flex-shrink-0">
              {avatar}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold truncate">{name || 'Nombre del grupo'}</p>
              <p className="text-zinc-500 text-sm truncate mt-0.5">{description || 'Descripción opcional'}</p>
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
      </BottomSheet>

      {/* Join Group Sheet */}
      <BottomSheet
        open={showJoin}
        onClose={closeJoin}
        title="Unirse a un grupo"
        footer={
          <Button
            form="join-group-form"
            type="submit"
            disabled={joinGroup.isPending || !joinCode.trim()}
            className="w-full h-12 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-semibold text-base"
          >
            {joinGroup.isPending ? 'Uniéndome...' : 'Unirme al grupo'}
          </Button>
        }
      >
        <form id="join-group-form" onSubmit={handleJoin} className="space-y-5">
          <p className="text-zinc-400 text-sm leading-relaxed">
            Pide el código de invitación al administrador del grupo e introdúcelo aquí.
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
        </form>
      </BottomSheet>
    </div>
  );
}
