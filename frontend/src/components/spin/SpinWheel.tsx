'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Shuffle, X } from 'lucide-react';
import { PlatformLogo } from '@/components/ui/PlatformLogo';
import { Movie } from '@/types';
import { getPlatform, getGenre } from '@/lib/constants';

const SEGMENT_COLORS = [
  '#6366f1', '#8b5cf6', '#a855f7', '#ec4899',
  '#f43f5e', '#f97316', '#f59e0b', '#84cc16',
  '#10b981', '#14b8a6', '#06b6d4', '#3b82f6',
];

const SIZE = 300;
const CX = SIZE / 2;
const CY = SIZE / 2;
const R = SIZE / 2 - 6;

function polar(cx: number, cy: number, r: number, deg: number) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function slicePath(startDeg: number, endDeg: number) {
  const s = polar(CX, CY, R, startDeg);
  const e = polar(CX, CY, R, endDeg);
  const large = endDeg - startDeg > 180 ? 1 : 0;
  return `M${CX},${CY} L${s.x.toFixed(2)},${s.y.toFixed(2)} A${R},${R} 0 ${large} 1 ${e.x.toFixed(2)},${e.y.toFixed(2)} Z`;
}

function truncate(text: string, max: number) {
  return text.length > max ? text.slice(0, max - 1) + '…' : text;
}

interface SpinWheelProps {
  movies: Movie[];
  onSpin: () => Promise<Movie | null>;
  onWatch: (movie: Movie) => void;
}

export function SpinWheel({ movies, onSpin, onWatch }: SpinWheelProps) {
  const [spinning, setSpinning] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [wheelRotation, setWheelRotation] = useState(0);
  const [result, setResult] = useState<Movie | null>(null);
  const [showResult, setShowResult] = useState(false);
  const rotRef = useRef(0);

  const n = movies.length;
  const segAngle = n > 0 ? 360 / n : 360;
  const fontSize = n <= 5 ? 11 : n <= 8 ? 9.5 : n <= 12 ? 8 : 7;
  const maxChars = n <= 5 ? 15 : n <= 8 ? 12 : n <= 12 ? 10 : 8;

  const handleSpin = async () => {
    if (spinning || n === 0) return;
    setSpinning(true);
    setShowResult(false);
    setResult(null);

    const movie = await onSpin();
    if (!movie) { setSpinning(false); return; }

    const idx = Math.max(movies.findIndex((m) => m.id === movie.id), 0);
    const segCenter = idx * segAngle + segAngle / 2;
    const targetAngle = (360 - segCenter + 360) % 360;
    const currentNorm = rotRef.current % 360;
    const delta = (targetAngle - currentNorm + 360) % 360;
    const finalRot = rotRef.current + 5 * 360 + (delta === 0 ? 360 : delta);

    rotRef.current = finalRot;
    setIsAnimating(true);
    setWheelRotation(finalRot);

    await new Promise((r) => setTimeout(r, 4300));
    setIsAnimating(false);
    setResult(movie);
    setShowResult(true);
    setSpinning(false);
  };

  const handleAnother = () => {
    setShowResult(false);
    setTimeout(() => handleSpin(), 100);
  };

  const platform = result ? getPlatform(result.platform) : null;
  const genre = result ? getGenre(result.genre) : null;

  return (
    <div className="flex flex-col items-center px-5 pt-2">

      {/* Wheel */}
      <div className="relative flex items-center justify-center mb-6">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-10 drop-shadow-md">
          <svg width="22" height="18">
            <polygon points="11,18 1,0 21,0" fill="#fff" opacity="0.95" />
          </svg>
        </div>

        <motion.div
          animate={{ rotate: wheelRotation }}
          transition={isAnimating ? { duration: 4, ease: [0.05, 0.4, 0.1, 1.0] } : { duration: 0 }}
          className="rounded-full overflow-hidden shadow-[0_0_50px_-10px_rgba(99,102,241,0.55)]"
        >
          {n === 0 ? (
            <svg width={SIZE} height={SIZE}>
              <circle cx={CX} cy={CY} r={R} fill="#18181b" stroke="#27272a" strokeWidth={2} />
              <text x={CX} y={CY - 10} textAnchor="middle" fill="#52525b" fontSize={13}>Sin</text>
              <text x={CX} y={CY + 10} textAnchor="middle" fill="#52525b" fontSize={13}>películas</text>
            </svg>
          ) : (
            <svg width={SIZE} height={SIZE}>
              {movies.map((movie, i) => {
                const startDeg = i * segAngle;
                const endDeg = (i + 1) * segAngle;
                const midDeg = startDeg + segAngle / 2;
                const color = SEGMENT_COLORS[i % SEGMENT_COLORS.length];
                const textR = R * 0.63;
                const tp = polar(CX, CY, textR, midDeg);
                const textRot = midDeg > 90 && midDeg < 270 ? midDeg + 180 : midDeg;
                return (
                  <g key={movie.id}>
                    <path d={slicePath(startDeg, endDeg)} fill={color} stroke="#09090b" strokeWidth={1.5} />
                    {segAngle >= 18 && (
                      <text
                        x={tp.x} y={tp.y}
                        textAnchor="middle" dominantBaseline="middle"
                        fill="rgba(255,255,255,0.92)"
                        fontSize={fontSize} fontWeight="700"
                        transform={`rotate(${textRot},${tp.x},${tp.y})`}
                        style={{ userSelect: 'none', pointerEvents: 'none' }}
                      >
                        {truncate(movie.title, maxChars)}
                      </text>
                    )}
                  </g>
                );
              })}
              <circle cx={CX} cy={CY} r={22} fill="#09090b" />
              <circle cx={CX} cy={CY} r={10} fill="#6366f1" />
            </svg>
          )}
        </motion.div>
      </div>

      {/* Spin button */}
      {!showResult && (
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleSpin}
          disabled={spinning || n === 0}
          className="w-full max-w-sm h-12 bg-indigo-500/90 hover:bg-indigo-500 disabled:opacity-35 disabled:cursor-not-allowed text-white font-semibold text-base rounded-2xl shadow-[0_4px_24px_-6px_rgba(99,102,241,0.5)] transition-all border border-indigo-400/20"
        >
          {spinning ? 'Eligiendo...' : '¿Qué vemos hoy?'}
        </motion.button>
      )}

      <div className="h-8 flex items-center justify-center mt-2">
        {!showResult && (
          <p className="text-zinc-600 text-xs text-center">
            {n > 0
              ? `${n} película${n !== 1 ? 's' : ''} en espera`
              : 'Añade películas a la lista primero'}
          </p>
        )}
      </div>

      {/* Result modal */}
      <AnimatePresence>
        {showResult && result && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="fixed inset-0 bg-black/80 z-[70] backdrop-blur-md"
              onClick={() => setShowResult(false)}
            />

            <motion.div
              key="result-card"
              initial={{ opacity: 0, scale: 0.6, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85, y: 20 }}
              transition={{ type: 'spring', stiffness: 380, damping: 26 }}
              className="fixed inset-x-5 top-1/2 -translate-y-1/2 z-[71] max-w-sm mx-auto"
            >
              {/* Glow */}
              <div className="absolute -inset-px rounded-3xl bg-gradient-to-b from-indigo-500/40 to-purple-500/10 blur-sm" />

              <div className="relative bg-zinc-950 rounded-3xl border border-white/10 overflow-hidden shadow-2xl">

                {/* Close button — always on top */}
                <button
                  onClick={() => setShowResult(false)}
                  className="absolute top-3.5 right-3.5 z-10 w-7 h-7 rounded-full bg-zinc-950/70 backdrop-blur-sm flex items-center justify-center text-zinc-300 hover:text-white transition-colors"
                >
                  <X size={14} />
                </button>

                {/* Poster OR accent bar */}
                {result.poster_path ? (
                  <div className="relative w-full h-44 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`https://image.tmdb.org/t/p/w342${result.poster_path}`}
                      alt={result.title}
                      className="w-full h-full object-cover object-center"
                    />
                    {/* Cinematic fade */}
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/30 to-transparent" />
                    {/* Label over poster */}
                    <div className="absolute bottom-3 left-5 flex items-center gap-2">
                      <motion.span
                        animate={{ rotate: [0, -15, 15, -10, 10, 0] }}
                        transition={{ delay: 0.3, duration: 0.6 }}
                        className="text-xl"
                      >
                        🎬
                      </motion.span>
                      <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">
                        Esta noche toca...
                      </span>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="h-1 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
                    <div className="px-6 pt-6">
                      <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 }}
                        className="flex items-center gap-2 mb-4"
                      >
                        <motion.span
                          animate={{ rotate: [0, -15, 15, -10, 10, 0] }}
                          transition={{ delay: 0.3, duration: 0.6 }}
                          className="text-2xl"
                        >
                          🎬
                        </motion.span>
                        <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">
                          Esta noche toca...
                        </span>
                      </motion.div>
                    </div>
                  </>
                )}

                <div className={result.poster_path ? 'px-6 pt-4 pb-6' : 'px-6 pb-6'}>
                  {/* Title */}
                  <motion.h2
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, type: 'spring', stiffness: 300 }}
                    className="text-2xl font-bold text-white leading-tight mb-3"
                  >
                    {result.title}
                  </motion.h2>

                  {/* Meta */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.28 }}
                    className="flex items-center gap-2 flex-wrap mb-5"
                  >
                    <span className="text-sm text-zinc-400">{result.duration_formatted}</span>
                    {platform && (
                      <span
                        className="inline-flex items-center gap-1.5 text-sm font-medium px-2.5 py-1 rounded-full"
                        style={{ backgroundColor: `${platform.color}20`, color: platform.color }}
                      >
                        <PlatformLogo platform={result.platform} size={13} color={platform.color} />
                        {platform.label}
                      </span>
                    )}
                    {genre && (
                      <span className="text-sm text-zinc-400">{genre.emoji} {genre.label}</span>
                    )}
                  </motion.div>

                  {/* Actions */}
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.33 }}
                    className="flex flex-col gap-3"
                  >
                    <motion.button
                      whileTap={{ scale: 0.96 }}
                      onClick={() => { setShowResult(false); onWatch(result); }}
                      className="w-full h-12 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors shadow-[0_4px_20px_-4px_rgba(99,102,241,0.5)]"
                    >
                      <Play size={16} fill="white" /> Ver esta película
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.96 }}
                      onClick={handleAnother}
                      disabled={spinning}
                      className="w-full h-12 bg-white/[0.06] hover:bg-white/10 text-zinc-300 font-medium rounded-xl flex items-center justify-center gap-2 transition-colors border border-white/[0.08] disabled:opacity-50"
                    >
                      <Shuffle size={15} /> Otra opción
                    </motion.button>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
