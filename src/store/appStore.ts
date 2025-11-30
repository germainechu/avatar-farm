import { create } from 'zustand';
import type { Scenario, Avatar } from '../types';

type AppView = 'avatars' | 'scenario-builder' | 'simulation';

interface AppState {
  view: AppView;
  currentScenario: Scenario | null;
  avatars: Avatar[];
  
  setView: (view: AppView) => void;
  setCurrentScenario: (scenario: Scenario | null) => void;
  setAvatars: (avatars: Avatar[]) => void;
}

export const useAppStore = create<AppState>((set) => ({
  view: 'avatars',
  currentScenario: null,
  avatars: [],
  
  setView: (view) => set({ view }),
  setCurrentScenario: (scenario) => set({ currentScenario: scenario }),
  setAvatars: (avatars) => set({ avatars })
}));
