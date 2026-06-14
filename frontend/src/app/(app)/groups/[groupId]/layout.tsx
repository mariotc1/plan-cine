'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ArrowLeft, Copy, MoreHorizontal, X, Pencil, LogOut, Trash2 } from 'lucide-react';
import { useGroup, useUpdateGroup, useDeleteGroup, useLeaveGroup } from '@/hooks/useGroups';
import { useAuthStore } from '@/stores/authStore';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

const GROUP_EMOJIS = [
  '🏠', '👨‍👩‍👧‍👦', '🎬', '🍿', '🎮', '🌙',
  '🎭', '🌟', '🎉', '🏆', '❤️', '🔥',
  '🎵', '🌈', '🐶', '🏖️', '🎲', '🚀',
];

const TABS = [
  { label: 'Pelis', href: '' },
  { label: 'Ruleta', href: '/spin' },
  { label: 'Sesiones', href: '/sessions' },
  { label: 'Miembros', href: '/members' },
  { label: 'Ranking', href: '/stats' },
];

interface Props {
  children: React.ReactNode;
  params: Promise<{ groupId: string }>;
}

export default function GroupLayout({ children, params }: Props) {
  const { groupId } = use(params);
  const { data: group } = useGroup(groupId);
  const { user } = useAuthStore();
  const pathname = usePathname();
  const router = useRouter();

  const isAdmin = group?.created_by === user?.id;

  const updateGroup = useUpdateGroup(groupId);
  const deleteGroup = useDeleteGroup();
  const leaveGroup = useLeaveGroup();

  const [showSettings, setShowSettings] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editAvatar, setEditAvatar] = useState('🎬');

  const openEdit = () => {
    setEditName(group?.name ?? '');
    setEditDesc(group?.description ?? '');
    setEditAvatar(group?.avatar ?? '🎬');
    setShowSettings(false);
    setShowEdit(true);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateGroup.mutateAsync({ name: editName, avatar: editAvatar, description: editDesc });
    setShowEdit(false);
  };

  const handleDelete = async () => {
    await deleteGroup.mutateAsync(groupId);
    router.replace('/groups');
  };

  const handleLeave = async () => {
    await leaveGroup.mutateAsync(groupId);
    router.replace('/groups');
  };

  const copyCode = () => {
    if (group?.invitation_code) {
      navigator.clipboard.writeText(group.invitation_code);
      toast.success('Código copiado');
      setShowSettings(false);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="px-5 pt-12 pb-0">
        <div className="flex items-center justify-between">
          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={() => router.push('/groups')}
            className="flex items-center justify-center w-9 h-9 rounded-full bg-zinc-800 text-zinc-300"
          >
            <ArrowLeft size={18} />
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={() => setShowSettings(true)}
            className="flex items-center justify-center w-9 h-9 rounded-full bg-zinc-800 text-zinc-300"
          >
            <MoreHorizontal size={18} />
          </motion.button>
        </div>
        <div className="flex items-center gap-3 mt-3">
          {group?.avatar && <span className="text-2xl">{group.avatar}</span>}
          <h1 className="text-xl font-bold text-white tracking-tight truncate">
            {group?.name || '...'}
          </h1>
        </div>
      </div>

      {/* Tabs — ancho completo, sin scroll, indicador deslizante */}
      <div className="px-4 pt-4 pb-0">
        <div className="relative flex bg-zinc-900/70 rounded-2xl p-1">
          {TABS.map((tab) => {
            const href = `/groups/${groupId}${tab.href}`;
            const isActive = tab.href === ''
              ? pathname === `/groups/${groupId}`
              : pathname.startsWith(href);

            return (
              <Link
                key={tab.href}
                href={href}
                className="relative flex-1 flex items-center justify-center py-2 z-10"
              >
                {isActive && (
                  <motion.div
                    layoutId="group-tab-pill"
                    className="absolute inset-0 bg-indigo-500 rounded-xl shadow-[0_2px_12px_-2px_rgba(99,102,241,0.5)]"
                    transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                  />
                )}
                <span
                  className={cn(
                    'relative z-10 text-[12px] font-semibold transition-colors duration-150 whitespace-nowrap',
                    isActive ? 'text-white' : 'text-zinc-500'
                  )}
                >
                  {tab.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="mt-3">{children}</div>

      {/* Settings sheet */}
      <AnimatePresence>
        {showSettings && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-[60] backdrop-blur-sm"
              onClick={() => setShowSettings(false)}
            />
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 32 }}
              className="fixed bottom-0 left-0 right-0 z-[61] bg-zinc-950 border-t border-white/10 rounded-t-3xl"
            >
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 bg-white/20 rounded-full" />
              </div>
              <div className="flex items-center justify-between px-6 py-4">
                <h2 className="text-white font-bold text-lg">{group?.name}</h2>
                <button onClick={() => setShowSettings(false)} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-zinc-400">
                  <X size={15} />
                </button>
              </div>

              <div className="px-4 pb-[max(env(safe-area-inset-bottom),20px)] space-y-1">
                <button
                  onClick={copyCode}
                  className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl hover:bg-white/5 transition-colors text-left"
                >
                  <div className="w-9 h-9 rounded-xl bg-white/8 flex items-center justify-center">
                    <Copy size={16} className="text-zinc-300" />
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">Copiar código de invitación</p>
                    <p className="text-zinc-500 text-xs font-mono">{group?.invitation_code}</p>
                  </div>
                </button>

                {isAdmin && (
                  <button
                    onClick={openEdit}
                    className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl hover:bg-white/5 transition-colors text-left"
                  >
                    <div className="w-9 h-9 rounded-xl bg-white/8 flex items-center justify-center">
                      <Pencil size={16} className="text-zinc-300" />
                    </div>
                    <p className="text-white text-sm font-medium">Editar grupo</p>
                  </button>
                )}

                <div className="h-px bg-white/[0.06] mx-4 my-1" />

                {isAdmin ? (
                  <button
                    onClick={() => { setShowSettings(false); setShowDeleteConfirm(true); }}
                    className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl hover:bg-red-500/10 transition-colors text-left"
                  >
                    <div className="w-9 h-9 rounded-xl bg-red-500/10 flex items-center justify-center">
                      <Trash2 size={16} className="text-red-400" />
                    </div>
                    <p className="text-red-400 text-sm font-medium">Eliminar grupo</p>
                  </button>
                ) : (
                  <button
                    onClick={() => { setShowSettings(false); handleLeave(); }}
                    className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl hover:bg-red-500/10 transition-colors text-left"
                  >
                    <div className="w-9 h-9 rounded-xl bg-red-500/10 flex items-center justify-center">
                      <LogOut size={16} className="text-red-400" />
                    </div>
                    <p className="text-red-400 text-sm font-medium">Salir del grupo</p>
                  </button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Edit sheet */}
      <AnimatePresence>
        {showEdit && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-[60] backdrop-blur-sm"
              onClick={() => setShowEdit(false)}
            />
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 32 }}
              className="fixed bottom-0 left-0 right-0 z-[61] bg-zinc-950 border-t border-white/10 rounded-t-3xl flex flex-col"
              style={{ maxHeight: '88vh' }}
            >
              <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
                <div className="w-10 h-1 bg-white/20 rounded-full" />
              </div>
              <div className="flex items-center justify-between px-6 py-3 flex-shrink-0">
                <h2 className="text-white font-bold text-xl">Editar grupo</h2>
                <button onClick={() => setShowEdit(false)} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-zinc-400">
                  <X size={16} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-6 pb-4">
                <form id="edit-group-form" onSubmit={handleEdit} className="space-y-5 pt-1">
                  <div className="space-y-3">
                    <Label className="text-zinc-400 text-xs uppercase tracking-wider">Icono</Label>
                    <div className="grid grid-cols-9 gap-2">
                      {GROUP_EMOJIS.map((e) => (
                        <button
                          key={e} type="button" onClick={() => setEditAvatar(e)}
                          className={cn(
                            'aspect-square rounded-xl text-xl flex items-center justify-center transition-all',
                            editAvatar === e ? 'bg-indigo-500/25 ring-2 ring-indigo-500' : 'bg-white/5 hover:bg-white/10'
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
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="bg-white/[0.04] border-white/[0.08] text-white rounded-xl h-12"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-zinc-400 text-xs uppercase tracking-wider">Descripción <span className="normal-case text-zinc-600">(opcional)</span></Label>
                    <Textarea
                      value={editDesc}
                      onChange={(e) => setEditDesc(e.target.value)}
                      className="bg-white/[0.04] border-white/[0.08] text-white rounded-xl resize-none"
                      rows={2}
                    />
                  </div>
                </form>
              </div>

              <div className="flex-shrink-0 px-6 pt-3 pb-[max(env(safe-area-inset-bottom),20px)] border-t border-white/[0.06]">
                <Button
                  form="edit-group-form"
                  type="submit"
                  disabled={updateGroup.isPending || !editName.trim()}
                  className="w-full h-12 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-semibold"
                >
                  {updateGroup.isPending ? 'Guardando...' : 'Guardar cambios'}
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Delete confirm sheet */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 z-[60] backdrop-blur-sm"
              onClick={() => setShowDeleteConfirm(false)}
            />
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 32 }}
              className="fixed bottom-0 left-0 right-0 z-[61] bg-zinc-950 border-t border-white/10 rounded-t-3xl px-6 pb-[max(env(safe-area-inset-bottom),24px)]"
            >
              <div className="flex justify-center pt-3 pb-4">
                <div className="w-10 h-1 bg-white/20 rounded-full" />
              </div>
              <div className="flex flex-col items-center text-center mb-6">
                <div className="w-14 h-14 rounded-2xl bg-red-500/10 flex items-center justify-center mb-4">
                  <Trash2 size={24} className="text-red-400" />
                </div>
                <h2 className="text-white font-bold text-xl">Eliminar grupo</h2>
                <p className="text-zinc-400 text-sm mt-2 leading-relaxed">
                  Se eliminarán todas las películas, sesiones y estadísticas. Esta acción no se puede deshacer.
                </p>
              </div>
              <div className="space-y-3">
                <Button
                  onClick={handleDelete}
                  disabled={deleteGroup.isPending}
                  className="w-full h-12 rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold"
                >
                  {deleteGroup.isPending ? 'Eliminando...' : 'Sí, eliminar grupo'}
                </Button>
                <Button
                  onClick={() => setShowDeleteConfirm(false)}
                  variant="ghost"
                  className="w-full h-12 rounded-xl text-zinc-400"
                >
                  Cancelar
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
