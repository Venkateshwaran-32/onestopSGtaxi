'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Place } from '@onestopsgtaxi/shared';
import type { ThemeId } from './themes';

export interface SavedRoute {
  id: string;
  name: string;
  pickup: Place;
  dropoff: Place;
  createdAt: string;
}

export interface SearchHistoryItem {
  id: string;
  pickup: Place;
  dropoff: Place;
  searchedAt: string;
}

interface AppState {
  currentSearch: { pickup: Place | null; dropoff: Place | null };
  setCurrentPickup: (place: Place | null) => void;
  setCurrentDropoff: (place: Place | null) => void;
  swapCurrent: () => void;
  clearCurrent: () => void;

  savedRoutes: SavedRoute[];
  addSavedRoute: (name: string, pickup: Place, dropoff: Place) => void;
  removeSavedRoute: (id: string) => void;

  history: SearchHistoryItem[];
  addHistory: (pickup: Place, dropoff: Place) => void;
  clearHistory: () => void;

  themeId: ThemeId;
  setTheme: (id: ThemeId) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      currentSearch: { pickup: null, dropoff: null },
      setCurrentPickup: (place) =>
        set((s) => ({ currentSearch: { ...s.currentSearch, pickup: place } })),
      setCurrentDropoff: (place) =>
        set((s) => ({ currentSearch: { ...s.currentSearch, dropoff: place } })),
      swapCurrent: () =>
        set((s) => ({
          currentSearch: {
            pickup: s.currentSearch.dropoff,
            dropoff: s.currentSearch.pickup,
          },
        })),
      clearCurrent: () => set({ currentSearch: { pickup: null, dropoff: null } }),

      savedRoutes: [],
      addSavedRoute: (name, pickup, dropoff) =>
        set((s) => ({
          savedRoutes: [
            {
              id: crypto.randomUUID(),
              name,
              pickup,
              dropoff,
              createdAt: new Date().toISOString(),
            },
            ...s.savedRoutes.filter((r) => r.name !== name),
          ],
        })),
      removeSavedRoute: (id) =>
        set((s) => ({ savedRoutes: s.savedRoutes.filter((r) => r.id !== id) })),

      history: [],
      addHistory: (pickup, dropoff) =>
        set((s) => {
          const dedupKey = `${pickup.label}|${dropoff.label}`;
          const filtered = s.history.filter(
            (h) => `${h.pickup.label}|${h.dropoff.label}` !== dedupKey,
          );
          return {
            history: [
              {
                id: crypto.randomUUID(),
                pickup,
                dropoff,
                searchedAt: new Date().toISOString(),
              },
              ...filtered,
            ].slice(0, 20),
          };
        }),
      clearHistory: () => set({ history: [] }),

      themeId: 'default',
      setTheme: (id) => set({ themeId: id }),
    }),
    {
      name: 'onestopsgtaxi-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        currentSearch: state.currentSearch,
        savedRoutes: state.savedRoutes,
        history: state.history,
        themeId: state.themeId,
      }),
    },
  ),
);
