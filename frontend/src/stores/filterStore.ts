import { create } from 'zustand';

export interface MovieFiltersState {
  platform?: string;
  genre?: string;
  max_duration?: number;
}

interface FilterStore {
  filters: Record<string, MovieFiltersState>;
  setFilters: (groupId: string, f: MovieFiltersState) => void;
  clearFilters: (groupId: string) => void;
}

export const useFilterStore = create<FilterStore>((set) => ({
  filters: {},
  setFilters: (groupId, f) =>
    set((s) => ({ filters: { ...s.filters, [groupId]: f } })),
  clearFilters: (groupId) =>
    set((s) => ({ filters: { ...s.filters, [groupId]: {} } })),
}));
