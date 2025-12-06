import { createClient } from '@supabase/supabase-js';
import type { Scenario, Message } from '../types';

// Supabase configuration
// These should be set as environment variables
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Create Supabase client (will be null if credentials are not provided)
export const supabase = SUPABASE_URL && SUPABASE_ANON_KEY
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

// Database table names
const TABLES = {
  SIMULATIONS: 'simulations',
} as const;

// Database types
export interface SimulationRecord {
  id: string;
  user_id?: string; // Optional for future account management
  scenario: Scenario;
  messages: Message[];
  completed_at: string;
  created_at: string;
  updated_at: string;
}

/**
 * Check if Supabase is configured
 */
export function isSupabaseConfigured(): boolean {
  return supabase !== null;
}

/**
 * Save a simulation to Supabase
 */
export async function saveSimulationToSupabase(
  scenario: Scenario,
  messages: Message[]
): Promise<string | null> {
  if (!supabase) {
    return null;
  }

  try {
    const simulationData: Omit<SimulationRecord, 'id' | 'created_at' | 'updated_at'> = {
      scenario,
      messages,
      completed_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from(TABLES.SIMULATIONS)
      .insert(simulationData)
      .select('id')
      .single();

    if (error) {
      console.error('Error saving simulation to Supabase:', error);
      return null;
    }

    return data?.id || null;
  } catch (error) {
    console.error('Error saving simulation to Supabase:', error);
    return null;
  }
}

/**
 * Get all saved simulations from Supabase
 */
export async function getSimulationsFromSupabase(): Promise<SimulationRecord[]> {
  if (!supabase) {
    return [];
  }

  try {
    const { data, error } = await supabase
      .from(TABLES.SIMULATIONS)
      .select('*')
      .order('completed_at', { ascending: false });

    if (error) {
      console.error('Error fetching simulations from Supabase:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching simulations from Supabase:', error);
    return [];
  }
}

/**
 * Get a single simulation by ID from Supabase
 */
export async function getSimulationFromSupabase(id: string): Promise<SimulationRecord | null> {
  if (!supabase) {
    return null;
  }

  try {
    const { data, error } = await supabase
      .from(TABLES.SIMULATIONS)
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching simulation from Supabase:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error fetching simulation from Supabase:', error);
    return null;
  }
}

/**
 * Delete a simulation from Supabase
 */
export async function deleteSimulationFromSupabase(id: string): Promise<boolean> {
  if (!supabase) {
    return false;
  }

  try {
    const { error } = await supabase
      .from(TABLES.SIMULATIONS)
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting simulation from Supabase:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error deleting simulation from Supabase:', error);
    return false;
  }
}

/**
 * Export simulation as JSON (for download)
 */
export function exportSimulationAsJSON(simulation: SimulationRecord): string {
  return JSON.stringify(
    {
      id: simulation.id,
      scenario: simulation.scenario,
      messages: simulation.messages,
      completedAt: simulation.completed_at,
    },
    null,
    2
  );
}

