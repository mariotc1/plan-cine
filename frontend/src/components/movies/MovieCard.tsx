'use client';

import { motion } from 'framer-motion';
import { Clock, MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { Movie } from '@/types';
import { getPlatform, getGenre } from '@/lib/constants';
import { staggerItem } from '@/lib/animations';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface MovieCardProps {
  movie: Movie;
  onEdit?: (movie: Movie) => void;
  onDelete?: (movie: Movie) => void;
}

export function MovieCard({ movie, onEdit, onDelete }: MovieCardProps) {
  const platform = getPlatform(movie.platform);
  const genre = getGenre(movie.genre);

  return (
    <motion.div
      variants={staggerItem}
      layout
      className="group bg-zinc-900 rounded-2xl border border-white/5 overflow-hidden"
    >
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-white leading-tight truncate">{movie.title}</h3>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              {platform && (
                <span
                  className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: `${platform.color}25`, color: platform.color }}
                >
                  {platform.emoji} {platform.label}
                </span>
              )}
              {genre && (
                <span className="text-xs text-zinc-400">
                  {genre.emoji} {genre.label}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 mt-2 text-xs text-zinc-500">
              <Clock size={11} />
              <span>{movie.duration_formatted}</span>
              {movie.added_by && (
                <>
                  <span className="mx-1">·</span>
                  <span
                    className="font-medium text-xs"
                    style={{ color: movie.added_by.color }}
                  >
                    {movie.added_by.avatar} {movie.added_by.name}
                  </span>
                </>
              )}
            </div>
            {movie.notes && (
              <p className="mt-2 text-xs text-zinc-500 line-clamp-2">{movie.notes}</p>
            )}
          </div>

          {(onEdit || onDelete) && (
            <DropdownMenu>
              <DropdownMenuTrigger className={cn(
                'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
                'text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800 transition-colors outline-none'
              )}>
                <MoreVertical size={16} />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-800">
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
      </div>
    </motion.div>
  );
}
