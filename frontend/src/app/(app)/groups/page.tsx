'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Users, LogOut, Link2 } from 'lucide-react';
import { useGroups, useCreateGroup, useJoinGroup } from '@/hooks/useGroups';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { staggerContainer, staggerItem } from '@/lib/animations';
import { Group } from '@/types';
import { toast } from 'sonner';

export default function GroupsPage() {
  const { data: groups, isLoading } = useGroups();
  const createGroup = useCreateGroup();
  const joinGroup = useJoinGroup();

  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [joinCode, setJoinCode] = useState('');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createGroup.mutateAsync({ name, description });
      setShowCreate(false);
      setName('');
      setDescription('');
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

  const getGroupInitial = (group: Group) => {
    return group.name.charAt(0).toUpperCase();
  };

  const groupColors = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#ef4444', '#3b82f6'];

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
            description="Crea un grupo familiar o únete al de un amigo con un código"
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
              {groups.map((group, i) => (
                <motion.div key={group.id} variants={staggerItem}>
                  <Link href={`/groups/${group.id}`}>
                    <div className="bg-zinc-900 rounded-2xl border border-white/5 p-5 active:bg-zinc-800 transition-colors">
                      <div className="flex items-center gap-4">
                        <div
                          className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-bold text-white flex-shrink-0"
                          style={{ backgroundColor: `${groupColors[i % groupColors.length]}30`, color: groupColors[i % groupColors.length] }}
                        >
                          {getGroupInitial(group)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-white text-base truncate">{group.name}</h3>
                          {group.description && (
                            <p className="text-sm text-zinc-500 truncate mt-0.5">{group.description}</p>
                          )}
                          <div className="flex items-center gap-1 mt-1 text-xs text-zinc-600">
                            <Users size={11} />
                            <span>{group.member_count} miembro{group.member_count !== 1 ? 's' : ''}</span>
                          </div>
                        </div>
                        <div className="text-zinc-600">›</div>
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
      <Sheet open={showCreate} onOpenChange={(v) => !v && setShowCreate(false)}>
        <SheetContent side="bottom" className="bg-zinc-950 border-t border-zinc-800 rounded-t-3xl">
          <SheetHeader className="mb-6">
            <SheetTitle className="text-white text-xl">Crear grupo</SheetTitle>
          </SheetHeader>
          <form onSubmit={handleCreate} className="space-y-4 pb-8">
            <div className="space-y-2">
              <Label className="text-zinc-300">Nombre del grupo</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Familia Tibus, Piso Salamanca..."
                className="bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600 rounded-xl h-12"
                required
              />
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-300">Descripción (opcional)</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Las noches de cine en familia 🎬"
                className="bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600 rounded-xl resize-none"
                rows={3}
              />
            </div>
            <Button
              type="submit"
              disabled={createGroup.isPending || !name}
              className="w-full h-12 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-semibold"
            >
              {createGroup.isPending ? 'Creando...' : 'Crear grupo'}
            </Button>
          </form>
        </SheetContent>
      </Sheet>

      {/* Join Group Sheet */}
      <Sheet open={showJoin} onOpenChange={(v) => !v && setShowJoin(false)}>
        <SheetContent side="bottom" className="bg-zinc-950 border-t border-zinc-800 rounded-t-3xl">
          <SheetHeader className="mb-6">
            <SheetTitle className="text-white text-xl">Unirse a un grupo</SheetTitle>
          </SheetHeader>
          <form onSubmit={handleJoin} className="space-y-4 pb-8">
            <div className="space-y-2">
              <Label className="text-zinc-300">Código de invitación</Label>
              <Input
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="TIBUS001"
                className="bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600 rounded-xl h-12 text-center text-lg tracking-widest font-mono uppercase"
                maxLength={20}
                required
              />
            </div>
            <Button
              type="submit"
              disabled={joinGroup.isPending || !joinCode}
              className="w-full h-12 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-semibold"
            >
              {joinGroup.isPending ? 'Uniéndome...' : 'Unirme'}
            </Button>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
