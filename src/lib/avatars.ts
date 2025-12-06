import type { Avatar } from '../types';
import { MBTI_TYPES, getSocionicsPositions } from './mbtiData';
import { deriveBehavior } from './behaviorDerivation';

/**
 * Generates the complete set of 16 MBTI avatars with derived behavior parameters
 */
export function generateAvatars(): Avatar[] {
  const avatars: Avatar[] = [];

  for (const [mbtiType, config] of Object.entries(MBTI_TYPES)) {
    const behavior = deriveBehavior(config.functions);
    const socionicsPositions = getSocionicsPositions(mbtiType);
    
    avatars.push({
      id: mbtiType.toLowerCase(),
      mbtiType: mbtiType,
      name: generateAvatarName(mbtiType),
      functions: config.functions,
      behavior,
      description: config.description,
      socionicsPositions
    });
  }

  return avatars;
}

/**
 * Generates a friendly name for each avatar based on their type
 */
function generateAvatarName(mbtiType: string): string {
  const names: Record<string, string> = {
    // Analysts
    INTJ: "The Architect",
    INTP: "The Logician",
    ENTJ: "The Commander",
    ENTP: "The Debater",
    
    // Diplomats
    INFJ: "The Advocate",
    INFP: "The Mediator",
    ENFJ: "The Protagonist",
    ENFP: "The Campaigner",
    
    // Sentinels
    ISTJ: "The Logistician",
    ISFJ: "The Defender",
    ESTJ: "The Executive",
    ESFJ: "The Consul",
    
    // Explorers
    ISTP: "The Virtuoso",
    ISFP: "The Adventurer",
    ESTP: "The Entrepreneur",
    ESFP: "The Entertainer"
  };

  return names[mbtiType] || mbtiType;
}

/**
 * Gets a single avatar by ID
 */
export function getAvatarById(avatars: Avatar[], id: string): Avatar | undefined {
  return avatars.find(a => a.id === id);
}

/**
 * Gets avatars by their MBTI type codes
 */
export function getAvatarsByIds(avatars: Avatar[], ids: string[]): Avatar[] {
  return ids.map(id => getAvatarById(avatars, id)).filter((a): a is Avatar => a !== undefined);
}

/**
 * Groups avatars by their temperament (NT, NF, SJ, SP)
 */
export function groupAvatarsByTemperament(avatars: Avatar[]): Record<string, Avatar[]> {
  const groups: Record<string, Avatar[]> = {
    NT: [], // Analysts
    NF: [], // Diplomats
    SJ: [], // Sentinels
    SP: []  // Explorers
  };

  for (const avatar of avatars) {
    const type = avatar.mbtiType;
    
    if (type.includes('NT')) {
      groups.NT.push(avatar);
    } else if (type.includes('NF')) {
      groups.NF.push(avatar);
    } else if (type.endsWith('J') && (type.startsWith('IS') || type.startsWith('ES'))) {
      groups.SJ.push(avatar);
    } else if (type.endsWith('P') && (type.startsWith('IS') || type.startsWith('ES'))) {
      groups.SP.push(avatar);
    }
  }

  return groups;
}
