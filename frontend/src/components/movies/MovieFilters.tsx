'use client';

import { useState } from 'react';
import { SlidersHorizontal, X } from 'lucide-react';
import { PLATFORMS, GENRES } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface Filters {
  platform?: string;
  genre?: string;
  max_duration?: number;
}

interface MovieFiltersProps {
  filters: Filters;
  onChange: (filters: Filters) => void;
}

export function MovieFilters({ filters, onChange }: MovieFiltersProps) {
  const [open, setOpen] = useState(false);
  const hasFilters = !!(filters.platform || filters.genre || filters.max_duration);

  const clear = () => onChange({});

  return (
    <div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => setOpen(!open)}
          className={cn(
            'flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors',
            open || hasFilters
              ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
              : 'bg-zinc-900 text-zinc-400 border border-zinc-800'
          )}
        >
          <SlidersHorizontal size={14} />
          Filtros
          {hasFilters && (
            <span className="bg-indigo-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
              !
            </span>
          )}
        </button>
        {hasFilters && (
          <button onClick={clear} className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300">
            <X size={12} /> Limpiar
          </button>
        )}
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="pt-4 space-y-4">
              {/* Platform filter */}
              <div>
                <p className="text-xs text-zinc-500 mb-2">Plataforma</p>
                <div className="flex flex-wrap gap-2">
                  {PLATFORMS.map((p) => (
                    <button
                      key={p.value}
                      onClick={() =>
                        onChange({ ...filters, platform: filters.platform === p.value ? undefined : p.value })
                      }
                      className={cn(
                        'text-xs px-3 py-1.5 rounded-full border transition-colors',
                        filters.platform === p.value
                          ? 'border-indigo-500 bg-indigo-500/20 text-indigo-300'
                          : 'border-zinc-800 bg-zinc-900 text-zinc-400'
                      )}
                    >
                      {p.emoji} {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Genre filter */}
              <div>
                <p className="text-xs text-zinc-500 mb-2">Género</p>
                <div className="flex flex-wrap gap-2">
                  {GENRES.map((g) => (
                    <button
                      key={g.value}
                      onClick={() =>
                        onChange({ ...filters, genre: filters.genre === g.value ? undefined : g.value })
                      }
                      className={cn(
                        'text-xs px-3 py-1.5 rounded-full border transition-colors',
                        filters.genre === g.value
                          ? 'border-indigo-500 bg-indigo-500/20 text-indigo-300'
                          : 'border-zinc-800 bg-zinc-900 text-zinc-400'
                      )}
                    >
                      {g.emoji} {g.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Duration filter */}
              <div>
                <p className="text-xs text-zinc-500 mb-2">
                  Duración máxima{filters.max_duration ? `: ${filters.max_duration}min` : ''}
                </p>
                <input
                  type="range"
                  min={60}
                  max={240}
                  step={15}
                  value={filters.max_duration || 240}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    onChange({ ...filters, max_duration: val < 240 ? val : undefined });
                  }}
                  className="w-full accent-indigo-500"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
