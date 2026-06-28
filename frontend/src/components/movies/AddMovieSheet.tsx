'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, Check, Search, Film, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { PLATFORMS, GENRES } from '@/lib/constants';
import { PlatformLogo } from '@/components/ui/PlatformLogo';
import { formatDuration } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { Movie, TmdbSearchResult } from '@/types';
import { tmdbApi } from '@/lib/api';

interface AddMovieSheetProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    duration_minutes: number;
    platform: string;
    genre: string;
    tmdb_id?: number;
    poster_path?: string;
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
  if (hm) return parseInt(hm[1]) * 60 + (hm[2] ? parseInt(hm[2]) : 0);
  const colon = s.match(/^(\d+):(\d{1,2})$/);
  if (colon) return parseInt(colon[1]) * 60 + parseInt(colon[2]);
  const raw = parseInt(s);
  return !isNaN(raw) && raw > 0 ? raw : null;
}

interface PickerSheetProps {
  open: boolean;
  title: string;
  options: { value: string; label: string; emoji: string; isPlatform?: boolean; color?: string }[];
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
            initial={{ opacity: 0 }} animate={{ opacity: 0.5 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black z-[79]" onClick={onClose}
          />
          <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 36 }}
            className="fixed bottom-0 left-0 right-0 z-[80] bg-zinc-900 border-t border-white/10 rounded-t-3xl flex flex-col sm:left-1/2 sm:right-auto sm:-translate-x-1/2 sm:w-[480px]"
            style={{ maxHeight: '70vh' }}
          >
            <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
              <div className="w-10 h-1 bg-white/20 rounded-full" />
            </div>
            <div className="flex items-center justify-between px-6 py-3 flex-shrink-0">
              <h3 className="text-white font-semibold text-base">{title}</h3>
              <button onClick={onClose} className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-zinc-400">
                <X size={14} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-3 pb-[max(env(safe-area-inset-bottom),20px)]">
              {options.map((opt, i) => (
                <button
                  key={opt.value} type="button"
                  onClick={() => { onSelect(opt.value); onClose(); }}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-left transition-colors',
                    i < options.length - 1 && 'mb-0.5',
                    value === opt.value ? 'bg-indigo-500/15 text-white' : 'text-zinc-300 hover:bg-white/[0.04]',
                  )}
                >
                  {opt.isPlatform ? (
                    <span className="w-7 flex items-center justify-center">
                      <PlatformLogo platform={opt.value} size={20} color={value === opt.value ? opt.color : '#71717a'} />
                    </span>
                  ) : (
                    <span className="text-xl w-7 text-center">{opt.emoji}</span>
                  )}
                  <span className="flex-1 font-medium text-sm">{opt.label}</span>
                  {value === opt.value && <Check size={16} className="text-indigo-400 flex-shrink-0" />}
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
  // Core form state
  const [title, setTitle] = useState('');
  const [durationRaw, setDurationRaw] = useState('');
  const [durationMode, setDurationMode] = useState<DurationMode>('min');
  const [platform, setPlatform] = useState('');
  const [genre, setGenre] = useState('');
  const [activePicker, setActivePicker] = useState<PickerType>(null);

  // TMDB state
  const [searchResults, setSearchResults] = useState<TmdbSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [tmdbId, setTmdbId] = useState<number | null>(null);
  const [posterPath, setPosterPath] = useState<string | null>(null);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (searchTimerRef.current) clearTimeout(searchTimerRef.current); }, []);

  useEffect(() => {
    if (!open) return;
    if (editMovie) {
      setTitle(editMovie.title);
      setDurationRaw(String(editMovie.duration_minutes));
      setDurationMode('min');
      setPlatform(editMovie.platform);
      setGenre(editMovie.genre);
      setTmdbId(editMovie.tmdb_id ?? null);
      setPosterPath(editMovie.poster_path ?? null);
    } else {
      setTitle('');
      setDurationRaw('');
      setDurationMode('min');
      setPlatform('');
      setGenre('');
      setTmdbId(null);
      setPosterPath(null);
    }
    setSearchResults([]);
    setActivePicker(null);
  }, [editMovie, open]);

  // Title field doubles as search input
  const handleTitleChange = (value: string) => {
    setTitle(value);
    // Clear TMDB selection if user edits the title manually
    if (posterPath) { setPosterPath(null); setTmdbId(null); }

    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    if (value.trim().length < 2) { setSearchResults([]); setIsSearching(false); return; }

    setIsSearching(true);
    searchTimerRef.current = setTimeout(async () => {
      try {
        const res = await tmdbApi.search(value.trim());
        setSearchResults(res.data.results ?? []);
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 380);
  };

  const handleTmdbSelect = async (result: TmdbSearchResult) => {
    setTitle(result.title);
    setPosterPath(result.poster_path);
    setTmdbId(result.tmdb_id);
    setSearchResults([]);
    setIsLoadingDetail(true);
    try {
      const res = await tmdbApi.movie(result.tmdb_id);
      const d = res.data;
      if (d.runtime && d.runtime > 0) {
        setDurationRaw(String(Math.min(d.runtime, 600)));
        setDurationMode('min');
      }
      if (d.genre && GENRES.find((g) => g.value === d.genre)) setGenre(d.genre);
    } catch {
      // Title and poster already set; user fills duration/genre manually
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const parsedMinutes = parseDuration(durationRaw, durationMode);
  const canSubmit = !loading && !!title.trim() && parsedMinutes !== null && parsedMinutes > 0 && !!platform && !!genre;
  const selectedPlatform = PLATFORMS.find((p) => p.value === platform);
  const selectedGenre = GENRES.find((g) => g.value === genre);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || parsedMinutes === null) return;
    onSubmit({ title, duration_minutes: parsedMinutes, platform, genre, tmdb_id: tmdbId ?? undefined, poster_path: posterPath ?? undefined });
  };

  const switchMode = (m: DurationMode) => {
    if (m !== durationMode && parsedMinutes !== null) {
      setDurationRaw(m === 'hm'
        ? (parsedMinutes % 60 > 0 ? `${Math.floor(parsedMinutes / 60)}h ${parsedMinutes % 60}` : `${Math.floor(parsedMinutes / 60)}h`)
        : String(parsedMinutes));
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
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-[60] backdrop-blur-sm"
              onClick={onClose}
            />
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 32 }}
              className="fixed bottom-0 left-0 right-0 z-[61] bg-zinc-950 border-t border-white/10 rounded-t-3xl flex flex-col sm:left-1/2 sm:right-auto sm:-translate-x-1/2 sm:w-[480px]"
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
                <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-zinc-400">
                  <X size={16} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-6 pb-4">
                <form id="add-movie-form" onSubmit={handleSubmit} className="space-y-4 pt-1">

                  {/* Title + TMDB search — same field */}
                  <div className="space-y-2">
                    {/* Selected movie card */}
                    <AnimatePresence>
                      {posterPath && (
                        <motion.div
                          initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                          className="flex items-center gap-3 bg-zinc-900 border border-white/[0.08] rounded-2xl p-3"
                        >
                          <div className="w-10 h-[60px] rounded-lg overflow-hidden flex-shrink-0 bg-zinc-800">
                            {isLoadingDetail ? (
                              <div className="w-full h-full flex items-center justify-center">
                                <Loader2 size={14} className="text-indigo-400 animate-spin" />
                              </div>
                            ) : (
                              <Image
                                src={`https://image.tmdb.org/t/p/w92${posterPath}`}
                                alt={title}
                                width={40}
                                height={60}
                                className="w-full h-full object-cover"
                                unoptimized
                              />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-sm font-semibold truncate">{title}</p>
                            <p className="text-indigo-400 text-xs mt-0.5">Datos de TMDB</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => { setPosterPath(null); setTmdbId(null); }}
                            className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-zinc-400 hover:text-zinc-200 flex-shrink-0"
                          >
                            <X size={12} />
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Search / title input */}
                    <div className="relative">
                      <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
                      <Input
                        value={title}
                        onChange={(e) => handleTitleChange(e.target.value)}
                        placeholder="Nombre de la película..."
                        className="bg-white/[0.04] border-white/[0.08] text-white placeholder:text-zinc-600 rounded-xl h-12 pl-10 pr-10"
                        autoComplete="off"
                        required
                      />
                      {isSearching ? (
                        <Loader2 size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 animate-spin" />
                      ) : title ? (
                        <button
                          type="button"
                          onClick={() => { setTitle(''); setSearchResults([]); setPosterPath(null); setTmdbId(null); }}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                        >
                          <X size={14} />
                        </button>
                      ) : null}
                    </div>

                    {/* Dropdown results */}
                    <AnimatePresence>
                      {searchResults.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                          transition={{ duration: 0.14 }}
                          className="bg-zinc-900 rounded-xl border border-white/[0.08] overflow-hidden"
                        >
                          {searchResults.map((result, i) => (
                            <button
                              key={result.tmdb_id}
                              type="button"
                              onClick={() => handleTmdbSelect(result)}
                              className={cn(
                                'w-full flex items-center gap-3 p-3 hover:bg-white/[0.05] active:bg-white/[0.08] transition-colors text-left',
                                i < searchResults.length - 1 && 'border-b border-white/[0.05]',
                              )}
                            >
                              <div className="w-8 h-12 rounded-md overflow-hidden flex-shrink-0 bg-zinc-800">
                                {result.poster_path ? (
                                  <Image
                                    src={`https://image.tmdb.org/t/p/w92${result.poster_path}`}
                                    alt={result.title}
                                    width={32}
                                    height={48}
                                    className="w-full h-full object-cover"
                                    unoptimized
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <Film size={12} className="text-zinc-600" />
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-white text-sm font-medium truncate">{result.title}</p>
                                {result.year && <p className="text-zinc-500 text-xs">{result.year}</p>}
                              </div>
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
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
                        <span className="flex items-center gap-2 text-white text-sm font-medium">
                          <PlatformLogo platform={selectedPlatform.value} size={16} color={selectedPlatform.color} />
                          {selectedPlatform.label}
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
                        <span className="text-white text-sm font-medium">{selectedGenre.emoji} {selectedGenre.label}</span>
                      ) : (
                        <span className="text-zinc-600 text-sm">Selecciona género</span>
                      )}
                      <ChevronRight size={16} className="text-zinc-600" />
                    </button>
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
                            key={m} type="button" onClick={() => switchMode(m)}
                            className={cn(
                              'px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all',
                              durationMode === m ? 'bg-indigo-500 text-white' : 'text-zinc-500 hover:text-zinc-300',
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
                  </div>
                </form>
              </div>

              {/* Footer */}
              <div className="flex-shrink-0 px-6 pt-3 pb-[max(env(safe-area-inset-bottom),20px)] border-t border-white/[0.06]">
                <Button
                  form="add-movie-form" type="submit" disabled={!canSubmit}
                  className="w-full h-12 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-semibold"
                >
                  {loading ? 'Guardando...' : editMovie ? 'Guardar cambios' : 'Añadir película'}
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <PickerSheet
        open={activePicker === 'platform'}
        title="Plataforma"
        options={PLATFORMS.map(p => ({ ...p, isPlatform: true }))}
        value={platform}
        onSelect={setPlatform}
        onClose={() => setActivePicker(null)}
      />
      <PickerSheet open={activePicker === 'genre'} title="Género" options={GENRES} value={genre} onSelect={setGenre} onClose={() => setActivePicker(null)} />
    </>
  );
}
