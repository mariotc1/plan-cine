'use client';

import { useState } from 'react';
import { SlidersHorizontal, X } from 'lucide-react';
import { PLATFORMS, GENRES } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { formatDuration } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { MovieFiltersState } from '@/stores/filterStore';

interface MovieFiltersProps {
  filters: MovieFiltersState;
  onChange: (filters: MovieFiltersState) => void;
}

export function MovieFilters({ filters, onChange }: MovieFiltersProps) {
  const [open, setOpen] = useState(false);

  const activeCount = [filters.platform, filters.genre, filters.max_duration].filter(Boolean).length;
  const hasFilters = activeCount > 0;

  const activePlatform = PLATFORMS.find((p) => p.value === filters.platform);
  const activeGenre = GENRES.find((g) => g.value === filters.genre);

  return (
    <>
      {/* Trigger row */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => setOpen(true)}
          className={cn(
            'flex items-center gap-1.5 h-8 px-3 rounded-full text-xs font-semibold transition-all flex-shrink-0',
            hasFilters
              ? 'bg-indigo-500 text-white shadow-[0_2px_12px_-2px_rgba(99,102,241,0.45)]'
              : 'bg-zinc-800 text-zinc-400 border border-zinc-700/50',
          )}
        >
          <SlidersHorizontal size={12} />
          Filtrar
          {activeCount > 0 && (
            <span className="bg-white/25 rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold">
              {activeCount}
            </span>
          )}
        </button>

        <AnimatePresence>
          {activePlatform && (
            <motion.button
              key="plat"
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              onClick={() => onChange({ ...filters, platform: undefined })}
              className="flex items-center gap-1 h-8 pl-2.5 pr-2 rounded-full text-xs font-medium border border-white/10 bg-zinc-800/80"
              style={{ color: activePlatform.color }}
            >
              {activePlatform.emoji} {activePlatform.label}
              <X size={10} className="ml-0.5 opacity-60" />
            </motion.button>
          )}
          {activeGenre && (
            <motion.button
              key="genre"
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              onClick={() => onChange({ ...filters, genre: undefined })}
              className="flex items-center gap-1 h-8 pl-2.5 pr-2 rounded-full text-xs font-medium border border-white/10 bg-zinc-800/80 text-zinc-300"
            >
              {activeGenre.emoji} {activeGenre.label}
              <X size={10} className="ml-0.5 opacity-60" />
            </motion.button>
          )}
          {filters.max_duration && (
            <motion.button
              key="dur"
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              onClick={() => onChange({ ...filters, max_duration: undefined })}
              className="flex items-center gap-1 h-8 pl-2.5 pr-2 rounded-full text-xs font-medium border border-white/10 bg-zinc-800/80 text-zinc-300"
            >
              máx. {formatDuration(filters.max_duration)}
              <X size={10} className="ml-0.5 opacity-60" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Filter bottom sheet */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-[60] backdrop-blur-sm"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 32 }}
              className="fixed bottom-0 left-0 right-0 z-[61] bg-zinc-950 border-t border-white/10 rounded-t-3xl"
            >
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 bg-white/20 rounded-full" />
              </div>
              <div className="flex items-center justify-between px-6 py-3">
                <h2 className="text-white font-bold text-lg">Filtrar películas</h2>
                <div className="flex items-center gap-3">
                  {hasFilters && (
                    <button
                      onClick={() => { onChange({}); }}
                      className="text-xs text-indigo-400 font-semibold"
                    >
                      Limpiar todo
                    </button>
                  )}
                  <button
                    onClick={() => setOpen(false)}
                    className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-zinc-400"
                  >
                    <X size={15} />
                  </button>
                </div>
              </div>

              <div className="px-6 pb-[max(env(safe-area-inset-bottom),28px)] space-y-6 overflow-y-auto max-h-[70vh]">
                {/* Platform */}
                <div>
                  <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest mb-3">
                    Plataforma
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {PLATFORMS.map((p) => {
                      const active = filters.platform === p.value;
                      return (
                        <button
                          key={p.value}
                          onClick={() =>
                            onChange({ ...filters, platform: active ? undefined : p.value })
                          }
                          className={cn(
                            'flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all border',
                            active
                              ? 'text-white'
                              : 'bg-white/5 text-zinc-400 border-white/[0.06]',
                          )}
                          style={
                            active
                              ? {
                                  backgroundColor: `${p.color}22`,
                                  borderColor: `${p.color}55`,
                                  color: p.color,
                                }
                              : {}
                          }
                        >
                          {p.emoji} {p.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Genre */}
                <div>
                  <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest mb-3">
                    Género
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {GENRES.map((g) => {
                      const active = filters.genre === g.value;
                      return (
                        <button
                          key={g.value}
                          onClick={() =>
                            onChange({ ...filters, genre: active ? undefined : g.value })
                          }
                          className={cn(
                            'flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all border',
                            active
                              ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                              : 'bg-white/5 text-zinc-400 border-white/[0.06]',
                          )}
                        >
                          {g.emoji} {g.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Duration */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest">
                      Duración máxima
                    </p>
                    <span
                      className={cn(
                        'text-sm font-bold',
                        filters.max_duration ? 'text-indigo-400' : 'text-zinc-600',
                      )}
                    >
                      {filters.max_duration ? formatDuration(filters.max_duration) : 'Sin límite'}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={60}
                    max={240}
                    step={15}
                    value={filters.max_duration ?? 240}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      onChange({ ...filters, max_duration: val < 240 ? val : undefined });
                    }}
                    className="w-full accent-indigo-500 cursor-pointer"
                  />
                  <div className="flex justify-between mt-2">
                    <span className="text-[11px] text-zinc-600">1h</span>
                    <span className="text-[11px] text-zinc-600">2h</span>
                    <span className="text-[11px] text-zinc-600">3h</span>
                    <span className="text-[11px] text-zinc-600">4h</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
