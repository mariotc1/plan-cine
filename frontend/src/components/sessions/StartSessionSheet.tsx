'use client';

import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Movie, User } from '@/types';
import { Check, Clock } from 'lucide-react';
import { getPlatform } from '@/lib/constants';
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

  const toggleMember = (id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const selectAll = () => setSelected(members.map((m) => m.id));

  const handleStart = () => {
    if (selected.length === 0) return;
    onStart(selected);
  };

  const platform = movie ? getPlatform(movie.platform) : null;

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side="bottom"
        className="bg-zinc-950 border-t border-zinc-800 rounded-t-3xl"
      >
        <SheetHeader className="mb-6">
          <SheetTitle className="text-white text-xl">¡A ver la película!</SheetTitle>
        </SheetHeader>

        {movie && (
          <div className="bg-zinc-900 rounded-2xl p-4 mb-6 border border-white/5">
            <p className="font-semibold text-white text-lg leading-tight">{movie.title}</p>
            <div className="flex items-center gap-2 mt-2 text-sm text-zinc-400">
              <Clock size={13} />
              <span>{movie.duration_formatted}</span>
              {platform && (
                <>
                  <span>·</span>
                  <span style={{ color: platform.color }}>{platform.emoji} {platform.label}</span>
                </>
              )}
            </div>
          </div>
        )}

        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-zinc-300">¿Quién está presente?</p>
            <button onClick={selectAll} className="text-xs text-indigo-400 font-medium">
              Seleccionar todos
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
                    'w-full flex items-center justify-between p-3.5 rounded-xl border transition-all',
                    isSelected
                      ? 'border-indigo-500/50 bg-indigo-500/10'
                      : 'border-zinc-800 bg-zinc-900'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="w-9 h-9 rounded-full flex items-center justify-center text-lg"
                      style={{ backgroundColor: `${member.color}25` }}
                    >
                      {member.avatar}
                    </span>
                    <span className="text-white font-medium">{member.name}</span>
                  </div>
                  <div
                    className={cn(
                      'w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all',
                      isSelected ? 'bg-indigo-500 border-indigo-500' : 'border-zinc-600'
                    )}
                  >
                    {isSelected && <Check size={12} className="text-white" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <Button
          onClick={handleStart}
          disabled={selected.length === 0 || loading}
          className="w-full h-12 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-semibold text-base mb-4"
        >
          {loading ? 'Iniciando...' : `Empezar sesión con ${selected.length} participante${selected.length !== 1 ? 's' : ''}`}
        </Button>
      </SheetContent>
    </Sheet>
  );
}
