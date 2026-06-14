'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Shuffle } from 'lucide-react';
import { Movie } from '@/types';
import { getPlatform, getGenre } from '@/lib/constants';
import { scaleIn } from '@/lib/animations';

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
  const rotRef = useRef(0);

  const n = movies.length;
  const segAngle = n > 0 ? 360 / n : 360;
  const fontSize = n <= 5 ? 11 : n <= 8 ? 9.5 : n <= 12 ? 8 : 7;
  const maxChars = n <= 5 ? 15 : n <= 8 ? 12 : n <= 12 ? 10 : 8;

  const handleSpin = async () => {
    if (spinning || n === 0) return;
    setSpinning(true);
    setResult(null);

    const movie = await onSpin();
    if (!movie) { setSpinning(false); return; }

    const idx = Math.max(movies.findIndex((m) => m.id === movie.id), 0);
    const segCenter = idx * segAngle + segAngle / 2;

    // Calculate rotation so the pointer (top) lands on the winning segment
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
    setSpinning(false);
  };

  const platform = result ? getPlatform(result.platform) : null;
  const genre = result ? getGenre(result.genre) : null;

  return (
    <div className="flex flex-col items-center px-5 pt-2">

      {/* Wheel */}
      <div className="relative flex items-center justify-center mb-6">

        {/* Pointer triangle */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-10 drop-shadow-md">
          <svg width="22" height="18">
            <polygon points="11,18 1,0 21,0" fill="#fff" opacity="0.95" />
          </svg>
        </div>

        <motion.div
          animate={{ rotate: wheelRotation }}
          transition={
            isAnimating
              ? { duration: 4, ease: [0.05, 0.4, 0.1, 1.0] }
              : { duration: 0 }
          }
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
                // Flip text so it's always readable (not upside down)
                const textRot = midDeg > 90 && midDeg < 270 ? midDeg + 180 : midDeg;

                return (
                  <g key={movie.id}>
                    <path
                      d={slicePath(startDeg, endDeg)}
                      fill={color}
                      stroke="#09090b"
                      strokeWidth={1.5}
                    />
                    {segAngle >= 18 && (
                      <text
                        x={tp.x}
                        y={tp.y}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fill="rgba(255,255,255,0.92)"
                        fontSize={fontSize}
                        fontWeight="700"
                        transform={`rotate(${textRot},${tp.x},${tp.y})`}
                        style={{ userSelect: 'none', pointerEvents: 'none' }}
                      >
                        {truncate(movie.title, maxChars)}
                      </text>
                    )}
                  </g>
                );
              })}
              {/* Center hub */}
              <circle cx={CX} cy={CY} r={22} fill="#09090b" />
              <circle cx={CX} cy={CY} r={10} fill="#6366f1" />
            </svg>
          )}
        </motion.div>
      </div>

      {/* Result / idle state */}
      <AnimatePresence mode="wait">
        {result ? (
          <motion.div key={result.id} {...scaleIn} className="w-full max-w-sm mb-6">
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
                {genre && <span className="text-sm text-zinc-400">{genre.emoji} {genre.label}</span>}
              </div>
              <div className="flex flex-col gap-3 mt-6">
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={() => onWatch(result)}
                  className="w-full h-12 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors"
                >
                  <Play size={16} fill="white" /> Ver esta película
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={handleSpin}
                  disabled={spinning}
                  className="w-full h-12 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                >
                  <Shuffle size={15} /> Otra opción
                </motion.button>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center mb-6"
          >
            <p className="text-zinc-400 text-sm">
              {n > 0
                ? `${n} película${n !== 1 ? 's' : ''} en espera`
                : 'No hay películas pendientes'}
            </p>
            {n === 0 && (
              <p className="text-zinc-600 text-xs mt-1">Añade películas a la lista primero</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Spin button */}
      {!result && (
        <motion.button
          whileTap={{ scale: 0.94 }}
          onClick={handleSpin}
          disabled={spinning || n === 0}
          className="w-full max-w-sm h-14 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-lg rounded-2xl shadow-[0_4px_30px_-6px_rgba(99,102,241,0.6)] transition-all"
        >
          {spinning ? 'Eligiendo...' : '¿Qué vemos hoy?'}
        </motion.button>
      )}
    </div>
  );
}
