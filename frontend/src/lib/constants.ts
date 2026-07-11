import { Genre, Platform } from '@/types';

export const PLATFORMS: { value: Platform; label: string; color: string; emoji: string }[] = [
  { value: 'netflix',  label: 'Netflix',     color: '#E50914', emoji: '🔴' },
  { value: 'prime',    label: 'Prime Video', color: '#1A98FF', emoji: '🔵' },
  { value: 'disney',   label: 'Disney+',     color: '#113CCF', emoji: '🏰' },
  { value: 'hbo',      label: 'HBO Max',     color: '#5822B4', emoji: '🟣' },
  { value: 'movistar', label: 'Movistar+',   color: '#019DF4', emoji: '🟢' },
  { value: 'apple',    label: 'Apple TV+',   color: '#C0C0C0', emoji: '🍎' },
  { value: 'other',    label: 'Otra',        color: '#6366f1', emoji: '📺' },
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

export const AVATAR_CATEGORIES = [
  { key: 'cine',     label: 'Cine',     avatars: ['🎬', '🍿', '🎥', '🌟', '🎭', '🎟️', '🏆', '🎦', '🎪', '🎨', '🎵', '🎸'] },
  { key: 'personas', label: 'Personas', avatars: ['🧙', '🦸', '👑', '🤠', '👽', '🤖', '🧜', '🧝', '🥷', '👸', '🦹', '🧞'] },
  { key: 'animales', label: 'Animales', avatars: ['🦁', '🐺', '🦊', '🐉', '🦋', '🐻', '🦄', '🐯', '🦅', '🐬', '🐘', '🐼'] },
  { key: 'misc',     label: 'Extras',   avatars: ['🎮', '👻', '🌈', '⚡', '🔥', '💎', '🚀', '🌙', '❄️', '🌊', '🍕', '🎃'] },
];

export const AVATARS = AVATAR_CATEGORIES.flatMap((c) => c.avatars);

export const COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e',
  '#3b82f6', '#06b6d4', '#10b981', '#14b8a6',
  '#f59e0b', '#f97316', '#ef4444', '#84cc16',
];

export const getPlatform = (value: Platform) => PLATFORMS.find((p) => p.value === value);
export const getGenre = (value: Genre) => GENRES.find((g) => g.value === value);
