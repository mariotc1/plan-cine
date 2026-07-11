'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, Play, Pencil, Trash2, Film, ExternalLink } from 'lucide-react';
import Image from 'next/image';
import { Movie } from '@/types';
import { getPlatform, getGenre } from '@/lib/constants';
import { PlatformLogo } from '@/components/ui/PlatformLogo';
import { tmdbApi } from '@/lib/api';

interface MovieDetailSheetProps {
  movie: Movie | null;
  onClose: () => void;
  onWatchNow?: (movie: Movie) => void;
  onEdit?: (movie: Movie) => void;
  onDelete?: (movie: Movie) => void;
}

export function MovieDetailSheet({ movie, onClose, onWatchNow, onEdit, onDelete }: MovieDetailSheetProps) {
  const [trailerKey, setTrailerKey] = useState<string | null>(null);
  const [trailerLoading, setTrailerLoading] = useState(false);

  useEffect(() => {
    if (!movie?.tmdb_id) {
      setTrailerKey(null);
      return;
    }
    setTrailerKey(null);
    setTrailerLoading(true);
    tmdbApi.trailer(movie.tmdb_id)
      .then((res) => setTrailerKey(res.data.key ?? null))
      .catch(() => setTrailerKey(null))
      .finally(() => setTrailerLoading(false));
  }, [movie?.tmdb_id]);

  const platform = movie ? getPlatform(movie.platform) : null;
  const genre = movie ? getGenre(movie.genre) : null;

  return (
    <AnimatePresence>
      {movie && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-[70] backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            className="fixed bottom-0 left-0 right-0 z-[71] bg-zinc-950 border-t border-white/10 rounded-t-3xl overflow-hidden sm:left-1/2 sm:right-auto sm:-translate-x-1/2 sm:w-[480px]"
            style={{ maxHeight: '90vh' }}
          >
            <div className="overflow-y-auto" style={{ maxHeight: '90vh' }}>

              {/* Poster hero */}
              {movie.poster_path ? (
                <div className="relative w-full h-52 overflow-hidden flex-shrink-0">
                  <Image
                    src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                    alt={movie.title}
                    fill
                    className="object-cover object-[center_20%]"
                    unoptimized
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/30 to-transparent" />
                  <button
                    onClick={onClose}
                    className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white/80 hover:text-white transition-colors"
                  >
                    <X size={15} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between px-6 pt-4 pb-1">
                  <div className="w-10 h-1 bg-white/20 rounded-full mx-auto" />
                  <button
                    onClick={onClose}
                    className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
                  >
                    <X size={15} />
                  </button>
                </div>
              )}

              {/* Handle (only when no poster) */}
              {!movie.poster_path && (
                <div className="flex justify-center pt-3 pb-0">
                  <div className="w-10 h-1 bg-white/20 rounded-full" />
                </div>
              )}

              <div className="px-6 pt-4 pb-[max(env(safe-area-inset-bottom),28px)]">

                {/* Title */}
                <h2 className="text-[22px] font-bold text-white leading-tight mb-3 tracking-tight">
                  {movie.title}
                </h2>

                {/* Meta badges */}
                <div className="flex items-center gap-2 flex-wrap mb-3">
                  {platform && (
                    <span
                      className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
                      style={{ backgroundColor: `${platform.color}20`, color: platform.color }}
                    >
                      <PlatformLogo platform={movie.platform} size={11} color={platform.color} />
                      {platform.label}
                    </span>
                  )}
                  {genre && (
                    <span className="text-xs text-zinc-400 bg-zinc-800/70 px-2.5 py-1 rounded-full border border-white/[0.06]">
                      {genre.emoji} {genre.label}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1 text-xs text-zinc-500">
                    <Clock size={11} /> {movie.duration_formatted}
                  </span>
                </div>

                {/* Who added */}
                {movie.added_by && (
                  <p className="text-xs text-zinc-600 mb-4">
                    Añadida por{' '}
                    <span className="font-semibold" style={{ color: movie.added_by.color }}>
                      {movie.added_by.avatar} {movie.added_by.name}
                    </span>
                  </p>
                )}

                {/* Notes */}
                {movie.notes && (
                  <div className="bg-zinc-900/80 rounded-xl p-4 mb-5 border border-white/[0.06]">
                    <p className="text-sm text-zinc-300 leading-relaxed">{movie.notes}</p>
                  </div>
                )}

                {/* Trailer */}
                {movie.tmdb_id && (
                  <div className="mb-6">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-3">
                      Tráiler
                    </p>
                    {trailerLoading ? (
                      <div className="w-full h-[152px] rounded-2xl bg-zinc-900 border border-white/[0.06] flex items-center justify-center">
                        <div className="w-5 h-5 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
                      </div>
                    ) : trailerKey ? (
                      <a
                        href={`https://www.youtube.com/watch?v=${trailerKey}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="relative block w-full h-[152px] rounded-2xl overflow-hidden group"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={`https://img.youtube.com/vi/${trailerKey}/maxresdefault.jpg`}
                          alt="Tráiler"
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${trailerKey}/hqdefault.jpg`;
                          }}
                        />
                        <div className="absolute inset-0 bg-black/35 group-hover:bg-black/20 transition-colors duration-300" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <motion.div
                            whileHover={{ scale: 1.1 }}
                            className="w-14 h-14 rounded-full bg-red-600 shadow-[0_4px_24px_-4px_rgba(239,68,68,0.7)] flex items-center justify-center"
                          >
                            <Play size={20} fill="white" className="text-white ml-1" />
                          </motion.div>
                        </div>
                        <div className="absolute bottom-3 right-3 flex items-center gap-1 bg-black/60 backdrop-blur-sm rounded-lg px-2 py-1 border border-white/10">
                          <ExternalLink size={10} className="text-white/60" />
                          <span className="text-[11px] text-white/60 font-medium">YouTube</span>
                        </div>
                      </a>
                    ) : (
                      <div className="w-full h-[80px] rounded-2xl bg-zinc-900 border border-white/[0.06] flex items-center justify-center gap-2">
                        <Film size={16} className="text-zinc-700" />
                        <p className="text-xs text-zinc-600">Sin tráiler disponible</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="space-y-3">
                  {onWatchNow && (
                    <button
                      onClick={() => { onClose(); onWatchNow(movie); }}
                      className="w-full h-12 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors shadow-[0_4px_20px_-4px_rgba(99,102,241,0.5)]"
                    >
                      <Play size={15} fill="white" /> Ver ahora
                    </button>
                  )}
                  <div className="flex gap-3">
                    {onEdit && (
                      <button
                        onClick={() => { onClose(); onEdit(movie); }}
                        className="flex-1 h-11 bg-white/[0.05] hover:bg-white/[0.09] text-zinc-300 font-medium rounded-xl flex items-center justify-center gap-2 transition-colors border border-white/[0.08] text-sm"
                      >
                        <Pencil size={13} /> Editar
                      </button>
                    )}
                    {onDelete && (
                      <button
                        onClick={() => { onClose(); onDelete(movie); }}
                        className="flex-1 h-11 bg-red-500/[0.08] hover:bg-red-500/[0.15] text-red-400 font-medium rounded-xl flex items-center justify-center gap-2 transition-colors border border-red-500/20 text-sm"
                      >
                        <Trash2 size={13} /> Eliminar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
