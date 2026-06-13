'use client';

import { useState, useEffect } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PLATFORMS, GENRES } from '@/lib/constants';
import { formatDuration } from '@/lib/utils';
import { Movie } from '@/types';

interface AddMovieSheetProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    duration_minutes: number;
    platform: string;
    genre: string;
    notes?: string;
  }) => void;
  loading?: boolean;
  editMovie?: Movie | null;
}

export function AddMovieSheet({ open, onClose, onSubmit, loading, editMovie }: AddMovieSheetProps) {
  const [title, setTitle] = useState('');
  const [duration, setDuration] = useState('');
  const [platform, setPlatform] = useState('');
  const [genre, setGenre] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (editMovie) {
      setTitle(editMovie.title);
      setDuration(String(editMovie.duration_minutes));
      setPlatform(editMovie.platform);
      setGenre(editMovie.genre);
      setNotes(editMovie.notes || '');
    } else {
      setTitle('');
      setDuration('');
      setPlatform('');
      setGenre('');
      setNotes('');
    }
  }, [editMovie, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !duration || !platform || !genre) return;
    onSubmit({
      title,
      duration_minutes: parseInt(duration),
      platform,
      genre,
      notes: notes || undefined,
    });
  };

  const durationNum = parseInt(duration) || 0;

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side="bottom"
        className="bg-zinc-950 border-t border-zinc-800 rounded-t-3xl max-h-[90vh] overflow-y-auto"
      >
        <SheetHeader className="mb-6">
          <SheetTitle className="text-white text-xl">
            {editMovie ? 'Editar película' : 'Añadir película'}
          </SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-5 pb-8">
          <div className="space-y-2">
            <Label className="text-zinc-300">Título</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nombre de la película"
              className="bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600 rounded-xl h-12"
              required
            />
          </div>

          <div className="space-y-2">
            <Label className="text-zinc-300">
              Duración (minutos)
              {durationNum > 0 && (
                <span className="ml-2 text-indigo-400 font-normal">
                  → {formatDuration(durationNum)}
                </span>
              )}
            </Label>
            <Input
              type="number"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="95"
              min={1}
              max={600}
              className="bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600 rounded-xl h-12"
              required
            />
          </div>

          <div className="space-y-2">
            <Label className="text-zinc-300">Plataforma</Label>
            <Select value={platform} onValueChange={(v) => v && setPlatform(v)}>
              <SelectTrigger className="bg-zinc-900 border-zinc-800 text-white rounded-xl h-12">
                <SelectValue placeholder="Selecciona plataforma" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-800">
                {PLATFORMS.map((p) => (
                  <SelectItem key={p.value} value={p.value} className="text-zinc-200 focus:bg-zinc-800 focus:text-white">
                    {p.emoji} {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-zinc-300">Género</Label>
            <Select value={genre} onValueChange={(v) => v && setGenre(v)}>
              <SelectTrigger className="bg-zinc-900 border-zinc-800 text-white rounded-xl h-12">
                <SelectValue placeholder="Selecciona género" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-800">
                {GENRES.map((g) => (
                  <SelectItem key={g.value} value={g.value} className="text-zinc-200 focus:bg-zinc-800 focus:text-white">
                    {g.emoji} {g.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-zinc-300">Notas (opcional)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Comentarios, contexto..."
              className="bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600 rounded-xl resize-none"
              rows={3}
            />
          </div>

          <Button
            type="submit"
            disabled={loading || !title || !duration || !platform || !genre}
            className="w-full h-12 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-semibold text-base"
          >
            {loading ? 'Guardando...' : editMovie ? 'Guardar cambios' : 'Añadir película'}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
