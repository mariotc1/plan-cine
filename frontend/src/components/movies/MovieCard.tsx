'use client';

import { useState, useCallback } from 'react';
import { motion, useMotionValue, useTransform, animate, AnimatePresence } from 'framer-motion';
import { Clock, Film, ChevronRight, Pencil, Trash2, Eye, Play } from 'lucide-react';
import Image from 'next/image';
import { Movie } from '@/types';
import { getPlatform, getGenre } from '@/lib/constants';
import { staggerItem } from '@/lib/animations';
import { PlatformLogo } from '@/components/ui/PlatformLogo';
import { useLongPress } from '@/hooks/useLongPress';

// Distance (px) the user must drag to trigger the action on release
const TRIGGER = 72;
// Max constraint before elastic resistance kicks in
const MAX_X = TRIGGER + 36;

interface MovieCardProps {
  movie: Movie;
  onTap?: (movie: Movie) => void;
  onEdit?: (movie: Movie) => void;
  onDelete?: (movie: Movie) => void;
  onWatchNow?: (movie: Movie) => void;
}

export function MovieCard({ movie, onTap, onEdit, onDelete, onWatchNow }: MovieCardProps) {
  const platform = getPlatform(movie.platform);
  const genre = getGenre(movie.genre);

  // ─── Swipe state ─────────────────────────────────────────────────────────
  const x = useMotionValue(0);

  // Zones fade in as the card slides — starts from 0, fully visible at TRIGGER
  const deleteOpacity = useTransform(x, [-TRIGGER, -16], [1, 0]);
  const watchOpacity  = useTransform(x, [16, TRIGGER], [0, 1]);

  // Icon pops slightly past the trigger threshold for a tactile "click" feel
  const deleteIconScale = useTransform(x, [-MAX_X, -TRIGGER, -16], [1.18, 1, 0.72]);
  const watchIconScale  = useTransform(x, [16, TRIGGER, MAX_X], [0.72, 1, 1.18]);

  const snapBack = useCallback(() => {
    animate(x, 0, { type: 'spring', stiffness: 500, damping: 40 });
  }, [x]);

  const handleDragEnd = useCallback(
    (_: unknown, info: { offset: { x: number }; velocity: { x: number } }) => {
      const ox = info.offset.x;
      const vx = info.velocity.x;

      if ((ox < -TRIGGER || vx < -600) && onDelete) {
        snapBack();
        onDelete(movie);
      } else if ((ox > TRIGGER || vx > 600) && onWatchNow) {
        snapBack();
        onWatchNow(movie);
      } else {
        snapBack();
      }
    },
    [movie, onDelete, onWatchNow, snapBack]
  );

  const canSwipe = !!(onDelete || onWatchNow);

  // ─── Long-press context menu ──────────────────────────────────────────────
  const [menuOpen, setMenuOpen] = useState(false);
  const { onPointerDown, onPointerMove, onPointerUp, onPointerLeave, didFire } = useLongPress({
    onLongPress: () => {
      if (navigator.vibrate) navigator.vibrate(8);
      setMenuOpen(true);
    },
  });

  const closeMenu = useCallback(() => setMenuOpen(false), []);

  const handleCardClick = useCallback(() => {
    if (didFire()) return;
    onTap?.(movie);
  }, [didFire, onTap, movie]);

  return (
    <motion.div variants={staggerItem} layout className="relative select-none">

      {/*
        Swipe container — overflow-hidden is the key:
        Action zones live INSIDE this container so they are only ever visible
        when the card slides enough to reveal them. Nothing bleeds through on
        tap, long-press or any other interaction. bg-zinc-900 = seamless fill.
      */}
      <div className="relative overflow-hidden rounded-2xl bg-zinc-900">

        {/* Delete zone — right side, revealed on left swipe */}
        {onDelete && (
          <motion.div
            style={{ opacity: deleteOpacity }}
            className="absolute inset-y-0 right-0 w-24 flex flex-col items-center justify-center gap-1.5 bg-red-500"
          >
            <motion.div style={{ scale: deleteIconScale }}>
              <Trash2 size={20} className="text-white" strokeWidth={2.5} />
            </motion.div>
            <span className="text-white text-[10px] font-bold tracking-wide">Eliminar</span>
          </motion.div>
        )}

        {/* Watch zone — left side, revealed on right swipe */}
        {onWatchNow && (
          <motion.div
            style={{ opacity: watchOpacity }}
            className="absolute inset-y-0 left-0 w-24 flex flex-col items-center justify-center gap-1.5 bg-indigo-500"
          >
            <motion.div style={{ scale: watchIconScale }}>
              <Play size={20} className="text-white" fill="white" />
            </motion.div>
            <span className="text-white text-[10px] font-bold tracking-wide">Ver ahora</span>
          </motion.div>
        )}

        {/* Draggable card — z-10 so it always sits on top of the zones */}
        <motion.div
          drag={canSwipe ? 'x' : false}
          dragConstraints={{
            left:  onDelete   ? -MAX_X : 0,
            right: onWatchNow ?  MAX_X : 0,
          }}
          dragElastic={{ left: 0.06, right: 0.06 }}
          onDragEnd={canSwipe ? handleDragEnd : undefined}
          style={{ x }}
          whileTap={{ scale: 0.994 }}
          onClick={handleCardClick}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerLeave}
          className="relative z-10 bg-zinc-900 rounded-2xl border border-white/[0.06] overflow-hidden cursor-pointer"
        >
          {/* Platform accent line */}
          <div
            className="h-[2px] w-full"
            style={{
              background: platform
                ? `linear-gradient(to right, ${platform.color}80, ${platform.color}10)`
                : 'linear-gradient(to right, #6366f180, transparent)',
            }}
          />

          <div className="p-4">
            <div className="flex gap-3.5 items-start">

              {/* Poster */}
              <div className="flex-shrink-0 w-[56px] h-[82px] rounded-xl overflow-hidden ring-1 ring-white/[0.07]">
                {movie.poster_path ? (
                  <Image
                    src={`https://image.tmdb.org/t/p/w185${movie.poster_path}`}
                    alt={movie.title}
                    width={56}
                    height={82}
                    className="w-full h-full object-cover"
                    unoptimized
                  />
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center"
                    style={{ backgroundColor: platform?.color ? `${platform.color}15` : 'rgba(255,255,255,0.04)' }}
                  >
                    <Film size={18} className="text-zinc-600" />
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 pt-0.5">
                <h3 className="text-[15px] font-bold text-white leading-tight line-clamp-2 mb-2">
                  {movie.title}
                </h3>

                <div className="flex items-center gap-2 flex-wrap mb-1.5">
                  {platform && (
                    <span
                      className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: `${platform.color}20`, color: platform.color }}
                    >
                      <PlatformLogo platform={movie.platform} size={10} color={platform.color} />
                      {platform.label}
                    </span>
                  )}
                  {genre && (
                    <span className="text-[11px] text-zinc-500">
                      {genre.emoji} {genre.label}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1 text-[11px] text-zinc-600">
                  <Clock size={10} />
                  <span>{movie.duration_formatted}</span>
                  {movie.added_by && (
                    <>
                      <span className="mx-0.5">·</span>
                      <span className="font-medium truncate" style={{ color: movie.added_by.color }}>
                        {movie.added_by.avatar} {movie.added_by.name}
                      </span>
                    </>
                  )}
                </div>

                {movie.notes && (
                  <p className="mt-1.5 text-[11px] text-zinc-600 line-clamp-1">{movie.notes}</p>
                )}
              </div>

              <ChevronRight size={15} className="text-zinc-700 flex-shrink-0 mt-1.5" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* ── Long-press context menu ── */}
      <AnimatePresence>
        {menuOpen && (
          <>
            <div className="fixed inset-0 z-[50]" onPointerDown={closeMenu} />
            <motion.div
              initial={{ opacity: 0, scale: 0.86, y: 6 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.86, y: 6 }}
              transition={{ type: 'spring', stiffness: 520, damping: 36 }}
              className="absolute top-2 right-2 z-[51] min-w-[184px] overflow-hidden rounded-2xl border border-white/[0.10] bg-zinc-800/95 shadow-2xl shadow-black/60 backdrop-blur-xl"
            >
              <button
                className="w-full flex items-center gap-3 border-b border-white/[0.07] px-4 py-3.5 text-left text-sm font-medium text-white active:bg-white/[0.08]"
                onClick={() => { closeMenu(); onTap?.(movie); }}
              >
                <Eye size={15} className="flex-shrink-0 text-zinc-400" /> Ver detalles
              </button>
              {onWatchNow && (
                <button
                  className="w-full flex items-center gap-3 border-b border-white/[0.07] px-4 py-3.5 text-left text-sm font-medium text-white active:bg-white/[0.08]"
                  onClick={() => { closeMenu(); onWatchNow(movie); }}
                >
                  <Play size={15} className="flex-shrink-0 text-zinc-400" fill="currentColor" /> Ver ahora
                </button>
              )}
              {onEdit && (
                <button
                  className="w-full flex items-center gap-3 border-b border-white/[0.07] px-4 py-3.5 text-left text-sm font-medium text-white active:bg-white/[0.08]"
                  onClick={() => { closeMenu(); onEdit(movie); }}
                >
                  <Pencil size={15} className="flex-shrink-0 text-zinc-400" /> Editar
                </button>
              )}
              {onDelete && (
                <button
                  className="w-full flex items-center gap-3 px-4 py-3.5 text-left text-sm font-medium text-red-400 active:bg-red-500/[0.14]"
                  onClick={() => { closeMenu(); onDelete(movie); }}
                >
                  <Trash2 size={15} className="flex-shrink-0 text-red-400" /> Eliminar
                </button>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
