export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  color: string;
  created_at: string;
}

export interface Group {
  id: string;
  name: string;
  avatar: string;
  description?: string;
  invitation_code: string;
  created_by: string;
  member_count: number;
  created_at: string;
}

export interface GroupMember {
  id: string;
  user: User;
  role: 'admin' | 'member';
  joined_at: string;
}

export type Platform = 'netflix' | 'prime' | 'disney' | 'hbo' | 'movistar' | 'apple' | 'other';
export type Genre = 'action' | 'comedy' | 'drama' | 'thriller' | 'horror' | 'sci-fi' | 'romance' | 'animation' | 'documentary' | 'other';
export type MovieStatus = 'pending' | 'in_session' | 'watched';
export type SessionStatus = 'pending' | 'in_progress' | 'finished' | 'cancelled';

export interface Movie {
  id: string;
  group_id: string;
  title: string;
  duration_minutes: number;
  duration_formatted: string;
  platform: Platform;
  genre: Genre;
  added_by: User;
  notes?: string;
  status: MovieStatus;
  tmdb_id?: number;
  poster_path?: string;
  created_at: string;
}

export interface TmdbSearchResult {
  tmdb_id: number;
  title: string;
  year: string | null;
  poster_path: string | null;
}

export interface TmdbMovieDetail {
  tmdb_id: number;
  title: string;
  year: string | null;
  runtime: number | null;
  genre: string;
  poster_path: string | null;
}

export interface Rating {
  id: string;
  user: User;
  score: 1 | 2 | 3 | 4 | 5;
  created_at: string;
}

export interface CinemaSession {
  id: string;
  group_id: string;
  movie: Movie;
  started_at?: string;
  estimated_end_at?: string;
  actual_end_at?: string;
  status: SessionStatus;
  participants: User[];
  ratings: Rating[];
  average_rating?: number;
  created_at: string;
}

export interface PersonalStats {
  movies_watched: number;
  movies_added: number;
  average_score: number | null;
  favorite_genre: Genre | null;
  favorite_platform: Platform | null;
  hours_accumulated: number;
}

export interface GroupStats {
  most_proposer: { user: User; count: number } | null;
  most_demanding: { user: User; avg_score: number } | null;
  most_generous: { user: User; avg_score: number } | null;
  favorite_platform: Platform | null;
  favorite_genre: Genre | null;
  best_rated_movie: Movie | null;
  total_watched: number;
  total_hours: number;
  top_10: Array<{ movie: Movie; avg_rating: number }>;
}

export interface Badge {
  id: string;
  name: string;
  icon: string;
  description: string;
  earned: boolean;
}

export interface Memory {
  years_ago: number;
  date: string;
  movie: Movie;
  participants: User[];
  ratings: Rating[];
  average_rating: number | null;
}
