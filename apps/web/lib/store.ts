'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { FareSubmission, OperatorId, Place } from '@onestopsgtaxi/shared';
import type { ThemeId } from './themes';

export interface SavedRoute {
  id: string;
  name: string;
  pickup: Place;
  dropoff: Place;
  createdAt: string;
  targetSGD?: number;
}

export interface SearchHistoryItem {
  id: string;
  pickup: Place;
  dropoff: Place;
  searchedAt: string;
}

export interface TripLogEntry {
  id: string;
  operatorId: OperatorId;
  operatorName: string;
  pickup: Place;
  dropoff: Place;
  estimatedFareSGD: number;
  surgeMultiplier: number;
  loggedAt: string;
  calibrationPromptDismissed?: boolean;
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
  setRouteTarget: (id: string, targetSGD: number | null) => void;

  history: SearchHistoryItem[];
  addHistory: (pickup: Place, dropoff: Place) => void;
  clearHistory: () => void;

  tripLog: TripLogEntry[];
  logTrip: (entry: Omit<TripLogEntry, 'id' | 'loggedAt'>) => string;
  removeTrip: (id: string) => void;
  clearTripLog: () => void;
  dismissTripPrompt: (id: string) => void;

  fareSubmissions: FareSubmission[];
  addFareSubmission: (entry: Omit<FareSubmission, 'id' | 'submittedAt'>) => void;
  removeFareSubmission: (id: string) => void;
  clearFareSubmissions: () => void;

  dismissedCalibrationOperators: OperatorId[];
  dismissOperatorCalibration: (operatorId: OperatorId) => void;
  resetDismissedCalibrations: () => void;

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
      setRouteTarget: (id, targetSGD) =>
        set((s) => ({
          savedRoutes: s.savedRoutes.map((r) =>
            r.id === id
              ? { ...r, targetSGD: targetSGD == null ? undefined : targetSGD }
              : r,
          ),
        })),

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

      tripLog: [],
      logTrip: (entry) => {
        const id = crypto.randomUUID();
        set((s) => ({
          tripLog: [
            {
              ...entry,
              id,
              loggedAt: new Date().toISOString(),
            },
            ...s.tripLog,
          ].slice(0, 500),
        }));
        return id;
      },
      removeTrip: (id) =>
        set((s) => ({ tripLog: s.tripLog.filter((t) => t.id !== id) })),
      clearTripLog: () => set({ tripLog: [] }),
      dismissTripPrompt: (id) =>
        set((s) => ({
          tripLog: s.tripLog.map((t) =>
            t.id === id ? { ...t, calibrationPromptDismissed: true } : t,
          ),
        })),

      fareSubmissions: [],
      addFareSubmission: (entry) =>
        set((s) => ({
          fareSubmissions: [
            {
              ...entry,
              id: crypto.randomUUID(),
              submittedAt: new Date().toISOString(),
            },
            ...s.fareSubmissions,
          ].slice(0, 1000),
        })),
      removeFareSubmission: (id) =>
        set((s) => ({ fareSubmissions: s.fareSubmissions.filter((f) => f.id !== id) })),
      clearFareSubmissions: () => set({ fareSubmissions: [] }),

      dismissedCalibrationOperators: [],
      dismissOperatorCalibration: (operatorId) =>
        set((s) =>
          s.dismissedCalibrationOperators.includes(operatorId)
            ? s
            : {
                dismissedCalibrationOperators: [
                  ...s.dismissedCalibrationOperators,
                  operatorId,
                ],
              },
        ),
      resetDismissedCalibrations: () => set({ dismissedCalibrationOperators: [] }),

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
        tripLog: state.tripLog,
        fareSubmissions: state.fareSubmissions,
        dismissedCalibrationOperators: state.dismissedCalibrationOperators,
        themeId: state.themeId,
      }),
    },
  ),
);
