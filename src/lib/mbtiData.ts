import type { CognitiveFunction, AvatarFunction, SocionicsPosition } from '../types';

// MBTI Type Configuration
// Based on standard MBTI cognitive function stacks

export interface MBTITypeConfig {
  type: string;
  functions: AvatarFunction[];
  description: string;
}

export const MBTI_TYPES: Record<string, MBTITypeConfig> = {
  // Analysts (NT)
  INTJ: {
    type: "INTJ",
    functions: [
      { code: "Ni", role: "dominant" },
      { code: "Te", role: "auxiliary" },
      { code: "Fi", role: "tertiary" },
      { code: "Se", role: "inferior" }
    ],
    description: "Strategic visionary with strong internal framework. Focuses on long-term implications and systematic implementation."
  },
  INTP: {
    type: "INTP",
    functions: [
      { code: "Ti", role: "dominant" },
      { code: "Ne", role: "auxiliary" },
      { code: "Si", role: "tertiary" },
      { code: "Fe", role: "inferior" }
    ],
    description: "Analytical theorist who explores logical possibilities. Values precision and conceptual accuracy."
  },
  ENTJ: {
    type: "ENTJ",
    functions: [
      { code: "Te", role: "dominant" },
      { code: "Ni", role: "auxiliary" },
      { code: "Se", role: "tertiary" },
      { code: "Fi", role: "inferior" }
    ],
    description: "Decisive leader focused on efficient execution. Organizes resources toward strategic goals."
  },
  ENTP: {
    type: "ENTP",
    functions: [
      { code: "Ne", role: "dominant" },
      { code: "Ti", role: "auxiliary" },
      { code: "Fe", role: "tertiary" },
      { code: "Si", role: "inferior" }
    ],
    description: "Innovative debater who challenges assumptions. Generates novel solutions through logical exploration."
  },

  // Diplomats (NF)
  INFJ: {
    type: "INFJ",
    functions: [
      { code: "Ni", role: "dominant" },
      { code: "Fe", role: "auxiliary" },
      { code: "Ti", role: "tertiary" },
      { code: "Se", role: "inferior" }
    ],
    description: "Insightful advocate who reads underlying patterns. Seeks harmony while pursuing meaningful vision."
  },
  INFP: {
    type: "INFP",
    functions: [
      { code: "Fi", role: "dominant" },
      { code: "Ne", role: "auxiliary" },
      { code: "Si", role: "tertiary" },
      { code: "Te", role: "inferior" }
    ],
    description: "Idealistic mediator guided by core values. Explores possibilities that align with authentic principles."
  },
  ENFJ: {
    type: "ENFJ",
    functions: [
      { code: "Fe", role: "dominant" },
      { code: "Ni", role: "auxiliary" },
      { code: "Se", role: "tertiary" },
      { code: "Ti", role: "inferior" }
    ],
    description: "Charismatic mentor who inspires collective growth. Facilitates group harmony toward shared vision."
  },
  ENFP: {
    type: "ENFP",
    functions: [
      { code: "Ne", role: "dominant" },
      { code: "Fi", role: "auxiliary" },
      { code: "Te", role: "tertiary" },
      { code: "Si", role: "inferior" }
    ],
    description: "Enthusiastic champion of authentic possibilities. Energizes others with passionate exploration."
  },

  // Sentinels (SJ)
  ISTJ: {
    type: "ISTJ",
    functions: [
      { code: "Si", role: "dominant" },
      { code: "Te", role: "auxiliary" },
      { code: "Fi", role: "tertiary" },
      { code: "Ne", role: "inferior" }
    ],
    description: "Reliable administrator who values proven methods. Maintains order through detailed attention and responsibility."
  },
  ISFJ: {
    type: "ISFJ",
    functions: [
      { code: "Si", role: "dominant" },
      { code: "Fe", role: "auxiliary" },
      { code: "Ti", role: "tertiary" },
      { code: "Ne", role: "inferior" }
    ],
    description: "Devoted protector who preserves traditions and care. Supports others through practical attention to needs."
  },
  ESTJ: {
    type: "ESTJ",
    functions: [
      { code: "Te", role: "dominant" },
      { code: "Si", role: "auxiliary" },
      { code: "Ne", role: "tertiary" },
      { code: "Fi", role: "inferior" }
    ],
    description: "Organized director who enforces standards. Manages systems efficiently based on established best practices."
  },
  ESFJ: {
    type: "ESFJ",
    functions: [
      { code: "Fe", role: "dominant" },
      { code: "Si", role: "auxiliary" },
      { code: "Ne", role: "tertiary" },
      { code: "Ti", role: "inferior" }
    ],
    description: "Caring host who maintains social harmony. Nurtures community through attentive service and tradition."
  },

  // Explorers (SP)
  ISTP: {
    type: "ISTP",
    functions: [
      { code: "Ti", role: "dominant" },
      { code: "Se", role: "auxiliary" },
      { code: "Ni", role: "tertiary" },
      { code: "Fe", role: "inferior" }
    ],
    description: "Practical troubleshooter who analyzes mechanics. Adapts efficiently to immediate physical challenges."
  },
  ISFP: {
    type: "ISFP",
    functions: [
      { code: "Fi", role: "dominant" },
      { code: "Se", role: "auxiliary" },
      { code: "Ni", role: "tertiary" },
      { code: "Te", role: "inferior" }
    ],
    description: "Gentle artist who experiences authentic beauty. Responds to present moments with personal values."
  },
  ESTP: {
    type: "ESTP",
    functions: [
      { code: "Se", role: "dominant" },
      { code: "Ti", role: "auxiliary" },
      { code: "Fe", role: "tertiary" },
      { code: "Ni", role: "inferior" }
    ],
    description: "Bold entrepreneur who seizes opportunities. Acts decisively based on logical assessment of current reality."
  },
  ESFP: {
    type: "ESFP",
    functions: [
      { code: "Se", role: "dominant" },
      { code: "Fi", role: "auxiliary" },
      { code: "Te", role: "tertiary" },
      { code: "Ni", role: "inferior" }
    ],
    description: "Spontaneous entertainer who celebrates life. Engages others through authentic, present-moment enthusiasm."
  }
};

// Function descriptions for UI display
export const FUNCTION_DESCRIPTIONS: Record<CognitiveFunction, string> = {
  Ni: "Introverted Intuition: Synthesizes patterns into singular insights about future implications",
  Ne: "Extraverted Intuition: Explores multiple possibilities and novel connections",
  Si: "Introverted Sensing: Recalls detailed personal experiences and compares to present",
  Se: "Extraverted Sensing: Engages directly with immediate sensory reality",
  Ti: "Introverted Thinking: Builds precise internal logical frameworks",
  Te: "Extraverted Thinking: Organizes external systems for efficient outcomes",
  Fi: "Introverted Feeling: Evaluates based on deeply held personal values",
  Fe: "Extraverted Feeling: Harmonizes group emotions and social atmosphere"
};

/**
 * Socionics baseline and capacity table
 */
const SOCIONICS_BASELINES: Record<number, { baseline: number; capacity: number }> = {
  1: { baseline: 0.9, capacity: 1.0 },  // Base
  2: { baseline: 0.8, capacity: 0.9 },  // Creative
  3: { baseline: 0.3, capacity: 0.5 },  // Role
  4: { baseline: 0.1, capacity: 0.2 },  // Vulnerable
  5: { baseline: 0.2, capacity: 0.3 },  // Suggestive
  6: { baseline: 0.4, capacity: 0.6 },  // Activating
  7: { baseline: 0.3, capacity: 0.7 },  // Ignoring
  8: { baseline: 0.4, capacity: 0.8 },  // Demonstrative
};

/**
 * Valued positions: 1, 2, 5, 6 are valued (+1), others are not valued (-1)
 */
function isValuedPosition(position: number): boolean {
  return position === 1 || position === 2 || position === 5 || position === 6;
}

/**
 * Function inverses: Ne↔Ni, Se↔Si, Te↔Ti, Fe↔Fi
 * Used for positions 3, 4, 7, and 8 (same function type, opposite attitude)
 * These cannot exist at the same time - they fundamentally contradict when one is active
 */
const functionInverses: Record<CognitiveFunction, CognitiveFunction> = {
  Ne: 'Ni',
  Ni: 'Ne',
  Se: 'Si',
  Si: 'Se',
  Te: 'Ti',
  Ti: 'Te',
  Fe: 'Fi',
  Fi: 'Fe',
};

/**
 * Maps MBTI type to complete Socionics positions for all 8 functions
 * 
 * This uses the standard Socionics Model A mapping derived from MBTI core function stack:
 * 
 * Core stack positions (always known):
 * - Position 1 (Base) = MBTI 1st (Dominant function)
 * - Position 2 (Creative) = MBTI 2nd (Auxiliary function)
 * - Position 5 (Suggestive) = MBTI 4th (Inferior function) - valued
 * - Position 6 (Activating) = MBTI 3rd (Tertiary function) - valued
 * 
 * Derived positions:
 * - Position 3 (Role) = Inverse of MBTI 4th (Inverse of Inferior)
 *   - Same function type, opposite attitude (e.g., Si → Se, Te → Ti)
 * - Position 4 (Vulnerable/PoLR) = Inverse of MBTI 3rd (Inverse of Tertiary)
 *   - Same function type, opposite attitude (e.g., Te → Ti, Si → Se)
 * - Position 7 (Ignoring) = Inverse of MBTI 1st (Inverse of Dominant)
 *   - Same function type, opposite attitude
 *   - Cannot exist at same time as dominant, fundamentally contradicts when dominant is active
 * - Position 8 (Demonstrative) = Inverse of MBTI 2nd (Inverse of Auxiliary)
 *   - Same function type, opposite attitude
 * 
 * Example: ENFP (Ne-Fi-Te-Si in MBTI)
 * - Position 1: Ne (1st/Dominant)
 * - Position 2: Fi (2nd/Auxiliary)
 * - Position 3: Se (inverse of Si/4th)
 * - Position 4: Ti (inverse of Te/3rd)
 * - Position 5: Si (4th/Inferior)
 * - Position 6: Te (3rd/Tertiary)
 * - Position 7: Ni (inverse of Ne/1st)
 * - Position 8: Fe (inverse of Fi/2nd)
 */
export function getSocionicsPositions(mbtiType: string): Record<CognitiveFunction, SocionicsPosition> {
  const config = MBTI_TYPES[mbtiType];
  if (!config) {
    throw new Error(`Unknown MBTI type: ${mbtiType}`);
  }

  const socionics: Partial<Record<CognitiveFunction, SocionicsPosition>> = {};
  const allFunctions: CognitiveFunction[] = ['Te', 'Ti', 'Fe', 'Fi', 'Se', 'Si', 'Ne', 'Ni'];
  
  // Initialize all functions with default positions
  for (const func of allFunctions) {
    socionics[func] = {
      position: 7, // Default to ignoring
      baseline: SOCIONICS_BASELINES[7].baseline,
      capacity: SOCIONICS_BASELINES[7].capacity,
      valued: -1,
    };
  }

  // In Socionics Model A:
  // Position 1 (Base) = Dominant function
  // Position 2 (Creative) = Auxiliary function
  // Position 3 (Role) = Opposite of Base (same attitude, opposite function)
  // Position 4 (Vulnerable/PoLR) = Opposite of Creative (same attitude, opposite function)
  
  // Find functions by role
  const dominant = config.functions.find(f => f.role === 'dominant')?.code;
  const auxiliary = config.functions.find(f => f.role === 'auxiliary')?.code;
  const tertiary = config.functions.find(f => f.role === 'tertiary')?.code;
  const inferior = config.functions.find(f => f.role === 'inferior')?.code;

  // Position 1 (Base) = Dominant function
  if (dominant) {
    const baselineConfig = SOCIONICS_BASELINES[1];
    socionics[dominant] = {
      position: 1,
      baseline: baselineConfig.baseline,
      capacity: baselineConfig.capacity,
      valued: 1,
    };
  }

  // Position 2 (Creative) = Auxiliary function
  if (auxiliary) {
    const baselineConfig = SOCIONICS_BASELINES[2];
    socionics[auxiliary] = {
      position: 2,
      baseline: baselineConfig.baseline,
      capacity: baselineConfig.capacity,
      valued: 1,
    };
  }

  // Position 3 (Role) = Inverse of Inferior (4th position in MBTI stack)
  // This is the inverse of the inferior function (same function type, opposite attitude)
  if (inferior && functionInverses[inferior]) {
    const roleFunc = functionInverses[inferior];
    const baselineConfig = SOCIONICS_BASELINES[3];
    socionics[roleFunc] = {
      position: 3,
      baseline: baselineConfig.baseline,
      capacity: baselineConfig.capacity,
      valued: -1,
    };
  }

  // Position 4 (Vulnerable/PoLR) = Inverse of Tertiary (3rd position in MBTI stack)
  // This is the inverse of the tertiary function (same function type, opposite attitude)
  if (tertiary && functionInverses[tertiary]) {
    const vulnerableFunc = functionInverses[tertiary];
    const baselineConfig = SOCIONICS_BASELINES[4];
    socionics[vulnerableFunc] = {
      position: 4,
      baseline: baselineConfig.baseline,
      capacity: baselineConfig.capacity,
      valued: -1,
    };
  }

  // Position 5 (Suggestive) = Inferior function (4th in MBTI stack) - valued
  if (inferior) {
    const baselineConfig = SOCIONICS_BASELINES[5];
    socionics[inferior] = {
      position: 5,
      baseline: baselineConfig.baseline,
      capacity: baselineConfig.capacity,
      valued: 1,
    };
  }
  
  // Position 6 (Activating) = Tertiary function (3rd in MBTI stack) - valued
  if (tertiary) {
    const baselineConfig = SOCIONICS_BASELINES[6];
    socionics[tertiary] = {
      position: 6,
      baseline: baselineConfig.baseline,
      capacity: baselineConfig.capacity,
      valued: 1,
    };
  }
  
  // Position 7 (Ignoring) = Inverse of Dominant (1st in MBTI stack)
  // Same function type, opposite attitude
  // Cannot exist at the same time as dominant - they fundamentally contradict
  if (dominant && functionInverses[dominant]) {
    const func = functionInverses[dominant];
    const baselineConfig = SOCIONICS_BASELINES[7];
    socionics[func] = {
      position: 7,
      baseline: baselineConfig.baseline,
      capacity: baselineConfig.capacity,
      valued: -1,
    };
  }
  
  // Position 8 (Demonstrative) = Inverse of Auxiliary (2nd in MBTI stack)
  // Same function type, opposite attitude
  if (auxiliary && functionInverses[auxiliary]) {
    const func = functionInverses[auxiliary];
    const baselineConfig = SOCIONICS_BASELINES[8];
    socionics[func] = {
      position: 8,
      baseline: baselineConfig.baseline,
      capacity: baselineConfig.capacity,
      valued: -1,
    };
  }
  
  // All 8 positions should now be assigned based on the core stack derivation
  // Verify all functions are assigned (should be complete)
  const allAssigned = new Set(
    Object.entries(socionics)
      .filter(([_, pos]) => pos && pos.position !== 7) // Exclude defaults
      .map(([func, _]) => func as CognitiveFunction)
  );
  
  // If any functions are still unassigned (shouldn't happen with correct derivation), assign them
  const remainingFunctions = allFunctions.filter(f => !allAssigned.has(f));
  if (remainingFunctions.length > 0) {
    console.warn(`Warning: ${remainingFunctions.length} functions not assigned for ${mbtiType}:`, remainingFunctions);
    // Assign to remaining positions as fallback
    const remainingPositions = [5, 6, 7, 8].filter(pos => 
      !Object.values(socionics).some(s => s?.position === pos)
    );
    
    for (let i = 0; i < remainingFunctions.length && i < remainingPositions.length; i++) {
      const func = remainingFunctions[i];
      const pos = remainingPositions[i];
      const baselineConfig = SOCIONICS_BASELINES[pos];
      socionics[func] = {
        position: pos as 5 | 6 | 7 | 8,
        baseline: baselineConfig.baseline,
        capacity: baselineConfig.capacity,
        valued: isValuedPosition(pos) ? 1 : -1,
      };
    }
  }

  return socionics as Record<CognitiveFunction, SocionicsPosition>;
}
