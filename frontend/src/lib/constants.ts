import { Genre, Platform } from '@/types';

export const PLATFORMS: { value: Platform; label: string; color: string; emoji: string }[] = [
  { value: 'netflix', label: 'Netflix', color: '#E50914', emoji: '🔴' },
  { value: 'prime', label: 'Prime Video', color: '#00A8E1', emoji: '🔵' },
  { value: 'disney', label: 'Disney+', color: '#113CCF', emoji: '🏰' },
  { value: 'hbo', label: 'HBO Max', color: '#5822B4', emoji: '🟣' },
  { value: 'movistar', label: 'Movistar+', color: '#009900', emoji: '🟢' },
  { value: 'apple', label: 'Apple TV+', color: '#555555', emoji: '🍎' },
  { value: 'other', label: 'Otra', color: '#6366f1', emoji: '📺' },
];

export const GENRES: { value: Genre; label: string; emoji: string }[] = [
  { value: 'action', label: 'Acción', emoji: '💥' },
  { value: 'comedy', label: 'Comedia', emoji: '😂' },
  { value: 'drama', label: 'Drama', emoji: '🎭' },
  { value: 'thriller', label: 'Thriller', emoji: '😱' },
  { value: 'horror', label: 'Terror', emoji: '👻' },
  { value: 'sci-fi', label: 'Ciencia Ficción', emoji: '🚀' },
  { value: 'romance', label: 'Romance', emoji: '❤️' },
  { value: 'animation', label: 'Animación', emoji: '🎨' },
  { value: 'documentary', label: 'Documental', emoji: '📽️' },
  { value: 'other', label: 'Otra', emoji: '🎬' },
];

export const AVATARS = ['🎬', '🍿', '🎥', '🌟', '🎭', '🦁', '🐺', '🦊', '🐉', '🧙', '🦸', '🎮', '👻', '🦋', '🐻', '🦄'];

export const COLORS = [
  '#6366f1', '#ec4899', '#f59e0b', '#10b981',
  '#ef4444', '#3b82f6', '#8b5cf6', '#14b8a6',
  '#f97316', '#84cc16', '#06b6d4', '#a855f7',
];

export const getPlatform = (value: Platform) => PLATFORMS.find((p) => p.value === value);
export const getGenre = (value: Genre) => GENRES.find((g) => g.value === value);
