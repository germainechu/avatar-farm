/**
 * Cognitive Physics Engine
 * 
 * Implements the physics-style engine for simulating cognitive activation
 * in avatars using MBTI functions and Socionics positional definitions.
 * 
 * Core update law:
 * a_i(t+1) = b_i + α(a_i - b_i) + γ_ctx F_ctx + γ_soc F_soc + λ_c C(a_i - b_i)
 */

import type {
  CognitiveFunction,
  ActivationVector,
  SocionicsPosition,
  RelationshipState,
  AvatarPhysicsState,
  PhysicsParameters,
  PhysicsState,
  ContextTag,
  Avatar,
  Message,
} from '../types';

// Function order in activation vectors: [Te, Ti, Fe, Fi, Se, Si, Ne, Ni]
const FUNCTION_ORDER: CognitiveFunction[] = ['Te', 'Ti', 'Fe', 'Fi', 'Se', 'Si', 'Ne', 'Ni'];

/**
 * Default physics parameters (MVP values)
 */
export const DEFAULT_PHYSICS_PARAMS: PhysicsParameters = {
  alpha: 0.7,        // Persistence around baseline
  gamma_ctx: 0.3,    // Context force strength
  gamma_soc: 0.4,    // Social force strength
  lambda_c: 0.2,     // Coupling strength
  eta_ten: 0.1,      // Tension build rate
  rho_ten: 0.05,     // Tension decay rate
  eta_aff: 0.1,      // Affinity build rate
  rho_aff: 0.05,     // Affinity decay rate
  k_aff: 0.5,        // Affinity influence on social force
  k_ten: 0.3,        // Tension influence on social force
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
 * Maps MBTI type to Socionics positions for all 8 functions
 * This uses the standard Socionics Model A positions based on MBTI function stack
 */
export function mapMBTIToSocionics(mbtiType: string): Record<CognitiveFunction, SocionicsPosition> {
  // This function is kept for compatibility but delegates to createSocionicsFromStack
  // The actual mapping is done in createSocionicsFromStack which uses the function stack
  // This is a placeholder - full implementation would use complete MBTI->Socionics lookup
  const socionics: Partial<Record<CognitiveFunction, SocionicsPosition>> = {};
  const positionMap = SOCIONICS_BASELINES;
  
  // Initialize all functions with default positions
  for (const func of FUNCTION_ORDER) {
    socionics[func] = {
      position: 7,
      baseline: positionMap[7].baseline,
      capacity: positionMap[7].capacity,
      valued: -1,
    };
  }
  
  return socionics as Record<CognitiveFunction, SocionicsPosition>;
}

/**
 * Creates Socionics positions from MBTI function stack
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
export function createSocionicsFromStack(
  functions: Array<{ code: CognitiveFunction; role: string }>
): Record<CognitiveFunction, SocionicsPosition> {
  const socionics: Partial<Record<CognitiveFunction, SocionicsPosition>> = {};
  
  // Function inverses: Ne↔Ni, Se↔Si, Te↔Ti, Fe↔Fi
  // Used for positions 3, 4, 7, and 8 (same function type, opposite attitude)
  // These cannot exist at the same time - they fundamentally contradict when one is active
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
  
  // Initialize all functions
  for (const func of FUNCTION_ORDER) {
    socionics[func] = {
      position: 7, // Default to ignoring
      baseline: SOCIONICS_BASELINES[7].baseline,
      capacity: SOCIONICS_BASELINES[7].capacity,
      valued: -1,
    };
  }
  
  // Find dominant and auxiliary functions
  const dominant = functions.find(f => f.role === 'dominant')?.code;
  const auxiliary = functions.find(f => f.role === 'auxiliary')?.code;
  const tertiary = functions.find(f => f.role === 'tertiary')?.code;
  const inferior = functions.find(f => f.role === 'inferior')?.code;
  
  // Position 1 (Base) = Dominant function
  if (dominant) {
    const config = SOCIONICS_BASELINES[1];
    socionics[dominant] = {
      position: 1,
      baseline: config.baseline,
      capacity: config.capacity,
      valued: 1,
    };
  }
  
  // Position 2 (Creative) = Auxiliary function
  if (auxiliary) {
    const config = SOCIONICS_BASELINES[2];
    socionics[auxiliary] = {
      position: 2,
      baseline: config.baseline,
      capacity: config.capacity,
      valued: 1,
    };
  }
  
  // Position 3 (Role) = Inverse of Inferior (4th position in MBTI stack)
  // This is the inverse of the inferior function (same function type, opposite attitude)
  if (inferior && functionInverses[inferior]) {
    const roleFunc = functionInverses[inferior];
    const config = SOCIONICS_BASELINES[3];
    socionics[roleFunc] = {
      position: 3,
      baseline: config.baseline,
      capacity: config.capacity,
      valued: -1,
    };
  }
  
  // Position 4 (Vulnerable/PoLR) = Inverse of Tertiary (3rd position in MBTI stack)
  // This is the inverse of the tertiary function (same function type, opposite attitude)
  if (tertiary && functionInverses[tertiary]) {
    const vulnerableFunc = functionInverses[tertiary];
    const config = SOCIONICS_BASELINES[4];
    socionics[vulnerableFunc] = {
      position: 4,
      baseline: config.baseline,
      capacity: config.capacity,
      valued: -1,
    };
  }
  
  // Position 5 (Suggestive) = Inferior function (4th in MBTI stack) - valued
  if (inferior) {
    const config = SOCIONICS_BASELINES[5];
    socionics[inferior] = {
      position: 5,
      baseline: config.baseline,
      capacity: config.capacity,
      valued: 1,
    };
  }
  
  // Position 6 (Activating) = Tertiary function (3rd in MBTI stack) - valued
  if (tertiary) {
    const config = SOCIONICS_BASELINES[6];
    socionics[tertiary] = {
      position: 6,
      baseline: config.baseline,
      capacity: config.capacity,
      valued: 1,
    };
  }
  
  // Position 7 (Ignoring) = Inverse of Dominant (1st in MBTI stack)
  // Same function type, opposite attitude
  // Cannot exist at the same time as dominant - they fundamentally contradict
  if (dominant && functionInverses[dominant]) {
    const func = functionInverses[dominant];
    const config = SOCIONICS_BASELINES[7];
    socionics[func] = {
      position: 7,
      baseline: config.baseline,
      capacity: config.capacity,
      valued: -1,
    };
  }
  
  // Position 8 (Demonstrative) = Inverse of Auxiliary (2nd in MBTI stack)
  // Same function type, opposite attitude
  if (auxiliary && functionInverses[auxiliary]) {
    const func = functionInverses[auxiliary];
    const config = SOCIONICS_BASELINES[8];
    socionics[func] = {
      position: 8,
      baseline: config.baseline,
      capacity: config.capacity,
      valued: -1,
    };
  }
  
  return socionics as Record<CognitiveFunction, SocionicsPosition>;
}

/**
 * Computes baseline activation vector from Socionics positions
 */
export function computeBaseline(socionicsPositions: Record<CognitiveFunction, SocionicsPosition>): ActivationVector {
  return FUNCTION_ORDER.map(func => socionicsPositions[func].baseline) as ActivationVector;
}

/**
 * Creates initial activation vector (starts at baseline)
 */
export function createInitialActivation(baseline: ActivationVector): ActivationVector {
  return [...baseline] as ActivationVector;
}

/**
 * Coupling matrix C: encodes non-orthogonal function pairs
 * Pairs: Te↔Fi, Ti↔Fe, Ne↔Si, Ni↔Se
 */
function createCouplingMatrix(): number[][] {
  const size = FUNCTION_ORDER.length;
  const matrix: number[][] = Array(size).fill(0).map(() => Array(size).fill(0));
  
  // Define coupling pairs (symmetric)
  const pairs: Array<[CognitiveFunction, CognitiveFunction]> = [
    ['Te', 'Fi'],
    ['Ti', 'Fe'],
    ['Ne', 'Si'],
    ['Ni', 'Se'],
  ];
  
  for (const [func1, func2] of pairs) {
    const idx1 = FUNCTION_ORDER.indexOf(func1);
    const idx2 = FUNCTION_ORDER.indexOf(func2);
    if (idx1 !== -1 && idx2 !== -1) {
      // Coupling strength (can be tuned)
      matrix[idx1][idx2] = 0.3;
      matrix[idx2][idx1] = 0.3;
    }
  }
  
  return matrix;
}

const COUPLING_MATRIX = createCouplingMatrix();

/**
 * Computes coupling term: C · (a_i - b_i)
 */
function computeCouplingTerm(
  activation: ActivationVector,
  baseline: ActivationVector
): ActivationVector {
  const deviation = activation.map((a, i) => a - baseline[i]);
  const result: number[] = Array(FUNCTION_ORDER.length).fill(0);
  
  for (let i = 0; i < FUNCTION_ORDER.length; i++) {
    for (let j = 0; j < FUNCTION_ORDER.length; j++) {
      result[i] += COUPLING_MATRIX[i][j] * deviation[j];
    }
  }
  
  return result as ActivationVector;
}

/**
 * Context tag to function mapping
 */
const CONTEXT_TO_FUNCTIONS: Record<ContextTag, Partial<Record<CognitiveFunction, number>>> = {
  analytical: { Te: 0.8, Ti: 0.7, Ni: 0.3 },
  emotional: { Fe: 0.8, Fi: 0.7, Ne: 0.2 },
  sensory: { Se: 0.8, Si: 0.7 },
  strategic: { Ni: 0.8, Ne: 0.6, Te: 0.4 },
  values_conflict: { Fi: 0.8, Fe: 0.6 },
  practical_action: { Se: 0.7, Te: 0.6 },
};

/**
 * Detects context tags from scenario topic (simplified)
 */
export function detectContextTags(topic: string): ContextTag[] {
  const lowerTopic = topic.toLowerCase();
  const tags: ContextTag[] = [];
  
  // Simple keyword-based detection
  if (lowerTopic.includes('analyze') || lowerTopic.includes('logic') || lowerTopic.includes('system')) {
    tags.push('analytical');
  }
  if (lowerTopic.includes('feel') || lowerTopic.includes('emotion') || lowerTopic.includes('value')) {
    tags.push('emotional');
  }
  if (lowerTopic.includes('sense') || lowerTopic.includes('experience') || lowerTopic.includes('physical')) {
    tags.push('sensory');
  }
  if (lowerTopic.includes('strategy') || lowerTopic.includes('plan') || lowerTopic.includes('future')) {
    tags.push('strategic');
  }
  if (lowerTopic.includes('conflict') || lowerTopic.includes('disagree') || lowerTopic.includes('debate')) {
    tags.push('values_conflict');
  }
  if (lowerTopic.includes('action') || lowerTopic.includes('do') || lowerTopic.includes('implement')) {
    tags.push('practical_action');
  }
  
  // Default to analytical if no tags found
  return tags.length > 0 ? tags : ['analytical'];
}

/**
 * Computes context force F_ctx(t) from context tags
 */
export function computeContextForce(tags: ContextTag[]): ActivationVector {
  const force: number[] = Array(FUNCTION_ORDER.length).fill(0);
  
  for (const tag of tags) {
    const tagMapping = CONTEXT_TO_FUNCTIONS[tag];
    for (const [func, value] of Object.entries(tagMapping)) {
      const idx = FUNCTION_ORDER.indexOf(func as CognitiveFunction);
      if (idx !== -1) {
        force[idx] += value;
      }
    }
  }
  
  // Normalize if multiple tags (simple average)
  if (tags.length > 1) {
    for (let i = 0; i < force.length; i++) {
      force[i] /= tags.length;
    }
  }
  
  return force as ActivationVector;
}

/**
 * Computes social force F_soc_i(t) for avatar i
 * Only applies forces to valued functions (positions 1, 2, 5, 6)
 */
export function computeSocialForce(
  avatarId: string,
  physicsState: PhysicsState,
  recentMessages: Message[],
  allAvatars: Avatar[]
): ActivationVector {
  const force: number[] = Array(FUNCTION_ORDER.length).fill(0);
  const { parameters, avatarStates, relationships } = physicsState;
  
  // Find avatars whose messages "hit" this avatar (replied to or addressed)
  const hittingAvatars = new Set<string>();
  
  // Simple heuristic: if someone spoke recently, they're influencing
  // In a full implementation, you'd parse message content for @mentions or replies
  for (const msg of recentMessages) {
    if (msg.avatarId !== avatarId && msg.avatarId !== 'user') {
      hittingAvatars.add(msg.avatarId);
    }
  }
  
  const currentState = avatarStates.get(avatarId);
  if (!currentState) {
    return force as ActivationVector;
  }
  
  // Compute social force from each hitting avatar
  for (const otherId of hittingAvatars) {
    const otherState = avatarStates.get(otherId);
    if (!otherState) continue;
    
    const rel = relationships.get(avatarId)?.get(otherId);
    if (!rel) continue;
    
    // Weight: w_ij = k_aff * affinity - k_ten * tension
    const weight = parameters.k_aff * rel.affinity - parameters.k_ten * rel.tension;
    
    // F_soc contribution: w_ij * (a_j - b_i)
    // BUT: Only apply to valued functions (positions 1, 2, 5, 6)
    // Unvalued functions (positions 3, 4, 7, 8) are not influenced by social forces
    for (let i = 0; i < FUNCTION_ORDER.length; i++) {
      const func = FUNCTION_ORDER[i];
      const isValued = currentState.socionicsPositions[func].valued > 0;
      
      if (isValued) {
        // Only apply social force to valued functions
        force[i] += weight * (otherState.activation[i] - currentState.baseline[i]);
      }
      // Unvalued functions get no social force (they only respond to context and coupling)
    }
  }
  
  return force as ActivationVector;
}

/**
 * Position-specific damping factors for force application
 * Lower values = more resistance to external forces
 */
const POSITION_DAMPING: Record<number, number> = {
  1: 1.0,  // Base - full force effectiveness
  2: 1.0,  // Creative - full force effectiveness
  3: 0.5,  // Role - half force effectiveness (awkward, limited)
  4: 0.3,  // Vulnerable - low force effectiveness (weak spot)
  5: 0.8,  // Suggestive - high force effectiveness (desired)
  6: 0.8,  // Activating - high force effectiveness (responsive)
  7: 0.3,  // Ignoring - low force effectiveness (unvalued, resisted)
  8: 0.6,  // Demonstrative - medium force effectiveness (unconscious strength)
};

/**
 * Clamps activation values to [0, 1] and respects capacity limits
 */
function clampActivation(
  activation: ActivationVector,
  socionicsPositions: Record<CognitiveFunction, SocionicsPosition>
): ActivationVector {
  return activation.map((val, i) => {
    const func = FUNCTION_ORDER[i];
    const capacity = socionicsPositions[func].capacity;
    // Clamp to both [0, 1] range and position-specific capacity
    return Math.max(0, Math.min(1, Math.min(val, capacity)));
  }) as ActivationVector;
}

/**
 * Core update law: a_i(t+1) = b_i + α(a_i - b_i) + γ_ctx F_ctx + γ_soc F_soc + λ_c C(a_i - b_i)
 * 
 * Now with position-specific damping and capacity-aware clamping:
 * - Context and social forces are damped based on Socionics position
 * - Activation is clamped to position-specific capacity limits
 */
export function updateActivation(
  currentState: AvatarPhysicsState,
  contextForce: ActivationVector,
  socialForce: ActivationVector,
  parameters: PhysicsParameters
): ActivationVector {
  const { baseline, activation, socionicsPositions } = currentState;
  const { alpha, gamma_ctx, gamma_soc, lambda_c } = parameters;
  
  // Compute deviation from baseline
  const deviation = activation.map((a, i) => a - baseline[i]);
  
  // Compute coupling term
  const couplingTerm = computeCouplingTerm(activation, baseline);
  
  // Apply update law with position-specific damping
  const newActivation: number[] = [];
  for (let i = 0; i < FUNCTION_ORDER.length; i++) {
    const func = FUNCTION_ORDER[i];
    const position = socionicsPositions[func].position;
    const damping = POSITION_DAMPING[position] || 1.0;
    
    // Apply damping to context and social forces based on position
    // Lower positions (Role, Vulnerable, Ignoring) resist external forces more
    const dampedContextForce = gamma_ctx * contextForce[i] * damping;
    const dampedSocialForce = gamma_soc * socialForce[i] * damping;
    
    newActivation[i] =
      baseline[i] +
      alpha * deviation[i] +
      dampedContextForce +
      dampedSocialForce +
      lambda_c * couplingTerm[i];
  }
  
  // Clamp to [0, 1] and respect capacity limits
  return clampActivation(newActivation as ActivationVector, socionicsPositions);
}

/**
 * Computes interaction intensity A_ij,f(t) for function f between avatars i and j
 */
function computeInteractionIntensity(
  avatarId1: string,
  avatarId2: string,
  physicsState: PhysicsState,
  funcIndex: number
): number {
  const state1 = physicsState.avatarStates.get(avatarId1);
  const state2 = physicsState.avatarStates.get(avatarId2);
  
  if (!state1 || !state2) return 0;
  
  // Average activation of function f across the pair
  return (state1.activation[funcIndex] + state2.activation[funcIndex]) / 2;
}

/**
 * Computes compatibility kernel K_ij(f) for function f between avatars i and j
 */
function computeCompatibilityKernel(
  avatarId1: string,
  avatarId2: string,
  physicsState: PhysicsState,
  funcIndex: number
): number {
  const state1 = physicsState.avatarStates.get(avatarId1);
  const state2 = physicsState.avatarStates.get(avatarId2);
  
  if (!state1 || !state2) return 0;
  
  const func = FUNCTION_ORDER[funcIndex];
  const pos1 = state1.socionicsPositions[func].position;
  const pos2 = state2.socionicsPositions[func].position;
  const cap1 = state1.socionicsPositions[func].capacity;
  const cap2 = state2.socionicsPositions[func].capacity;
  
  // Helper H(pos1, pos2): -1 for supportive, +1 for resistant, 0 for neutral
  let H = 0;
  
  // Supportive pairs
  if ((pos1 === 1 && pos2 === 4) || (pos1 === 4 && pos2 === 1)) H = -1;
  else if ((pos1 === 1 && pos2 === 5) || (pos1 === 5 && pos2 === 1)) H = -1;
  else if ((pos1 === 2 && pos2 === 6) || (pos1 === 6 && pos2 === 2)) H = -1;
  // Resistant pairs
  else if ((pos1 === 1 && pos2 === 3) || (pos1 === 3 && pos2 === 1)) H = 1;
  else if ((pos1 === 2 && pos2 === 3) || (pos1 === 3 && pos2 === 2)) H = 1;
  
  // K_ij(f) = capacity_i(f) * capacity_j(f) * H
  return cap1 * cap2 * H;
}

/**
 * Computes structural score S_ij(t) for relationship dynamics
 */
function computeStructuralScore(
  avatarId1: string,
  avatarId2: string,
  physicsState: PhysicsState
): number {
  let score = 0;
  
  for (let f = 0; f < FUNCTION_ORDER.length; f++) {
    const K = computeCompatibilityKernel(avatarId1, avatarId2, physicsState, f);
    const A = computeInteractionIntensity(avatarId1, avatarId2, physicsState, f);
    score += K * A;
  }
  
  return score;
}

/**
 * Updates relationship state (affinity and tension) between two avatars
 */
export function updateRelationship(
  avatarId1: string,
  avatarId2: string,
  physicsState: PhysicsState,
  parameters: PhysicsParameters
): RelationshipState {
  const relationships = physicsState.relationships;
  
  // Get or create relationship
  if (!relationships.has(avatarId1)) {
    relationships.set(avatarId1, new Map());
  }
  const relMap = relationships.get(avatarId1)!;
  
  if (!relMap.has(avatarId2)) {
    relMap.set(avatarId2, { affinity: 0.5, tension: 0.1 }); // Default initial state
  }
  
  const currentRel = relMap.get(avatarId2)!;
  
  // Compute structural score
  const S = computeStructuralScore(avatarId1, avatarId2, physicsState);
  
  // Update tension
  const tensionChange =
    parameters.eta_ten * Math.max(0, S) - // Build tension if S > 0 (resistant)
    parameters.rho_ten * Math.max(0, -S);   // Decay tension if S < 0 (supportive)
  
  const newTension = Math.max(0, Math.min(1, currentRel.tension + tensionChange));
  
  // Update affinity
  const affinityChange =
    parameters.eta_aff * Math.max(0, -S) - // Build affinity if S < 0 (supportive)
    parameters.rho_aff * Math.max(0, S);    // Decay affinity if S > 0 (resistant)
  
  const newAffinity = Math.max(0, Math.min(1, currentRel.affinity + affinityChange));
  
  return { affinity: newAffinity, tension: newTension };
}

/**
 * Initializes physics state for a simulation
 */
export function initializePhysicsState(
  avatars: Avatar[],
  parameters: PhysicsParameters = DEFAULT_PHYSICS_PARAMS,
  enableLogging: boolean = true
): PhysicsState {
  const avatarStates = new Map<string, AvatarPhysicsState>();
  const relationships = new Map<string, Map<string, RelationshipState>>();
  
  // Initialize each avatar's physics state
  for (const avatar of avatars) {
    // Use stored Socionics positions if available, otherwise compute from stack
    const socionicsPositions = avatar.socionicsPositions || createSocionicsFromStack(avatar.functions);
    const baseline = computeBaseline(socionicsPositions);
    const activation = createInitialActivation(baseline);
    
    avatarStates.set(avatar.id, {
      avatarId: avatar.id,
      baseline,
      activation,
      socionicsPositions,
    });
    
    // Initialize relationships (default neutral state)
    relationships.set(avatar.id, new Map());
    for (const otherAvatar of avatars) {
      if (otherAvatar.id !== avatar.id) {
        relationships.get(avatar.id)!.set(otherAvatar.id, {
          affinity: 0.5,
          tension: 0.1,
        });
      }
    }
  }
  
  const physicsState: PhysicsState = {
    avatarStates,
    relationships,
    parameters,
    timeStep: 0,
  };
  
  // Log initial state
  if (enableLogging) {
    logPhysicsState(physicsState, avatars);
  }
  
  return physicsState;
}

/**
 * Updates physics state after a message is generated
 */
export function updatePhysicsStateAfterMessage(
  physicsState: PhysicsState,
  message: Message,
  scenarioTopic: string,
  allMessages: Message[],
  allAvatars: Avatar[],
  enableLogging: boolean = true
): void {
  const { avatarStates, parameters } = physicsState;
  const avatarState = avatarStates.get(message.avatarId);
  
  if (!avatarState) return;
  
  // Store previous activation for logging
  const previousActivation = [...avatarState.activation] as ActivationVector;
  
  // Get recent messages for social force computation
  const recentMessages = allMessages.slice(-5); // Last 5 messages
  
  // Detect context tags from topic
  const contextTags = detectContextTags(scenarioTopic);
  const contextForce = computeContextForce(contextTags);
  
  // Compute social force
  const socialForce = computeSocialForce(
    message.avatarId,
    physicsState,
    recentMessages,
    allAvatars
  );
  
  // Update activation
  const newActivation = updateActivation(
    avatarState,
    contextForce,
    socialForce,
    parameters
  );
  
  avatarState.activation = newActivation;
  
  // Update relationships with other avatars
  for (const otherAvatar of allAvatars) {
    if (otherAvatar.id !== message.avatarId) {
      const updatedRel = updateRelationship(
        message.avatarId,
        otherAvatar.id,
        physicsState,
        parameters
      );
      
      if (!physicsState.relationships.has(message.avatarId)) {
        physicsState.relationships.set(message.avatarId, new Map());
      }
      physicsState.relationships.get(message.avatarId)!.set(otherAvatar.id, updatedRel);
    }
  }
  
  physicsState.timeStep++;
  
  // Note: Individual message updates are logged via logPhysicsState after each round
  // to avoid duplication. logPhysicsUpdate is kept for potential future use but not called here.
}

/**
 * Gets current activation levels as a readable object
 */
export function getActivationLevels(
  avatarState: AvatarPhysicsState
): Record<CognitiveFunction, number> {
  const levels: Partial<Record<CognitiveFunction, number>> = {};
  for (let i = 0; i < FUNCTION_ORDER.length; i++) {
    levels[FUNCTION_ORDER[i]] = avatarState.activation[i];
  }
  return levels as Record<CognitiveFunction, number>;
}

/**
 * Gets relationship state between two avatars
 */
export function getRelationship(
  physicsState: PhysicsState,
  avatarId1: string,
  avatarId2: string
): RelationshipState | null {
  return physicsState.relationships.get(avatarId1)?.get(avatarId2) || null;
}

/**
 * Logging utilities for monitoring avatar physics state
 */

/**
 * Formats activation level for display
 */
function formatActivationLevel(level: number): string {
  const percent = (level * 100).toFixed(1);
  const barLength = Math.round(level * 20);
  const bar = '█'.repeat(barLength) + '░'.repeat(20 - barLength);
  return `${bar} ${percent}%`;
}

/**
 * Logs the complete physics state for all avatars
 */
export function logPhysicsState(
  physicsState: PhysicsState,
  avatars: Avatar[],
  messageId?: string
): void {
  const { avatarStates, relationships, timeStep } = physicsState;
  
  // Create avatar lookup map for O(1) access
  const avatarMap = new Map<string, Avatar>();
  for (const avatar of avatars) {
    avatarMap.set(avatar.id, avatar);
  }
  
  // Extract round number from messageId if it's a round completion message
  const roundMatch = messageId?.match(/Round (\d+)/);
  const roundNumber = roundMatch ? roundMatch[1] : null;
  const timestamp = new Date().toISOString().split('T')[1].split('.')[0]; // HH:MM:SS format
  
  const logPrefix = roundNumber 
    ? `🧠 Physics State - Round ${roundNumber} Complete`
    : messageId 
    ? `🧠 Physics State - ${messageId}`
    : '🧠 Physics State - Initialized';
  
  console.group(`${logPrefix} | Step: ${timeStep} | Time: ${timestamp}`);
  
  for (const avatar of avatars) {
    const state = avatarStates.get(avatar.id);
    if (!state) continue;
    
    console.group(`👤 ${avatar.name} (${avatar.mbtiType})`);
    
    // Build sorted activation list with baseline data
    const sortedActivations: Array<{ func: CognitiveFunction; level: number; baseline: number }> = [];
    for (let i = 0; i < FUNCTION_ORDER.length; i++) {
      sortedActivations.push({
        func: FUNCTION_ORDER[i],
        level: state.activation[i],
        baseline: state.baseline[i],
      });
    }
    // Sort by activation level (highest first)
    sortedActivations.sort((a, b) => b.level - a.level);
    
    // Get top 3 for summary
    const topFunctions = sortedActivations.slice(0, 3);
    const topFunctionSet = new Set(topFunctions.map(tf => tf.func));
    
    // Activation levels (ordered by activation level, highest first)
    console.group('⚡ Activation Levels');
    for (const { func, level, baseline } of sortedActivations) {
      const deviation = level - baseline;
      const deviationStr = deviation >= 0 ? `+${(deviation * 100).toFixed(1)}%` : `${(deviation * 100).toFixed(1)}%`;
      const marker = topFunctionSet.has(func) ? '🔥' : '  ';
      
      console.log(
        `${marker} ${func.padEnd(2)}: ${formatActivationLevel(level)} ` +
        `(baseline: ${(baseline * 100).toFixed(1)}%, delta: ${deviationStr})`
      );
    }
    console.groupEnd();
    
    // Top functions summary
    console.log('🎯 Top Functions:', topFunctions.map(tf => `${tf.func}(${(tf.level * 100).toFixed(1)}%)`).join(', '));
    
    // Relationships
    const avatarRels = relationships.get(avatar.id);
    if (avatarRels && avatarRels.size > 0) {
      console.group('💞 Relationships');
      for (const [otherId, rel] of avatarRels.entries()) {
        const otherAvatar = avatarMap.get(otherId);
        if (!otherAvatar) continue;
        
        // Pre-compute bars
        const affinityBarLength = Math.round(rel.affinity * 10);
        const tensionBarLength = Math.round(rel.tension * 10);
        const affinityBar = '█'.repeat(affinityBarLength) + '░'.repeat(10 - affinityBarLength);
        const tensionBar = '█'.repeat(tensionBarLength) + '░'.repeat(10 - tensionBarLength);
        
        console.log(
          `  ${otherAvatar.name}: ` +
          `affinity ${affinityBar} ${(rel.affinity * 100).toFixed(0)}% | ` +
          `tension ${tensionBar} ${(rel.tension * 100).toFixed(0)}%`
        );
      }
      console.groupEnd();
    }
    
    console.groupEnd();
  }
  
  console.groupEnd();
}

/**
 * Logs a summary of physics state changes after an update
 */
export function logPhysicsUpdate(
  physicsState: PhysicsState,
  avatar: Avatar,
  previousActivation: ActivationVector,
  contextTags: ContextTag[]
): void {
  const state = physicsState.avatarStates.get(avatar.id);
  if (!state) return;
  
  // Build changes array and filter in one pass
  const changes: Array<{ func: CognitiveFunction; before: number; after: number; change: number }> = [];
  for (let i = 0; i < FUNCTION_ORDER.length; i++) {
    const change = state.activation[i] - previousActivation[i];
    if (Math.abs(change) > 0.01) { // Only significant changes
      changes.push({
        func: FUNCTION_ORDER[i],
        before: previousActivation[i],
        after: state.activation[i],
        change,
      });
    }
  }
  
  // Sort changes by absolute change amount (largest first)
  changes.sort((a, b) => Math.abs(b.change) - Math.abs(a.change));
  
  if (changes.length > 0) {
    console.group(`🔄 ${avatar.name} - State Update (Step ${physicsState.timeStep})`);
    
    // Pre-compute context string
    const contextStr = contextTags.length > 0 ? contextTags.join(', ') : 'none';
    console.log('🏷️  Context:', contextStr);
    
    console.log('📊 Significant Changes:');
    for (const c of changes) {
      const changeStr = c.change >= 0 ? `+${(c.change * 100).toFixed(1)}%` : `${(c.change * 100).toFixed(1)}%`;
      const arrow = c.change > 0 ? '↑' : '↓';
      console.log(`  ${arrow} ${c.func}: ${(c.before * 100).toFixed(1)}% → ${(c.after * 100).toFixed(1)}% (${changeStr})`);
    }
    
    console.groupEnd();
  }
}

