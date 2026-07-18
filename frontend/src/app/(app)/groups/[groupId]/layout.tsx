'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ArrowLeft, Copy, MoreHorizontal, X, Pencil, LogOut, Trash2, Share2, QrCode, ChevronLeft } from 'lucide-react';
import QRCode from 'react-qr-code';
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
  { label: 'Ranking', href: '/stats' },
  { label: 'Miembros', href: '/members' },
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
  const [showQR, setShowQR] = useState(false);
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

  const joinUrl = typeof window !== 'undefined' && group?.invitation_code
    ? `${window.location.origin}/join/${group.invitation_code}`
    : '';

  const copyCode = () => {
    if (group?.invitation_code) {
      navigator.clipboard.writeText(group.invitation_code);
      toast.success('Código copiado');
      setShowSettings(false);
    }
  };

  const handleShare = async () => {
    if (!group || !joinUrl) return;
    const shareData = {
      title: `Únete a ${group.name} en Plan Cine`,
      text: `¡Ey! Únete a "${group.name}" en Plan Cine 🎬 Organizamos nuestras noches de cine aquí.`,
      url: joinUrl,
    };
    try {
      if (navigator.share && navigator.canShare?.(shareData)) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(joinUrl);
        toast.success('Enlace copiado');
      }
    } catch {
      // user cancelled share — no-op
    }
    setShowSettings(false);
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="relative flex items-center justify-between px-5 pb-0" style={{ paddingTop: 'max(env(safe-area-inset-top), 16px)' }}>
        <motion.button
          whileTap={{ scale: 0.88 }}
          onClick={() => router.push('/groups')}
          className="relative z-10 w-9 h-9 rounded-full bg-white/[0.07] border border-white/[0.08] flex items-center justify-center text-zinc-300 flex-shrink-0"
        >
          <ArrowLeft size={16} />
        </motion.button>

        {/* Center — absolutely positioned so buttons don't shift it */}
        <div className="absolute inset-x-0 flex flex-col items-center justify-center pointer-events-none px-14">
          <h1 className="text-[17px] font-bold text-white tracking-tight truncate text-center w-full">
            {group?.name || '...'}
          </h1>
          {group?.member_count !== undefined && (
            <p className="text-[11px] text-zinc-500 mt-0.5">
              {group.member_count} {group.member_count === 1 ? 'miembro' : 'miembros'}
            </p>
          )}
        </div>

        <motion.button
          whileTap={{ scale: 0.88 }}
          onClick={() => setShowSettings(true)}
          className="relative z-10 w-9 h-9 rounded-full bg-white/[0.07] border border-white/[0.08] flex items-center justify-center text-zinc-300 flex-shrink-0"
        >
          <MoreHorizontal size={18} />
        </motion.button>
      </div>

      {/* Tabs */}
      <div className="px-4 pt-4 pb-0">
        <div className="relative flex bg-zinc-900/50 border border-white/[0.06] rounded-2xl p-1">
          {TABS.map((tab) => {
            const href = `/groups/${groupId}${tab.href}`;
            const isActive = tab.href === ''
              ? pathname === `/groups/${groupId}`
              : pathname.startsWith(href);

            return (
              <Link
                key={tab.href}
                href={href}
                className="relative flex-1 flex items-center justify-center py-[9px] z-10"
              >
                {isActive && (
                  <motion.div
                    layoutId="group-tab-pill"
                    className="absolute inset-0 bg-indigo-500 rounded-xl shadow-[0_2px_16px_-3px_rgba(99,102,241,0.55)]"
                    transition={{ type: 'spring', stiffness: 420, damping: 36 }}
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
                {/* Compartir — acción principal */}
                <button
                  onClick={handleShare}
                  className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl hover:bg-white/5 transition-colors text-left"
                >
                  <div className="w-9 h-9 rounded-xl bg-indigo-500/15 flex items-center justify-center">
                    <Share2 size={16} className="text-indigo-400" />
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">Compartir invitación</p>
                    <p className="text-zinc-500 text-xs">WhatsApp, iMessage, cualquier app</p>
                  </div>
                </button>

                {/* QR */}
                <button
                  onClick={() => { setShowSettings(false); setShowQR(true); }}
                  className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl hover:bg-white/5 transition-colors text-left"
                >
                  <div className="w-9 h-9 rounded-xl bg-white/8 flex items-center justify-center">
                    <QrCode size={16} className="text-zinc-300" />
                  </div>
                  <p className="text-white text-sm font-medium">Ver código QR</p>
                </button>

                {/* Copiar código — fallback */}
                <button
                  onClick={copyCode}
                  className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl hover:bg-white/5 transition-colors text-left"
                >
                  <div className="w-9 h-9 rounded-xl bg-white/8 flex items-center justify-center">
                    <Copy size={16} className="text-zinc-300" />
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">Copiar código</p>
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

      {/* QR sheet */}
      <AnimatePresence>
        {showQR && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-[60] backdrop-blur-sm"
              onClick={() => setShowQR(false)}
            />
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 32 }}
              className="fixed bottom-0 left-0 right-0 z-[61] bg-zinc-950 border-t border-white/10 rounded-t-3xl"
            >
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 bg-white/20 rounded-full" />
              </div>
              <div className="flex items-center justify-between px-6 py-3">
                <button
                  onClick={() => { setShowQR(false); setShowSettings(true); }}
                  className="flex items-center gap-1.5 text-zinc-400 hover:text-white transition-colors"
                >
                  <ChevronLeft size={16} />
                  <span className="text-sm">Volver</span>
                </button>
                <button onClick={() => setShowQR(false)} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-zinc-400">
                  <X size={15} />
                </button>
              </div>

              <div className="flex flex-col items-center px-6 pb-[max(env(safe-area-inset-bottom),32px)] pt-2">
                <div className="bg-white rounded-2xl p-5 mb-5">
                  {joinUrl && (
                    <QRCode
                      value={joinUrl}
                      size={200}
                      fgColor="#09090b"
                      bgColor="#ffffff"
                      style={{ height: 200, width: 200 }}
                    />
                  )}
                </div>
                <p className="text-white font-bold text-lg text-center">{group?.name}</p>
                <p className="text-zinc-500 text-sm text-center mt-1 mb-4">
                  Escanea para unirte al grupo
                </p>
                <div className="flex items-center gap-2 bg-white/[0.06] border border-white/[0.08] rounded-xl px-4 py-2.5 mb-5">
                  <span className="text-zinc-400 text-xs">Código:</span>
                  <span className="text-white font-mono font-semibold tracking-widest text-sm">
                    {group?.invitation_code}
                  </span>
                </div>
                <button
                  onClick={handleShare}
                  className="w-full h-12 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-colors"
                >
                  <Share2 size={16} /> Compartir enlace
                </button>
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
              <div className="flex justify-center pt-3 pb-4 flex-shrink-0">
                <div className="w-10 h-1 bg-white/20 rounded-full" />
              </div>

              {/* Integrated preview header */}
              <div className="flex-shrink-0 flex items-center gap-4 px-5 mb-5">
                <div className="w-16 h-16 rounded-2xl bg-white/[0.07] border border-white/[0.08] flex items-center justify-center text-4xl flex-shrink-0 transition-all duration-200">
                  {editAvatar}
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-600 mb-1">Editar grupo</p>
                  <p className="text-white font-bold text-xl leading-tight truncate">{editName || 'Nombre del grupo'}</p>
                  {editDesc && <p className="text-zinc-500 text-sm truncate mt-0.5">{editDesc}</p>}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-5 pb-4">
                <form id="edit-group-form" onSubmit={handleEdit} className="space-y-5">
                  <div className="space-y-2">
                    <Label className="text-zinc-400 text-xs uppercase tracking-wider">Icono</Label>
                    <div className="grid grid-cols-6 gap-2 p-1">
                      {GROUP_EMOJIS.map((e) => (
                        <button
                          key={e} type="button" onClick={() => setEditAvatar(e)}
                          className={cn(
                            'aspect-square rounded-xl text-2xl flex items-center justify-center transition-all',
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

              <div className="flex-shrink-0 px-5 pt-3 pb-[max(env(safe-area-inset-bottom),20px)] border-t border-white/[0.06] bg-zinc-950">
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
