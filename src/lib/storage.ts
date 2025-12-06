import type { Scenario, Message } from '../types';
import {
  isSupabaseConfigured,
  saveSimulationToSupabase,
  getSimulationsFromSupabase,
  deleteSimulationFromSupabase,
  type SimulationRecord,
} from './supabase';

const STORAGE_KEYS = {
  SCENARIOS: 'mbti-avatar-farm-scenarios',
  SIMULATIONS: 'mbti-avatar-farm-simulations'
};

const MAX_STORED_SIMULATIONS = 10;

export interface StoredSimulation {
  id: string;
  scenario: Scenario;
  messages: Message[];
  completedAt: string;
}

/**
 * Convert Supabase SimulationRecord to StoredSimulation
 */
function simulationRecordToStored(record: SimulationRecord): StoredSimulation {
  return {
    id: record.id,
    scenario: record.scenario,
    messages: record.messages,
    completedAt: record.completed_at,
  };
}

/**
 * Save a scenario to localStorage
 */
export function saveScenario(scenario: Scenario): void {
  try {
    const scenarios = getSavedScenarios();
    const existing = scenarios.findIndex(s => s.id === scenario.id);
    
    if (existing >= 0) {
      scenarios[existing] = scenario;
    } else {
      scenarios.push(scenario);
    }

    localStorage.setItem(STORAGE_KEYS.SCENARIOS, JSON.stringify(scenarios));
  } catch (error) {
    console.error('Failed to save scenario:', error);
  }
}

/**
 * Get all saved scenarios from localStorage
 */
export function getSavedScenarios(): Scenario[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.SCENARIOS);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Failed to load scenarios:', error);
    return [];
  }
}

/**
 * Delete a scenario from localStorage
 */
export function deleteScenario(scenarioId: string): void {
  try {
    const scenarios = getSavedScenarios();
    const filtered = scenarios.filter(s => s.id !== scenarioId);
    localStorage.setItem(STORAGE_KEYS.SCENARIOS, JSON.stringify(filtered));
  } catch (error) {
    console.error('Failed to delete scenario:', error);
  }
}

/**
 * Save a completed simulation to Supabase (if configured) or localStorage
 */
export async function saveSimulation(scenario: Scenario, messages: Message[]): Promise<void> {
  // Try Supabase first if configured
  if (isSupabaseConfigured()) {
    const id = await saveSimulationToSupabase(scenario, messages);
    if (id) {
      // Also save to localStorage as backup
      try {
        const simulations = getSavedSimulationsLocal();
        const simulation: StoredSimulation = {
          id,
          scenario,
          messages,
          completedAt: new Date().toISOString()
        };
        simulations.unshift(simulation);
        const trimmed = simulations.slice(0, MAX_STORED_SIMULATIONS);
        localStorage.setItem(STORAGE_KEYS.SIMULATIONS, JSON.stringify(trimmed));
      } catch (error) {
        console.warn('Failed to backup simulation to localStorage:', error);
      }
      return;
    }
  }

  // Fallback to localStorage
  try {
    const simulations = getSavedSimulationsLocal();
    
    const simulation: StoredSimulation = {
      id: `sim-${Date.now()}`,
      scenario,
      messages,
      completedAt: new Date().toISOString()
    };

    // Add to beginning and keep only last MAX_STORED_SIMULATIONS
    simulations.unshift(simulation);
    const trimmed = simulations.slice(0, MAX_STORED_SIMULATIONS);

    localStorage.setItem(STORAGE_KEYS.SIMULATIONS, JSON.stringify(trimmed));
  } catch (error) {
    console.error('Failed to save simulation:', error);
  }
}

/**
 * Get all saved simulations from localStorage (internal helper)
 */
function getSavedSimulationsLocal(): StoredSimulation[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.SIMULATIONS);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Failed to load simulations from localStorage:', error);
    return [];
  }
}

/**
 * Get all saved simulations from Supabase (if configured) or localStorage
 */
export async function getSavedSimulations(): Promise<StoredSimulation[]> {
  // Try Supabase first if configured
  if (isSupabaseConfigured()) {
    try {
      const records = await getSimulationsFromSupabase();
      if (records.length > 0) {
        return records.map(simulationRecordToStored);
      }
    } catch (error) {
      console.warn('Failed to load simulations from Supabase, falling back to localStorage:', error);
    }
  }

  // Fallback to localStorage
  return getSavedSimulationsLocal();
}

/**
 * Delete a simulation from Supabase (if configured) or localStorage
 */
export async function deleteSimulation(simulationId: string): Promise<void> {
  // Try Supabase first if configured
  if (isSupabaseConfigured()) {
    const success = await deleteSimulationFromSupabase(simulationId);
    if (success) {
      // Also remove from localStorage if it exists there
      try {
        const simulations = getSavedSimulationsLocal();
        const filtered = simulations.filter(s => s.id !== simulationId);
        localStorage.setItem(STORAGE_KEYS.SIMULATIONS, JSON.stringify(filtered));
      } catch (error) {
        console.warn('Failed to remove simulation from localStorage:', error);
      }
      return;
    }
  }

  // Fallback to localStorage
  try {
    const simulations = getSavedSimulationsLocal();
    const filtered = simulations.filter(s => s.id !== simulationId);
    localStorage.setItem(STORAGE_KEYS.SIMULATIONS, JSON.stringify(filtered));
  } catch (error) {
    console.error('Failed to delete simulation:', error);
  }
}

/**
 * Clear all stored data
 */
export function clearAllData(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.SCENARIOS);
    localStorage.removeItem(STORAGE_KEYS.SIMULATIONS);
  } catch (error) {
    console.error('Failed to clear data:', error);
  }
}
