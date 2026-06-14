'use client';

import { use, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserMinus, Shield } from 'lucide-react';
import { useGroupMembers, useGroup, useKickMember } from '@/hooks/useGroups';
import { useAuthStore } from '@/stores/authStore';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { GroupMember } from '@/types';
import { Button } from '@/components/ui/button';
import { staggerContainer, staggerItem } from '@/lib/animations';

interface Props {
  params: Promise<{ groupId: string }>;
}

export default function MembersPage({ params }: Props) {
  const { groupId } = use(params);
  const { data: members, isLoading } = useGroupMembers(groupId);
  const { data: group } = useGroup(groupId);
  const { user } = useAuthStore();
  const kickMember = useKickMember(groupId);

  const [kickTarget, setKickTarget] = useState<GroupMember | null>(null);

  const isAdmin = group?.created_by === user?.id;

  const handleKick = async () => {
    if (!kickTarget) return;
    await kickMember.mutateAsync(kickTarget.id);
    setKickTarget(null);
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="px-5 pb-8">
      <p className="text-zinc-600 text-xs uppercase tracking-wider font-semibold mb-4">
        {members?.length ?? 0} {(members?.length ?? 0) === 1 ? 'miembro' : 'miembros'}
      </p>

      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="space-y-2.5"
      >
        {members?.map((member: GroupMember) => {
          const isSelf = member.id === user?.id;
          const memberIsAdmin = member.role === 'admin';
          const canKick = isAdmin && !isSelf && !memberIsAdmin;
          const color = member.user?.color ?? '#6366f1';

          return (
            <motion.div key={member.id} variants={staggerItem}>
              <div className="bg-zinc-900 rounded-2xl border border-white/5 p-4 flex items-center gap-4">
                {/* Avatar */}
                <div className="flex-shrink-0">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
                    style={{ backgroundColor: `${color}22` }}
                  >
                    {member.user?.avatar ?? '🎬'}
                  </div>
                  </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <p className="text-white font-semibold text-sm">{member.user?.name}</p>
                    {isSelf && (
                      <span className="text-[10px] text-zinc-500 bg-white/5 px-1.5 py-0.5 rounded-md">
                        Tú
                      </span>
                    )}
                    {memberIsAdmin && (
                      <span className="flex items-center gap-1 text-[10px] text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded-md border border-indigo-500/20">
                        <Shield size={9} />
                        Admin
                      </span>
                    )}
                  </div>
                  {member.joined_at && (
                    <p className="text-zinc-600 text-xs mt-0.5">
                      Desde {new Date(member.joined_at).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                    </p>
                  )}
                </div>

                {canKick && (
                  <button
                    onClick={() => setKickTarget(member)}
                    className="flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center text-zinc-600 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <UserMinus size={15} />
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Kick confirm sheet */}
      <AnimatePresence>
        {kickTarget && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 z-[60] backdrop-blur-sm"
              onClick={() => setKickTarget(null)}
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
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mb-4"
                  style={{ backgroundColor: `${kickTarget.user?.color ?? '#6366f1'}22` }}
                >
                  {kickTarget.user?.avatar}
                </div>
                <h2 className="text-white font-bold text-xl">Expulsar a {kickTarget.user?.name}</h2>
                <p className="text-zinc-400 text-sm mt-2 leading-relaxed">
                  Se eliminará del grupo y perderá acceso a todas sus películas y sesiones.
                </p>
              </div>
              <div className="space-y-3">
                <Button
                  onClick={handleKick}
                  disabled={kickMember.isPending}
                  className="w-full h-12 rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold"
                >
                  {kickMember.isPending ? 'Expulsando...' : `Expulsar a ${kickTarget.user?.name}`}
                </Button>
                <Button
                  onClick={() => setKickTarget(null)}
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
