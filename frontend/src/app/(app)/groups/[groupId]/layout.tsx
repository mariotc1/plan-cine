'use client';

import { use, useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ArrowLeft, ArrowUp, Copy, MoreHorizontal, X, Pencil, LogOut, Trash2, Share2, QrCode, ChevronLeft, Users, Shield, UserMinus } from 'lucide-react';
import QRCode from 'react-qr-code';
import { useGroup, useUpdateGroup, useDeleteGroup, useLeaveGroup, useGroupMembers, useKickMember } from '@/hooks/useGroups';
import { useAuthStore } from '@/stores/authStore';
import { NowPlayingBanner } from '@/components/sessions/NowPlayingBanner';
import { ResponsiveSheet } from '@/components/shared/ResponsiveSheet';
import { useActiveDuel } from '@/hooks/useDuel';
import { GroupMember } from '@/types';
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
  const { data: members } = useGroupMembers(groupId);
  const kickMember = useKickMember(groupId);

  const [showSettings, setShowSettings] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [kickTarget, setKickTarget] = useState<GroupMember | null>(null);

  // Scroll-to-top FAB — mobile only, appears once you've scrolled a bit
  const [showScrollTop, setShowScrollTop] = useState(false);
  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 150);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // ─── Global duel detection (runs on every group page) ────────────────────
  const { data: activeDuel } = useActiveDuel(groupId);
  const hasRedirectedToDuel = useRef(false);
  const prevDuelStatus = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (!activeDuel) return;

    // Redirect once per duel to the spin page when voting starts
    if (
      (activeDuel.status === 'voting' || activeDuel.status === 'tie') &&
      !hasRedirectedToDuel.current &&
      !pathname.includes('/spin')
    ) {
      hasRedirectedToDuel.current = true;
      router.push(`/groups/${groupId}/spin`);
    }

    // Reset flag when duel ends so a new duel can redirect again
    if (activeDuel.status === 'closed') {
      hasRedirectedToDuel.current = false;
    }

    // Notify non-admin members when voting ends
    if (
      (prevDuelStatus.current === 'voting' || prevDuelStatus.current === 'tie') &&
      activeDuel.status === 'closed' &&
      activeDuel.winner_id
    ) {
      const winner =
        activeDuel.movie_a.id === activeDuel.winner_id
          ? activeDuel.movie_a
          : activeDuel.movie_b;
      if (!isAdmin) {
        toast.success(`¡Ha ganado "${winner.title}"! 🏆`, {
          description: 'El admin decidirá si la veis ahora o la programáis',
          duration: 6000,
        });
      }
    }

    prevDuelStatus.current = activeDuel.status;
  }, [activeDuel, isAdmin, groupId, pathname, router]);
  // ─────────────────────────────────────────────────────────────────────────

  const handleKick = async () => {
    if (!kickTarget) return;
    await kickMember.mutateAsync(kickTarget.id);
    setKickTarget(null);
  };
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
      {/* Sticky header + tabs — frosted glass while scrolled, with a soft
          progressive blur hand-off into the content below (no hard edge) */}
      <div className="sticky top-0 z-30">
        <div className="relative bg-zinc-950/75 backdrop-blur-xl">
          {/* Header */}
          <div
            className="relative flex items-center justify-between px-5 pb-0 lg:px-8 lg:pt-2"
            style={{ paddingTop: 'max(calc(env(safe-area-inset-top) + 10px), 30px)' }}
          >
            <motion.button
              whileTap={{ scale: 0.88 }}
              onClick={() => router.push('/groups')}
              className="relative z-10 w-9 h-9 rounded-full bg-white/[0.07] border border-white/[0.08] flex items-center justify-center text-zinc-300 flex-shrink-0 lg:hidden"
            >
              <ArrowLeft size={16} />
            </motion.button>

            {/* Center on mobile (absolutely positioned so buttons don't shift it) — left-aligned flow on desktop */}
            <div className="absolute inset-x-0 flex flex-col items-center justify-center pointer-events-none px-14 lg:static lg:flex-1 lg:items-start lg:justify-start lg:pointer-events-auto lg:px-0">
              <h1 className="text-[17px] font-bold text-white tracking-tight truncate text-center w-full lg:text-left lg:text-[28px]">
                {group?.name || '...'}
              </h1>
              {group?.member_count !== undefined && (
                <p className="text-[11px] text-zinc-500 mt-0.5 lg:text-[13px] lg:mt-1">
                  {group.member_count} {group.member_count === 1 ? 'miembro' : 'miembros'}
                </p>
              )}
            </div>

            <motion.button
              whileTap={{ scale: 0.88 }}
              onClick={() => setShowSettings(true)}
              aria-label="Ajustes"
              className="relative z-10 w-9 h-9 rounded-full bg-white/[0.07] border border-white/[0.08] flex items-center justify-center gap-2 text-zinc-300 flex-shrink-0 lg:w-auto lg:h-10 lg:px-4 lg:rounded-xl lg:hover:bg-white/[0.1] lg:transition-colors"
            >
              <MoreHorizontal size={18} />
              <span className="hidden lg:inline text-sm font-medium">Ajustes</span>
            </motion.button>
          </div>

          {/* Tabs — segmented pill on mobile, underlined tabs on desktop */}
          <div className="px-4 pt-4 pb-3 lg:px-8 lg:pt-6 lg:pb-0">
            <div className="relative flex bg-zinc-900/50 border border-white/[0.06] rounded-2xl p-[3px] lg:bg-transparent lg:border-0 lg:border-b lg:border-white/[0.08] lg:rounded-none lg:p-0 lg:gap-7 lg:justify-start">
              {TABS.map((tab) => {
                const href = `/groups/${groupId}${tab.href}`;
                const isActive = tab.href === ''
                  ? pathname === `/groups/${groupId}`
                  : pathname.startsWith(href);

                return (
                  <Link
                    key={tab.href}
                    href={href}
                    className="relative flex-1 flex items-center justify-center py-[7px] z-10 lg:flex-none lg:justify-start lg:py-0 lg:pb-3"
                  >
                    {isActive && (
                      <motion.div
                        layoutId="group-tab-pill"
                        className="absolute left-0 right-0 top-0 bottom-0 bg-indigo-500 rounded-[10px] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.12),0_2px_10px_-3px_rgba(99,102,241,0.55)] lg:top-auto lg:h-[2px] lg:rounded-none lg:shadow-none"
                        transition={{ type: 'spring', stiffness: 420, damping: 36 }}
                      />
                    )}
                    <span
                      className={cn(
                        'relative z-10 text-[12px] font-medium tracking-[0.01em] transition-colors duration-150 whitespace-nowrap lg:text-[13px] lg:font-semibold',
                        isActive ? 'text-white font-semibold' : 'text-zinc-500 lg:hover:text-zinc-300'
                      )}
                    >
                      {tab.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        {/* Progressive blur — three stacked, increasingly-blurred bands each
            masked to fade out sooner, so content sliding up dissolves smoothly
            instead of clipping at a hard line (the "Liquid Glass" hand-off). */}
        <div aria-hidden className="pointer-events-none absolute left-0 right-0 top-full h-8">
          <div
            className="absolute inset-0 backdrop-blur-[1px]"
            style={{ maskImage: 'linear-gradient(to bottom, black, transparent)', WebkitMaskImage: 'linear-gradient(to bottom, black, transparent)' }}
          />
          <div
            className="absolute inset-0 backdrop-blur-[3px]"
            style={{ maskImage: 'linear-gradient(to bottom, black, transparent 66%)', WebkitMaskImage: 'linear-gradient(to bottom, black, transparent 66%)' }}
          />
          <div
            className="absolute inset-0 backdrop-blur-[6px]"
            style={{ maskImage: 'linear-gradient(to bottom, black, transparent 33%)', WebkitMaskImage: 'linear-gradient(to bottom, black, transparent 33%)' }}
          />
        </div>
      </div>

      <NowPlayingBanner groupId={groupId} />

      <div className="mt-3">{children}</div>

      {/* Scroll-to-top — mobile only, appears once you've scrolled a bit */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 8 }}
            whileTap={{ scale: 0.88 }}
            transition={{ type: 'spring', stiffness: 500, damping: 32 }}
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            aria-label="Subir arriba del todo"
            className="fixed bottom-24 right-5 z-40 w-11 h-11 rounded-full bg-zinc-900/80 backdrop-blur-md border border-white/10 shadow-[0_8px_24px_-4px_rgba(0,0,0,0.5)] flex items-center justify-center text-zinc-300 sm:right-[max(1.25rem,calc(50%-240px+1.25rem))] lg:hidden"
          >
            <ArrowUp size={18} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Settings sheet */}
      <ResponsiveSheet open={showSettings} onClose={() => setShowSettings(false)} size="sm">
        <div className="flex items-center justify-between px-6 py-4 lg:pr-10">
          <h2 className="text-white font-bold text-lg">{group?.name}</h2>
          <button
            onClick={() => setShowSettings(false)}
            className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-zinc-400 lg:hidden"
          >
            <X size={15} />
          </button>
        </div>

        <div className="px-4 pb-[max(env(safe-area-inset-bottom),20px)] lg:pb-6 space-y-1">
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

          <button
            onClick={() => { setShowSettings(false); setShowMembers(true); }}
            className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl hover:bg-white/5 transition-colors text-left"
          >
            <div className="w-9 h-9 rounded-xl bg-white/8 flex items-center justify-center">
              <Users size={16} className="text-zinc-300" />
            </div>
            <div>
              <p className="text-white text-sm font-medium">Miembros</p>
              {group?.member_count !== undefined && (
                <p className="text-zinc-500 text-xs">{group.member_count} {group.member_count === 1 ? 'persona' : 'personas'}</p>
              )}
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
      </ResponsiveSheet>

      {/* QR sheet */}
      <ResponsiveSheet open={showQR} onClose={() => setShowQR(false)} size="sm">
        <div className="flex items-center justify-between px-6 py-3 lg:pr-10">
          <button
            onClick={() => { setShowQR(false); setShowSettings(true); }}
            className="flex items-center gap-1.5 text-zinc-400 hover:text-white transition-colors"
          >
            <ChevronLeft size={16} />
            <span className="text-sm">Volver</span>
          </button>
          <button
            onClick={() => setShowQR(false)}
            className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-zinc-400 lg:hidden"
          >
            <X size={15} />
          </button>
        </div>

        <div className="flex flex-col items-center px-6 pb-[max(env(safe-area-inset-bottom),32px)] lg:pb-8 pt-2">
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
      </ResponsiveSheet>

      {/* Edit sheet */}
      <ResponsiveSheet
        open={showEdit}
        onClose={() => setShowEdit(false)}
        size="md"
        className="flex flex-col"
        style={{ maxHeight: '88vh' }}
      >
        {/* Integrated preview header */}
        <div className="flex-shrink-0 flex items-center gap-4 px-5 mb-5 lg:pr-10">
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

        <div className="flex-shrink-0 px-5 pt-3 pb-[max(env(safe-area-inset-bottom),20px)] lg:pb-5 border-t border-white/[0.06] bg-zinc-950 lg:rounded-b-3xl">
          <Button
            form="edit-group-form"
            type="submit"
            disabled={updateGroup.isPending || !editName.trim()}
            className="w-full h-12 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-semibold"
          >
            {updateGroup.isPending ? 'Guardando...' : 'Guardar cambios'}
          </Button>
        </div>
      </ResponsiveSheet>

      {/* Members sheet */}
      <ResponsiveSheet
        open={showMembers}
        onClose={() => setShowMembers(false)}
        size="md"
        className="flex flex-col"
        style={{ maxHeight: '80vh' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3 flex-shrink-0 lg:pr-10">
          <div>
            <h2 className="text-white font-bold text-lg leading-tight">Miembros</h2>
            <p className="text-zinc-500 text-xs mt-0.5">{members?.length ?? 0} {(members?.length ?? 0) === 1 ? 'persona' : 'personas'} en el grupo</p>
          </div>
          <button
            onClick={() => setShowMembers(false)}
            className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-zinc-400 lg:hidden"
          >
            <X size={15} />
          </button>
        </div>

        {/* Member list */}
        <div className="flex-1 overflow-y-auto px-4 pb-[max(env(safe-area-inset-bottom),24px)] lg:pb-6 space-y-2">
          {members?.map((member: GroupMember) => {
            const isSelf    = member.id === user?.id;
            const isAdminM  = member.role === 'admin';
            const canKick   = isAdmin && !isSelf && !isAdminM;
            const color     = member.user?.color ?? '#6366f1';
            return (
              <div key={member.id} className="flex items-center gap-3 bg-white/[0.03] border border-white/[0.06] rounded-2xl px-4 py-3">
                {/* Avatar */}
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                  style={{ backgroundColor: `${color}20` }}
                >
                  {member.user?.avatar ?? '🎬'}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <p className="text-white font-semibold text-sm">{member.user?.name}</p>
                    {isSelf && (
                      <span className="text-[10px] text-zinc-500 bg-white/[0.06] px-1.5 py-0.5 rounded-md">Tú</span>
                    )}
                    {isAdminM && (
                      <span className="flex items-center gap-0.5 text-[10px] text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded-md border border-indigo-500/20">
                        <Shield size={8} strokeWidth={2.5} /> Admin
                      </span>
                    )}
                  </div>
                  {member.joined_at && (
                    <p className="text-zinc-600 text-[11px] mt-0.5">
                      Desde {new Date(member.joined_at).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                    </p>
                  )}
                </div>

                {/* Kick button */}
                {canKick && (
                  <motion.button
                    whileTap={{ scale: 0.88 }}
                    onClick={() => setKickTarget(member)}
                    className="flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center text-zinc-600 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <UserMinus size={15} />
                  </motion.button>
                )}
              </div>
            );
          })}
        </div>
      </ResponsiveSheet>

      {/* Kick confirm sheet — stacked above the members sheet */}
      <ResponsiveSheet open={!!kickTarget} onClose={() => setKickTarget(null)} size="sm" zIndex={70}>
        {kickTarget && (
          <div className="px-6 pb-[max(env(safe-area-inset-bottom),28px)] lg:pb-8">
            <div className="flex flex-col items-center text-center mb-6 pt-2">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mb-4"
                style={{ backgroundColor: `${kickTarget.user?.color ?? '#6366f1'}20` }}
              >
                {kickTarget.user?.avatar}
              </div>
              <h2 className="text-white font-bold text-xl">Expulsar a {kickTarget.user?.name}</h2>
              <p className="text-zinc-500 text-sm mt-2 leading-relaxed max-w-[280px]">
                Perderá acceso al grupo. Podrá volver a unirse con el enlace de invitación.
              </p>
            </div>
            <div className="space-y-2.5">
              <button
                onClick={handleKick}
                disabled={kickMember.isPending}
                className="w-full h-12 rounded-xl bg-red-500/90 hover:bg-red-500 text-white font-semibold transition-colors disabled:opacity-50"
              >
                {kickMember.isPending ? 'Expulsando...' : `Expulsar a ${kickTarget.user?.name}`}
              </button>
              <button
                onClick={() => setKickTarget(null)}
                className="w-full h-12 rounded-xl bg-white/[0.05] text-zinc-400 font-medium transition-colors border border-white/[0.08]"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </ResponsiveSheet>

      {/* Delete confirm sheet */}
      <ResponsiveSheet open={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)} size="sm">
        <div className="px-6 pb-[max(env(safe-area-inset-bottom),24px)] lg:pb-8">
          <div className="flex flex-col items-center text-center mb-6 pt-2">
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
        </div>
      </ResponsiveSheet>
    </div>
  );
}
