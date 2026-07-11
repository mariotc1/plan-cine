'use client';

import { motion } from 'framer-motion';
import { Clock, Film, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import { Movie } from '@/types';
import { getPlatform, getGenre } from '@/lib/constants';
import { staggerItem } from '@/lib/animations';
import { PlatformLogo } from '@/components/ui/PlatformLogo';

interface MovieCardProps {
  movie: Movie;
  onTap?: (movie: Movie) => void;
}

export function MovieCard({ movie, onTap }: MovieCardProps) {
  const platform = getPlatform(movie.platform);
  const genre = getGenre(movie.genre);

  return (
    <motion.div
      variants={staggerItem}
      layout
      whileTap={{ scale: 0.985 }}
      onClick={() => onTap?.(movie)}
      className="bg-zinc-900 rounded-2xl border border-white/[0.06] overflow-hidden cursor-pointer transition-colors active:bg-zinc-800/60"
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

          {/* Chevron */}
          <ChevronRight size={15} className="text-zinc-700 flex-shrink-0 mt-1.5" />
        </div>
      </div>
    </motion.div>
  );
}
