import type { AvatarFunction, AvatarBehavior, CognitiveFunction } from '../types';

/**
 * Derives behavior parameters from an avatar's cognitive function stack.
 * 
 * This algorithm weights each function by its role (dominant > auxiliary > tertiary > inferior)
 * and combines their influences to produce the final behavior profile.
 */

// Weight multipliers by function role
const ROLE_WEIGHTS = {
  dominant: 1.0,
  auxiliary: 0.7,
  tertiary: 0.3,
  inferior: 0.1
};

// Function contributions to each behavior dimension
interface FunctionProfile {
  abstractness: number;
  emotionalFocus: number;
  structure: number;
  temporalBias: "past" | "present" | "future";
  riskTaking: number;
}

const FUNCTION_PROFILES: Record<CognitiveFunction, FunctionProfile> = {
  // Intuition functions - high abstractness
  Ni: {
    abstractness: 1.0,
    emotionalFocus: 0.3,
    structure: 0.6,
    temporalBias: "future",
    riskTaking: 0.4
  },
  Ne: {
    abstractness: 1.0,
    emotionalFocus: 0.3,
    structure: 0.2,
    temporalBias: "future",
    riskTaking: 0.8
  },
  
  // Sensing functions - low abstractness
  Si: {
    abstractness: 0.1,
    emotionalFocus: 0.4,
    structure: 0.7,
    temporalBias: "past",
    riskTaking: 0.2
  },
  Se: {
    abstractness: 0.2,
    emotionalFocus: 0.4,
    structure: 0.3,
    temporalBias: "present",
    riskTaking: 0.9
  },
  
  // Thinking functions - low emotional focus, high structure
  Ti: {
    abstractness: 0.6,
    emotionalFocus: 0.1,
    structure: 0.8,
    temporalBias: "present",
    riskTaking: 0.4
  },
  Te: {
    abstractness: 0.5,
    emotionalFocus: 0.2,
    structure: 0.9,
    temporalBias: "present",
    riskTaking: 0.5
  },
  
  // Feeling functions - high emotional focus
  Fi: {
    abstractness: 0.5,
    emotionalFocus: 0.9,
    structure: 0.4,
    temporalBias: "present",
    riskTaking: 0.3
  },
  Fe: {
    abstractness: 0.4,
    emotionalFocus: 1.0,
    structure: 0.5,
    temporalBias: "present",
    riskTaking: 0.5
  }
};

/**
 * Calculates a weighted average for a numeric behavior dimension
 */
function calculateWeightedAverage(
  functions: AvatarFunction[],
  dimension: keyof Omit<FunctionProfile, 'temporalBias'>
): number {
  let totalWeight = 0;
  let weightedSum = 0;

  for (const func of functions) {
    const weight = ROLE_WEIGHTS[func.role];
    const profile = FUNCTION_PROFILES[func.code];
    weightedSum += profile[dimension] * weight;
    totalWeight += weight;
  }

  return totalWeight > 0 ? weightedSum / totalWeight : 0.5;
}

/**
 * Determines temporal focus based on dominant and auxiliary functions
 */
function determineTemporalFocus(functions: AvatarFunction[]): "past" | "present" | "future" | "mixed" {
  const dominant = functions.find(f => f.role === 'dominant');
  const auxiliary = functions.find(f => f.role === 'auxiliary');

  if (!dominant) return "mixed";

  const domProfile = FUNCTION_PROFILES[dominant.code];
  const auxProfile = auxiliary ? FUNCTION_PROFILES[auxiliary.code] : null;

  // If both dominant and auxiliary agree on temporal bias, use it
  if (auxProfile && domProfile.temporalBias === auxProfile.temporalBias) {
    return domProfile.temporalBias;
  }

  // If dominant is Ni/Ne, strongly future-oriented
  if (dominant.code === 'Ni' || dominant.code === 'Ne') {
    return "future";
  }

  // If dominant is Si, strongly past-oriented
  if (dominant.code === 'Si') {
    return "past";
  }

  // If dominant is Se, strongly present-oriented
  if (dominant.code === 'Se') {
    return "present";
  }

  // Otherwise mixed
  return "mixed";
}

/**
 * Main function to derive behavior from cognitive function stack
 */
export function deriveBehavior(functions: AvatarFunction[]): AvatarBehavior {
  return {
    abstractness: calculateWeightedAverage(functions, 'abstractness'),
    emotionalFocus: calculateWeightedAverage(functions, 'emotionalFocus'),
    structure: calculateWeightedAverage(functions, 'structure'),
    temporalFocus: determineTemporalFocus(functions),
    riskTaking: calculateWeightedAverage(functions, 'riskTaking')
  };
}

/**
 * Helper to get a human-readable description of behavior profile
 */
export function describeBehavior(behavior: AvatarBehavior): string {
  const parts: string[] = [];

  // Abstractness
  if (behavior.abstractness > 0.7) {
    parts.push("highly abstract and conceptual");
  } else if (behavior.abstractness < 0.3) {
    parts.push("concrete and detail-oriented");
  }

  // Emotional focus
  if (behavior.emotionalFocus > 0.7) {
    parts.push("emotionally attuned");
  } else if (behavior.emotionalFocus < 0.3) {
    parts.push("logically focused");
  }

  // Structure
  if (behavior.structure > 0.7) {
    parts.push("systematic and organized");
  } else if (behavior.structure < 0.3) {
    parts.push("flexible and adaptive");
  }

  // Risk taking
  if (behavior.riskTaking > 0.7) {
    parts.push("bold and spontaneous");
  } else if (behavior.riskTaking < 0.3) {
    parts.push("cautious and deliberate");
  }

  // Temporal focus
  parts.push(`${behavior.temporalFocus}-focused`);

  return parts.join(", ");
}
