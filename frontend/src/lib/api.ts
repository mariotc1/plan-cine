import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('auth_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

export const authApi = {
  register: (data: {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
    avatar?: string;
    color?: string;
  }) => api.post('/auth/register', data),
  login: (data: { email: string; password: string }) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
};

export const groupsApi = {
  list: () => api.get('/groups'),
  create: (data: { name: string; avatar?: string; description?: string }) => api.post('/groups', data),
  get: (id: string) => api.get(`/groups/${id}`),
  update: (id: string, data: { name?: string; avatar?: string; description?: string }) => api.put(`/groups/${id}`, data),
  delete: (id: string) => api.delete(`/groups/${id}`),
  join: (code: string) => api.post(`/groups/join/${code}`),
  leave: (id: string) => api.delete(`/groups/${id}/leave`),
  members: (id: string) => api.get(`/groups/${id}/members`),
  kickMember: (groupId: string, userId: string) => api.delete(`/groups/${groupId}/members/${userId}`),
  stats: (id: string) => api.get(`/groups/${id}/stats`),
  memories: (id: string) => api.get(`/groups/${id}/memories`),
};

export const moviesApi = {
  list: (
    groupId: string,
    params?: { status?: string; platform?: string; genre?: string; max_duration?: number }
  ) => api.get(`/groups/${groupId}/movies`, { params }),
  create: (
    groupId: string,
    data: {
      title: string;
      duration_minutes: number;
      platform: string;
      genre: string;
      notes?: string;
    }
  ) => api.post(`/groups/${groupId}/movies`, data),
  get: (groupId: string, id: string) => api.get(`/groups/${groupId}/movies/${id}`),
  update: (groupId: string, id: string, data: object) => api.put(`/groups/${groupId}/movies/${id}`, data),
  delete: (groupId: string, id: string) => api.delete(`/groups/${groupId}/movies/${id}`),
  random: (groupId: string) => api.get(`/groups/${groupId}/movies/random`),
};

export const sessionsApi = {
  list: (groupId: string) => api.get(`/groups/${groupId}/sessions`),
  create: (groupId: string, data: { movie_id: string; participant_ids: string[] }) =>
    api.post(`/groups/${groupId}/sessions`, data),
  get: (groupId: string, id: string) => api.get(`/groups/${groupId}/sessions/${id}`),
  start: (groupId: string, id: string) => api.post(`/groups/${groupId}/sessions/${id}/start`),
  finish: (groupId: string, id: string) => api.post(`/groups/${groupId}/sessions/${id}/finish`),
  cancel: (groupId: string, id: string) => api.post(`/groups/${groupId}/sessions/${id}/cancel`),
  returnToPending: (groupId: string, id: string) =>
    api.post(`/groups/${groupId}/sessions/${id}/return`),
};

export const ratingsApi = {
  rate: (sessionId: string, score: number) => api.post(`/sessions/${sessionId}/ratings`, { score }),
};

export const statsApi = {
  personal: () => api.get('/users/stats'),
  badges: () => api.get('/users/badges'),
};

export const userApi = {
  updateProfile: (data: { name?: string; avatar?: string; color?: string }) =>
    api.put('/users/profile', data),
};

export const pushApi = {
  subscribe: (data: { endpoint: string; p256dh: string; auth: string }) =>
    api.post('/push/subscribe', data),
  unsubscribe: (endpoint: string) => api.delete('/push/unsubscribe', { data: { endpoint } }),
};

export const tmdbApi = {
  search: (query: string) =>
    api.get<{ results: import('@/types').TmdbSearchResult[] }>('/tmdb/search', { params: { query } }),
  movie: (id: number) =>
    api.get<import('@/types').TmdbMovieDetail>(`/tmdb/movie/${id}`),
};
