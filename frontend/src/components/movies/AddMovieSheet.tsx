'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, Check } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { PLATFORMS, GENRES } from '@/lib/constants';
import { formatDuration } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { Movie } from '@/types';

interface AddMovieSheetProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    duration_minutes: number;
    platform: string;
    genre: string;
    notes?: string;
  }) => void;
  loading?: boolean;
  editMovie?: Movie | null;
}

type DurationMode = 'min' | 'hm';
type PickerType = 'platform' | 'genre' | null;

function parseDuration(input: string, mode: DurationMode): number | null {
  const s = input.trim().toLowerCase();
  if (!s) return null;

  if (mode === 'min') {
    const n = parseInt(s);
    return !isNaN(n) && n > 0 ? n : null;
  }

  const hm = s.match(/^(\d+)\s*h\s*(\d*)\s*m?$/);
  if (hm) {
    const h = parseInt(hm[1]);
    const m = hm[2] ? parseInt(hm[2]) : 0;
    return h * 60 + m;
  }
  const colon = s.match(/^(\d+):(\d{1,2})$/);
  if (colon) {
    return parseInt(colon[1]) * 60 + parseInt(colon[2]);
  }
  const raw = parseInt(s);
  return !isNaN(raw) && raw > 0 ? raw : null;
}

interface PickerSheetProps {
  open: boolean;
  title: string;
  options: { value: string; label: string; emoji: string }[];
  value: string;
  onSelect: (v: string) => void;
  onClose: () => void;
}

function PickerSheet({ open, title, options, value, onSelect, onClose }: PickerSheetProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black z-[79]"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 36 }}
            className="fixed bottom-0 left-0 right-0 z-[80] bg-zinc-900 border-t border-white/10 rounded-t-3xl flex flex-col"
            style={{ maxHeight: '70vh' }}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
              <div className="w-10 h-1 bg-white/20 rounded-full" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-3 flex-shrink-0">
              <h3 className="text-white font-semibold text-base">{title}</h3>
              <button
                onClick={onClose}
                className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-zinc-400"
              >
                <X size={14} />
              </button>
            </div>

            {/* Options list */}
            <div className="flex-1 overflow-y-auto px-3 pb-[max(env(safe-area-inset-bottom),20px)]">
              {options.map((opt, i) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => { onSelect(opt.value); onClose(); }}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-left transition-colors',
                    i < options.length - 1 && 'mb-0.5',
                    value === opt.value
                      ? 'bg-indigo-500/15 text-white'
                      : 'text-zinc-300 hover:bg-white/[0.04]',
                  )}
                >
                  <span className="text-xl w-7 text-center">{opt.emoji}</span>
                  <span className="flex-1 font-medium text-sm">{opt.label}</span>
                  {value === opt.value && (
                    <Check size={16} className="text-indigo-400 flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export function AddMovieSheet({ open, onClose, onSubmit, loading, editMovie }: AddMovieSheetProps) {
  const [title, setTitle] = useState('');
  const [durationRaw, setDurationRaw] = useState('');
  const [durationMode, setDurationMode] = useState<DurationMode>('min');
  const [platform, setPlatform] = useState('');
  const [genre, setGenre] = useState('');
  const [notes, setNotes] = useState('');
  const [activePicker, setActivePicker] = useState<PickerType>(null);

  useEffect(() => {
    if (open) {
      if (editMovie) {
        setTitle(editMovie.title);
        setDurationRaw(String(editMovie.duration_minutes));
        setDurationMode('min');
        setPlatform(editMovie.platform);
        setGenre(editMovie.genre);
        setNotes(editMovie.notes || '');
      } else {
        setTitle('');
        setDurationRaw('');
        setDurationMode('min');
        setPlatform('');
        setGenre('');
        setNotes('');
      }
      setActivePicker(null);
    }
  }, [editMovie, open]);

  const parsedMinutes = parseDuration(durationRaw, durationMode);
  const canSubmit = !loading && !!title.trim() && parsedMinutes !== null && parsedMinutes > 0 && !!platform && !!genre;

  const selectedPlatform = PLATFORMS.find((p) => p.value === platform);
  const selectedGenre = GENRES.find((g) => g.value === genre);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || parsedMinutes === null) return;
    onSubmit({ title, duration_minutes: parsedMinutes, platform, genre, notes: notes || undefined });
  };

  const switchMode = (m: DurationMode) => {
    if (m !== durationMode && parsedMinutes !== null) {
      if (m === 'hm') {
        const h = Math.floor(parsedMinutes / 60);
        const min = parsedMinutes % 60;
        setDurationRaw(min > 0 ? `${h}h ${min}` : `${h}h`);
      } else {
        setDurationRaw(String(parsedMinutes));
      }
    } else if (m !== durationMode) {
      setDurationRaw('');
    }
    setDurationMode(m);
  };

  return (
    <>
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-[60] backdrop-blur-sm"
              onClick={onClose}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 32 }}
              className="fixed bottom-0 left-0 right-0 z-[61] bg-zinc-950 border-t border-white/10 rounded-t-3xl flex flex-col"
              style={{ maxHeight: '92vh' }}
            >
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
                <div className="w-10 h-1 bg-white/20 rounded-full" />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between px-6 py-3 flex-shrink-0">
                <h2 className="text-white font-bold text-xl">
                  {editMovie ? 'Editar película' : 'Añadir película'}
                </h2>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-zinc-400"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Scrollable form */}
              <div className="flex-1 overflow-y-auto px-6 pb-4">
                <form id="add-movie-form" onSubmit={handleSubmit} className="space-y-5 pt-1">
                  {/* Title */}
                  <div className="space-y-2">
                    <Label className="text-zinc-400 text-xs uppercase tracking-wider">Título</Label>
                    <Input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Nombre de la película"
                      className="bg-white/[0.04] border-white/[0.08] text-white placeholder:text-zinc-600 rounded-xl h-12"
                      required
                    />
                  </div>

                  {/* Duration */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-zinc-400 text-xs uppercase tracking-wider">
                        Duración
                        {parsedMinutes !== null && parsedMinutes > 0 && (
                          <span className="ml-2 text-indigo-400 font-semibold normal-case">
                            → {formatDuration(parsedMinutes)}
                          </span>
                        )}
                      </Label>
                      <div className="flex items-center bg-zinc-900 rounded-lg p-0.5 border border-white/[0.06]">
                        {(['min', 'hm'] as DurationMode[]).map((m) => (
                          <button
                            key={m}
                            type="button"
                            onClick={() => switchMode(m)}
                            className={cn(
                              'px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all',
                              durationMode === m
                                ? 'bg-indigo-500 text-white'
                                : 'text-zinc-500 hover:text-zinc-300',
                            )}
                          >
                            {m === 'min' ? 'min' : 'h·min'}
                          </button>
                        ))}
                      </div>
                    </div>
                    <Input
                      value={durationRaw}
                      onChange={(e) => setDurationRaw(e.target.value)}
                      placeholder={durationMode === 'min' ? 'ej: 95' : 'ej: 1h 35'}
                      className="bg-white/[0.04] border-white/[0.08] text-white placeholder:text-zinc-600 rounded-xl h-12"
                      inputMode={durationMode === 'min' ? 'numeric' : 'text'}
                    />
                    {durationMode === 'hm' && (
                      <p className="text-[11px] text-zinc-600">
                        Acepta formatos: 1h 30, 1:30, 1h30m
                      </p>
                    )}
                  </div>

                  {/* Platform */}
                  <div className="space-y-2">
                    <Label className="text-zinc-400 text-xs uppercase tracking-wider">Plataforma</Label>
                    <button
                      type="button"
                      onClick={() => setActivePicker('platform')}
                      className="w-full flex items-center justify-between bg-white/[0.04] border border-white/[0.08] rounded-xl h-12 px-4 transition-colors hover:bg-white/[0.07]"
                    >
                      {selectedPlatform ? (
                        <span className="text-white text-sm font-medium">
                          {selectedPlatform.emoji} {selectedPlatform.label}
                        </span>
                      ) : (
                        <span className="text-zinc-600 text-sm">Selecciona plataforma</span>
                      )}
                      <ChevronRight size={16} className="text-zinc-600" />
                    </button>
                  </div>

                  {/* Genre */}
                  <div className="space-y-2">
                    <Label className="text-zinc-400 text-xs uppercase tracking-wider">Género</Label>
                    <button
                      type="button"
                      onClick={() => setActivePicker('genre')}
                      className="w-full flex items-center justify-between bg-white/[0.04] border border-white/[0.08] rounded-xl h-12 px-4 transition-colors hover:bg-white/[0.07]"
                    >
                      {selectedGenre ? (
                        <span className="text-white text-sm font-medium">
                          {selectedGenre.emoji} {selectedGenre.label}
                        </span>
                      ) : (
                        <span className="text-zinc-600 text-sm">Selecciona género</span>
                      )}
                      <ChevronRight size={16} className="text-zinc-600" />
                    </button>
                  </div>

                  {/* Notes */}
                  <div className="space-y-2">
                    <Label className="text-zinc-400 text-xs uppercase tracking-wider">
                      Notas <span className="normal-case text-zinc-600">(opcional)</span>
                    </Label>
                    <Textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Comentarios, contexto..."
                      className="bg-white/[0.04] border-white/[0.08] text-white placeholder:text-zinc-600 rounded-xl resize-none"
                      rows={2}
                    />
                  </div>
                </form>
              </div>

              {/* Footer button */}
              <div className="flex-shrink-0 px-6 pt-3 pb-[max(env(safe-area-inset-bottom),20px)] border-t border-white/[0.06]">
                <Button
                  form="add-movie-form"
                  type="submit"
                  disabled={!canSubmit}
                  className="w-full h-12 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-semibold"
                >
                  {loading ? 'Guardando...' : editMovie ? 'Guardar cambios' : 'Añadir película'}
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Picker sheets — rendered outside main sheet so z-index works cleanly */}
      <PickerSheet
        open={activePicker === 'platform'}
        title="Plataforma"
        options={PLATFORMS}
        value={platform}
        onSelect={setPlatform}
        onClose={() => setActivePicker(null)}
      />
      <PickerSheet
        open={activePicker === 'genre'}
        title="Género"
        options={GENRES}
        value={genre}
        onSelect={setGenre}
        onClose={() => setActivePicker(null)}
      />
    </>
  );
}
