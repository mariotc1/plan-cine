'use client';

import { motion } from 'framer-motion';
import { Clock, Film, MoreVertical, Pencil, Play, Trash2 } from 'lucide-react';
import Image from 'next/image';
import { Movie } from '@/types';
import { getPlatform, getGenre } from '@/lib/constants';
import { staggerItem } from '@/lib/animations';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface MovieCardProps {
  movie: Movie;
  onEdit?: (movie: Movie) => void;
  onDelete?: (movie: Movie) => void;
  onWatchNow?: (movie: Movie) => void;
}

export function MovieCard({ movie, onEdit, onDelete, onWatchNow }: MovieCardProps) {
  const platform = getPlatform(movie.platform);
  const genre = getGenre(movie.genre);
  const hasMenu = onEdit || onDelete || onWatchNow;

  return (
    <motion.div
      variants={staggerItem}
      layout
      className="group bg-zinc-900 rounded-2xl border border-white/5 overflow-hidden"
    >
      <div className="p-4">
        <div className="flex gap-3 items-start">

          {/* Poster */}
          <div className="flex-shrink-0 w-[52px] h-[74px] rounded-lg overflow-hidden">
            {movie.poster_path ? (
              <Image
                src={`https://image.tmdb.org/t/p/w185${movie.poster_path}`}
                alt={movie.title}
                width={52}
                height={74}
                className="w-full h-full object-cover"
                unoptimized
              />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center"
                style={{ backgroundColor: platform?.color ? `${platform.color}18` : 'rgba(255,255,255,0.05)' }}
              >
                <Film size={18} className="text-zinc-600" />
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-base font-semibold text-white leading-tight line-clamp-2 flex-1">
                {movie.title}
              </h3>
              {hasMenu && (
                <DropdownMenu>
                  <DropdownMenuTrigger className={cn(
                    'flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center',
                    'text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800 transition-colors outline-none'
                  )}>
                    <MoreVertical size={15} />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-800">
                    {onWatchNow && (
                      <DropdownMenuItem
                        onClick={() => onWatchNow(movie)}
                        className="text-indigo-400 hover:text-indigo-300 focus:text-indigo-300 focus:bg-zinc-800 font-medium"
                      >
                        <Play size={14} className="mr-2" /> Ver ahora
                      </DropdownMenuItem>
                    )}
                    {onWatchNow && (onEdit || onDelete) && <DropdownMenuSeparator className="bg-zinc-800" />}
                    {onEdit && (
                      <DropdownMenuItem
                        onClick={() => onEdit(movie)}
                        className="text-zinc-200 hover:text-white focus:text-white focus:bg-zinc-800"
                      >
                        <Pencil size={14} className="mr-2" /> Editar
                      </DropdownMenuItem>
                    )}
                    {onDelete && (
                      <DropdownMenuItem
                        onClick={() => onDelete(movie)}
                        className="text-red-400 hover:text-red-300 focus:text-red-300 focus:bg-zinc-800"
                      >
                        <Trash2 size={14} className="mr-2" /> Eliminar
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>

            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              {platform && (
                <span
                  className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: `${platform.color}25`, color: platform.color }}
                >
                  {platform.emoji} {platform.label}
                </span>
              )}
              {genre && (
                <span className="text-xs text-zinc-500">
                  {genre.emoji} {genre.label}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1 mt-1.5 text-xs text-zinc-500">
              <Clock size={10} />
              <span>{movie.duration_formatted}</span>
              {movie.added_by && (
                <>
                  <span className="mx-0.5">·</span>
                  <span className="font-medium" style={{ color: movie.added_by.color }}>
                    {movie.added_by.avatar} {movie.added_by.name}
                  </span>
                </>
              )}
            </div>

            {movie.notes && (
              <p className="mt-1.5 text-xs text-zinc-500 line-clamp-2">{movie.notes}</p>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
