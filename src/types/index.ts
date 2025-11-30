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
}

// Message
export type MessageTag = "support" | "critique" | "idea" | "clarify";

export interface Message {
  id: string;
  scenarioId: string;
  avatarId: string;
  round: number;
  content: string;
  tag: MessageTag;
  createdAt: string;
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
