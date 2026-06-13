'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shuffle, Play } from 'lucide-react';
import { Movie } from '@/types';
import { getPlatform, getGenre } from '@/lib/constants';
import { scaleIn } from '@/lib/animations';

interface SpinWheelProps {
  onSpin: () => Promise<Movie | null>;
  onWatch: (movie: Movie) => void;
  totalPending: number;
}

export function SpinWheel({ onSpin, onWatch, totalPending }: SpinWheelProps) {
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<Movie | null>(null);

  const handleSpin = async () => {
    setSpinning(true);
    setResult(null);
    await new Promise((r) => setTimeout(r, 900));
    const movie = await onSpin();
    setResult(movie);
    setSpinning(false);
  };

  const platform = result ? getPlatform(result.platform) : null;
  const genre = result ? getGenre(result.genre) : null;

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6">
      {/* Spinning animation area */}
      <div className="relative mb-12">
        <motion.div
          animate={spinning ? { rotate: 720 } : { rotate: 0 }}
          transition={spinning ? { duration: 0.9, ease: 'easeInOut' } : { duration: 0 }}
          className="w-32 h-32 rounded-full bg-zinc-900 border-4 border-indigo-500/30 flex items-center justify-center shadow-[0_0_60px_-10px_rgba(99,102,241,0.4)]"
        >
          <span className="text-5xl select-none">🎬</span>
        </motion.div>

        {spinning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 rounded-full border-4 border-indigo-500/50 border-t-indigo-500"
            style={{ animation: 'spin 0.6s linear infinite' }}
          />
        )}
      </div>

      {/* Result card */}
      <AnimatePresence mode="wait">
        {result ? (
          <motion.div
            key={result.id}
            {...scaleIn}
            className="w-full max-w-sm mb-8"
          >
            <div className="bg-zinc-900 rounded-3xl border border-white/8 p-6 shadow-2xl">
              <p className="text-xs font-medium text-indigo-400 uppercase tracking-widest mb-3">
                ¡Esta noche toca...
              </p>
              <h2 className="text-2xl font-bold text-white leading-tight mb-4">{result.title}</h2>
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-sm text-zinc-400">{result.duration_formatted}</span>
                {platform && (
                  <span
                    className="text-sm font-medium px-2.5 py-1 rounded-full"
                    style={{ backgroundColor: `${platform.color}20`, color: platform.color }}
                  >
                    {platform.emoji} {platform.label}
                  </span>
                )}
                {genre && (
                  <span className="text-sm text-zinc-400">
                    {genre.emoji} {genre.label}
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-3 mt-6">
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={() => onWatch(result)}
                  className="w-full h-12 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors"
                >
                  <Play size={18} fill="white" /> Ver esta película
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={handleSpin}
                  className="w-full h-12 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium rounded-xl flex items-center justify-center gap-2 transition-colors"
                >
                  <Shuffle size={16} /> Otra opción
                </motion.button>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center mb-8"
          >
            <p className="text-zinc-400 text-base">
              {totalPending > 0
                ? `${totalPending} película${totalPending !== 1 ? 's' : ''} en espera`
                : 'No hay películas pendientes'}
            </p>
            {totalPending === 0 && (
              <p className="text-zinc-600 text-sm mt-2">Añade películas a la lista primero</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main spin button */}
      {!result && (
        <motion.button
          whileTap={{ scale: 0.94 }}
          onClick={handleSpin}
          disabled={spinning || totalPending === 0}
          className="w-full max-w-sm h-14 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-lg rounded-2xl flex items-center justify-center gap-3 shadow-[0_4px_30px_-6px_rgba(99,102,241,0.6)] transition-all"
        >
          {spinning ? (
            <>
              <span className="animate-spin">🎬</span> Eligiendo...
            </>
          ) : (
            <>
              <Shuffle size={22} /> ¿Qué vemos hoy?
            </>
          )}
        </motion.button>
      )}

      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
