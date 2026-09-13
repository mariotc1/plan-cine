'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, animate as fmAnimate } from 'framer-motion';
import { Play, Shuffle, X, CalendarDays } from 'lucide-react';
import { PlatformLogo } from '@/components/ui/PlatformLogo';
import { Movie } from '@/types';
import { getPlatform, getGenre } from '@/lib/constants';

// A cohesive indigo → violet → purple → fuchsia → pink family instead of a full
// rainbow — matches the app's own brand palette instead of looking like a
// generic prize wheel. Ordered so adjacent slices alternate light/dark for
// contrast even when only the first few colors are in use.
const SEGMENT_COLORS = [
  '#6366f1', '#c084fc', '#7c3aed', '#f472b6',
  '#8b5cf6', '#e879f9', '#4f46e5', '#d946ef',
  '#a78bfa', '#9333ea', '#818cf8', '#ec4899',
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
  onSchedule?: (movie: Movie) => void;
}

export function SpinWheel({ movies, onSpin, onWatch, onSchedule }: SpinWheelProps) {
  const [spinning, setSpinning] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [result, setResult] = useState<Movie | null>(null);
  const [showResult, setShowResult] = useState(false);
  const rotRef = useRef(0);

  // Driven imperatively (not via the declarative `animate` prop) so onUpdate can
  // fire the pointer "knock" exactly when the wheel crosses a segment boundary,
  // instead of an arbitrary wobble that isn't actually synced to the dividers.
  const wheelRotate = useMotionValue(0);
  const pointerKick = useMotionValue(0);
  const lastBoundaryRef = useRef(0);

  const n = movies.length;
  const segAngle = n > 0 ? 360 / n : 360;
  const fontSize = n <= 5 ? 11 : n <= 8 ? 9.5 : n <= 12 ? 8 : 7;
  const maxChars = n <= 5 ? 15 : n <= 8 ? 12 : n <= 12 ? 10 : 8;

  // Precomputed once so the segment paths and their text labels can be drawn as
  // two separate passes (paths, then a gloss overlay, then text on top of that)
  // without duplicating the trig.
  const segments = movies.map((movie, i) => {
    const startDeg = i * segAngle;
    const endDeg = (i + 1) * segAngle;
    const midDeg = startDeg + segAngle / 2;
    const color = SEGMENT_COLORS[i % SEGMENT_COLORS.length];
    const textR = R * 0.63;
    const tp = polar(CX, CY, textR, midDeg);
    // Radial — reads outward along the wedge, toward its tip at the center.
    const textRot = midDeg > 90 && midDeg < 270 ? midDeg + 180 : midDeg;
    return { movie, startDeg, endDeg, color, tp, textRot };
  });

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
    lastBoundaryRef.current = Math.floor(wheelRotate.get() / segAngle);

    fmAnimate(wheelRotate, finalRot, {
      duration: 4,
      ease: [0.05, 0.4, 0.1, 1.0],
      onUpdate: (v) => {
        // Every time the rotation crosses into a new segment, "knock" the pointer
        // — a quick out-and-spring-back rotation, like it physically hit the
        // divider line between two wedges.
        const boundary = Math.floor(v / segAngle);
        if (boundary !== lastBoundaryRef.current) {
          lastBoundaryRef.current = boundary;
          fmAnimate(pointerKick, [0, -16, 0], { duration: 0.22, ease: 'easeOut' });
        }
      },
    });

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
    <div className="flex flex-col items-center px-5 pt-6 lg:pt-12">

      {/* Wheel — fixed 300×300 viewBox for all the geometry math, but the visual
          size scales with the viewport on desktop (clamped so it's always much
          bigger than mobile without ever pushing the spin button off-screen) */}
      <div className="relative flex items-center justify-center mb-8 w-[min(340px,calc(100vw_-_48px))] h-[min(340px,calc(100vw_-_48px))] lg:w-[clamp(260px,42vh,460px)] lg:h-[clamp(260px,42vh,460px)]">

        {/* Static bezel + elevation shadow — sits outside the rotating disc */}
        <div className="absolute inset-[-8px] rounded-full bg-gradient-to-br from-white/[0.08] via-transparent to-black/30 pointer-events-none" />
        <div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{ boxShadow: '0 24px 60px -18px rgba(99,102,241,0.55), 0 0 0 1px rgba(255,255,255,0.07)' }}
        />

        {/* Pointer — static positioning wrapper (centering) + inner element that only ever
            moves for the spin-time "knock" (pointerKick, driven imperatively in handleSpin
            exactly when the wheel crosses a segment divider). No idle animation — it just
            sits still until the wheel spins. White so it reads clearly against every
            segment color, since the wheel's own palette is all indigo/violet/pink. */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 z-20 lg:scale-125" style={{ transformOrigin: 'top center' }}>
          <motion.div style={{ rotate: pointerKick, transformOrigin: 'top center' }}>
            <svg width="24" height="28" viewBox="0 0 24 28" style={{ filter: 'drop-shadow(0 3px 5px rgba(0,0,0,0.5))' }}>
              <defs>
                <linearGradient id="pointerGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ffffff" />
                  <stop offset="100%" stopColor="#e2e8f0" />
                </linearGradient>
              </defs>
              <path d="M12,27 L2,4 L22,4 Z" fill="url(#pointerGrad)" stroke="#18181b" strokeWidth="1" strokeLinejoin="round" />
            </svg>
          </motion.div>
        </div>

        <motion.div
          style={{ rotate: wheelRotate, boxShadow: 'inset 0 2px 14px rgba(0,0,0,0.45)' }}
          className="rounded-full overflow-hidden w-full h-full ring-1 ring-white/[0.08]"
        >
          {n === 0 ? (
            <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="w-full h-full">
              <circle cx={CX} cy={CY} r={R} fill="#18181b" stroke="#27272a" strokeWidth={2} />
              <text x={CX} y={CY - 10} textAnchor="middle" fill="#52525b" fontSize={13}>Sin</text>
              <text x={CX} y={CY + 10} textAnchor="middle" fill="#52525b" fontSize={13}>películas</text>
            </svg>
          ) : (
            <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="w-full h-full">
              <defs>
                <radialGradient id="glossGrad" cx="35%" cy="28%" r="75%">
                  <stop offset="0%" stopColor="rgba(255,255,255,0.30)" />
                  <stop offset="55%" stopColor="rgba(255,255,255,0.06)" />
                  <stop offset="100%" stopColor="rgba(255,255,255,0)" />
                </radialGradient>
                <radialGradient id="hubGrad" cx="50%" cy="32%" r="75%">
                  <stop offset="0%" stopColor="#a5b4fc" />
                  <stop offset="100%" stopColor="#4338ca" />
                </radialGradient>
              </defs>

              {/* Segments */}
              {segments.map((s) => (
                <path key={s.movie.id} d={slicePath(s.startDeg, s.endDeg)} fill={s.color} stroke="#09090b" strokeWidth={1.5} />
              ))}

              {/* Glass sheen on top of the colors, underneath the labels */}
              <circle cx={CX} cy={CY} r={R} fill="url(#glossGrad)" style={{ pointerEvents: 'none' }} />

              {/* Labels */}
              {segments.map((s) => segAngle >= 18 && (
                <text
                  key={s.movie.id}
                  x={s.tp.x} y={s.tp.y}
                  textAnchor="middle" dominantBaseline="middle"
                  fill="rgba(255,255,255,0.94)"
                  fontSize={fontSize} fontWeight="700"
                  transform={`rotate(${s.textRot},${s.tp.x},${s.tp.y})`}
                  style={{ userSelect: 'none', pointerEvents: 'none' }}
                >
                  {truncate(s.movie.title, maxChars)}
                </text>
              ))}

              {/* Hub — the app's own mark instead of a generic emoji */}
              <circle cx={CX} cy={CY} r={26} fill="#09090b" />
              <circle cx={CX} cy={CY} r={22} fill="url(#hubGrad)" stroke="#312e81" strokeWidth={1.5} />
              <image
                href="/logo.png"
                x={CX - 15} y={CY - 15} width={30} height={30}
                style={{ pointerEvents: 'none' }}
              />
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
          className="h-12 px-10 bg-indigo-500/90 hover:bg-indigo-500 disabled:opacity-35 disabled:cursor-not-allowed text-white font-semibold text-base rounded-2xl shadow-[0_4px_24px_-6px_rgba(99,102,241,0.5)] transition-all border border-indigo-400/20"
        >
          {spinning ? 'Eligiendo...' : '¿Qué vemos hoy?'}
        </motion.button>
      )}

      <div className="h-8 flex items-center justify-center mt-3">
        {!showResult && (
          <p className="text-zinc-500 text-[13px] text-center">
            {n > 0
              ? `${n} película${n !== 1 ? 's' : ''} en la lista`
              : 'Añade películas primero'}
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
                    {onSchedule && (
                      <motion.button
                        whileTap={{ scale: 0.96 }}
                        onClick={() => { setShowResult(false); onSchedule(result); }}
                        className="w-full h-12 bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors border border-amber-500/25"
                      >
                        <CalendarDays size={15} /> Programar para más tarde
                      </motion.button>
                    )}
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
