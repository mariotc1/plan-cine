'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Clock, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Movie, User } from '@/types';
import { getPlatform, getGenre } from '@/lib/constants';
import { cn } from '@/lib/utils';

interface StartSessionSheetProps {
  open: boolean;
  onClose: () => void;
  movie: Movie | null;
  members: User[];
  onStart: (participantIds: string[]) => void;
  loading?: boolean;
}

export function StartSessionSheet({ open, onClose, movie, members, onStart, loading }: StartSessionSheetProps) {
  const [selected, setSelected] = useState<string[]>([]);

  // Pre-select everyone when sheet opens
  useEffect(() => {
    if (open && members.length > 0) {
      setSelected(members.map((m) => m.id));
    }
  }, [open, movie]);

  const toggleMember = (id: string) => {
    setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const allSelected = selected.length === members.length;
  const toggleAll = () => setSelected(allSelected ? [] : members.map((m) => m.id));

  const handleStart = () => {
    if (selected.length === 0 || !movie) return;
    onStart(selected);
  };

  const platform = movie ? getPlatform(movie.platform) : null;
  const genre = movie ? getGenre(movie.genre) : null;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 z-[60] backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            className="fixed bottom-0 left-0 right-0 z-[61] bg-zinc-950 border-t border-white/10 rounded-t-3xl flex flex-col"
            style={{ maxHeight: '88vh' }}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
              <div className="w-10 h-1 bg-white/20 rounded-full" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-3 flex-shrink-0">
              <h2 className="text-white font-bold text-xl">¡A ver la película!</h2>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
              >
                <X size={15} />
              </button>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto px-6 pb-3">
              {/* Movie card */}
              {movie && (
                <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-4 mb-5">
                  <p className="font-bold text-white text-lg leading-tight mb-3">{movie.title}</p>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                      <Clock size={12} />
                      <span>{movie.duration_formatted}</span>
                    </div>
                    {platform && (
                      <span
                        className="text-xs font-medium px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: `${platform.color}22`, color: platform.color }}
                      >
                        {platform.emoji} {platform.label}
                      </span>
                    )}
                    {genre && (
                      <span className="text-xs text-zinc-400">
                        {genre.emoji} {genre.label}
                      </span>
                    )}
                  </div>
                  {movie.added_by && (
                    <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-white/[0.06]">
                      <span className="text-xs text-zinc-600">Propuesta por</span>
                      <span className="text-xs font-semibold" style={{ color: movie.added_by.color }}>
                        {movie.added_by.avatar} {movie.added_by.name}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Members */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Users size={13} className="text-zinc-500" />
                    <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                      ¿Quién está presente?
                    </p>
                  </div>
                  <button
                    onClick={toggleAll}
                    className="text-xs text-indigo-400 font-semibold"
                  >
                    {allSelected ? 'Deseleccionar' : 'Todos'}
                  </button>
                </div>

                <div className="space-y-2">
                  {members.map((member) => {
                    const isSelected = selected.includes(member.id);
                    return (
                      <button
                        key={member.id}
                        onClick={() => toggleMember(member.id)}
                        className={cn(
                          'w-full flex items-center justify-between px-4 py-3 rounded-2xl border transition-all',
                          isSelected
                            ? 'border-indigo-500/40 bg-indigo-500/10'
                            : 'border-white/[0.06] bg-white/[0.03]',
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                            style={{ backgroundColor: `${member.color}20` }}
                          >
                            {member.avatar}
                          </span>
                          <span className={cn(
                            'font-medium text-sm transition-colors',
                            isSelected ? 'text-white' : 'text-zinc-400'
                          )}>
                            {member.name}
                          </span>
                        </div>
                        <div
                          className={cn(
                            'w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0',
                            isSelected ? 'bg-indigo-500 border-indigo-500' : 'border-zinc-700',
                          )}
                        >
                          {isSelected && <Check size={11} className="text-white" strokeWidth={3} />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex-shrink-0 px-6 pt-3 pb-[max(env(safe-area-inset-bottom),20px)] border-t border-white/[0.06]">
              <Button
                onClick={handleStart}
                disabled={selected.length === 0 || loading}
                className="w-full h-12 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-semibold"
              >
                {loading
                  ? 'Iniciando...'
                  : `Empezar con ${selected.length} participante${selected.length !== 1 ? 's' : ''}`}
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
