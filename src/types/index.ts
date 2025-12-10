// Core type definitions for MBTI Avatar Farm

// Cognitive Functions
export type CognitiveFunction = "Fi" | "Fe" | "Ti" | "Te" | "Si" | "Se" | "Ni" | "Ne";

export type FunctionRole = "dominant" | "auxiliary" | "tertiary" | "inferior";

export interface AvatarFunction {
  code: CognitiveFunction;
  role: FunctionRole;
}

// Avatar Behavior Parameters
export interface AvatarBehavior {
  abstractness: number;       // 0-1 (Si/Se lower, Ni/Ne higher)
  emotionalFocus: number;     // 0-1 (Fi/Fe higher, Ti/Te lower)
  structure: number;          // 0-1 (Te/Ti higher)
  temporalFocus: "past" | "present" | "future" | "mixed";
  riskTaking: number;         // 0-1 (Se/Ne higher)
}

// Avatar
export interface Avatar {
  id: string;
  mbtiType: string;
  name: string;
  functions: AvatarFunction[];
  behavior: AvatarBehavior;
  description: string;
  socionicsPositions?: Record<CognitiveFunction, SocionicsPosition>; // Socionics positions for each function
}

// Scenario
export type InteractionStyle = "debate" | "brainstorm" | "cooperative";

export interface Scenario {
  id: string;
  topic: string;
  style: InteractionStyle;
  avatarIds: string[];
  rounds: number;
  createdAt: string;
  useLLM?: boolean; // Optional flag to enable LLM-powered message generation
  image?: MessageImage; // Optional image attached to the scenario
}

// Message
export type MessageTag = "support" | "critique" | "idea" | "clarify";

export type ImageModerationStatus = "pending" | "approved" | "rejected" | "error";

export interface MessageImage {
  url: string; // Base64 data URL or uploaded URL
  moderationStatus: ImageModerationStatus;
  moderationResult?: {
    safe: boolean;
    categories?: {
      nudity?: number;
      violence?: number;
      weapons?: number;
      offensive?: number;
      [key: string]: number | undefined;
    };
  };
}

export interface Message {
  id: string;
  scenarioId: string;
  avatarId: string;
  round: number;
  content: string;
  tag: MessageTag;
  createdAt: string;
  activeFunctions?: CognitiveFunction[]; // Cognitive functions actively used in this message
  image?: MessageImage; // Optional image attached to the message
}

// Avatar Position (concluding statement)
export interface AvatarPosition {
  avatarId: string;
  content: string;
  round: number; // The round number this position is based on
}

// Simulation State
export interface SimulationState {
  scenario: Scenario;
  messages: Message[];
  currentRound: number;
  isRunning: boolean;
  isPaused: boolean;
}

// Cognitive Physics Engine Types

// Socionics position (1-8) with baseline, capacity, and valuation
export interface SocionicsPosition {
  position: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
  baseline: number;  // Default activation at rest
  capacity: number;  // Maximum activation under pressure
  valued: 1 | -1;    // +1 if valued, -1 if not valued
}

// 8D activation vector (one value per cognitive function)
export type ActivationVector = [
  number, // Te
  number, // Ti
  number, // Fe
  number, // Fi
  number, // Se
  number, // Si
  number, // Ne
  number  // Ni
];

// Relationship state between two avatars
export interface RelationshipState {
  affinity: number;  // [0, 1] - how much i likes/feels close to j
  tension: number;   // [0, 1] - how much unresolved friction i feels toward j
  // Constraint: affinity + tension = 1.0 (100%)
}

// Physics state for a single avatar
export interface AvatarPhysicsState {
  avatarId: string;
  baseline: ActivationVector;        // b_i - baseline activation profile
  activation: ActivationVector;      // a_i(t) - current activation state
  socionicsPositions: Record<CognitiveFunction, SocionicsPosition>; // Socionics positions for each function
}

// Global physics parameters
export interface PhysicsParameters {
  alpha: number;      // α - persistence/inertia around baseline [0, 1]
  gamma_ctx: number;  // γ_ctx - strength of context forces ≥ 0
  gamma_soc: number;  // γ_soc - strength of social forces ≥ 0
  lambda_c: number;   // λ_c - strength of function coupling ≥ 0
  eta_ten: number;    // η_ten - tension build rate ≥ 0
  rho_ten: number;    // ρ_ten - tension decay rate ≥ 0
  eta_aff: number;   // η_aff - affinity build rate ≥ 0
  rho_aff: number;    // ρ_aff - affinity decay rate ≥ 0
  k_aff: number;      // k_aff - affinity influence on social force ≥ 0
  k_ten: number;      // k_ten - tension influence on social force ≥ 0
}

// Complete physics state for a simulation
export interface PhysicsState {
  avatarStates: Map<string, AvatarPhysicsState>;
  relationships: Map<string, Map<string, RelationshipState>>; // [avatarId_i][avatarId_j] -> relationship
  parameters: PhysicsParameters;
  timeStep: number; // Current time step t
}

// Context tag for topic/situation analysis
export type ContextTag =
  | 'analytical'
  | 'emotional'
  | 'sensory'
  | 'strategic'
  | 'values_conflict'
  | 'practical_action';
