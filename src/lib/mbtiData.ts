import type { CognitiveFunction, AvatarFunction } from '../types';

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
