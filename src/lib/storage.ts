import type { Scenario, Message } from '../types';

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
 * Save a completed simulation to localStorage
 */
export function saveSimulation(scenario: Scenario, messages: Message[]): void {
  try {
    const simulations = getSavedSimulations();
    
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
 * Get all saved simulations from localStorage
 */
export function getSavedSimulations(): StoredSimulation[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.SIMULATIONS);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Failed to load simulations:', error);
    return [];
  }
}

/**
 * Delete a simulation from localStorage
 */
export function deleteSimulation(simulationId: string): void {
  try {
    const simulations = getSavedSimulations();
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
