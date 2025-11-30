import type { Avatar, Scenario, Message } from '../types';

/**
 * LLM-powered simulation engine for generating avatar messages
 * 
 * Uses DeepSeek API to generate natural, contextual conversations.
 * Each message triggers a new thread to DeepSeek with sliding window context.
 */

interface MessageContext {
  avatar: Avatar;
  scenario: Scenario;
  history: Message[];
  round: number;
  avatars?: Avatar[]; // Needed for speaker identification in conversation context
}

/**
 * Generates a message using LLM (DeepSeek API)
 */
async function generateLLMMessage(
  context: MessageContext
): Promise<Message> {
  const { avatar, scenario, history, round, avatars = [] } = context;

  // Call API endpoint - each message triggers a new thread to DeepSeek
  // The API will build the conversation context with a sliding window (last 5 messages)
  const apiUrl = '/api/generate-message';
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      avatar,
      scenario,
      history: history.map(msg => ({
        id: msg.id,
        avatarId: msg.avatarId,
        content: msg.content,
        tag: msg.tag,
        round: msg.round,
      })),
      avatars: avatars.map(a => ({
        id: a.id,
        name: a.name,
        mbtiType: a.mbtiType,
      })),
      round,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    
    // Provide helpful error message for 404 (API route not found)
    if (response.status === 404) {
      throw new Error(
        `API endpoint not found (404). Make sure you're running 'npm run dev:vercel' for local development, ` +
        `or that the API is deployed on Vercel. Details: ${errorText}`
      );
    }
    
    throw new Error(`API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  
  if (data.error) {
    throw new Error(data.error);
  }

  return {
    id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    scenarioId: scenario.id,
    avatarId: avatar.id,
    round,
    content: data.content || '',
    tag: data.tag || 'support',
    createdAt: new Date().toISOString()
  };
}

/**
 * Main function to generate a message for an avatar
 * Always uses LLM mode (DeepSeek API)
 */
export async function generateMessage(context: MessageContext): Promise<Message> {
  // Always use LLM generation
  return await generateLLMMessage(context);
}

/**
 * Runs a full simulation and returns all messages
 * Uses async LLM generation with sequential round-robin turns
 * Each message triggers a new thread to DeepSeek with sliding window context
 */
export async function runSimulation(scenario: Scenario, avatars: Avatar[]): Promise<Message[]> {
  const messages: Message[] = [];
  const participants = avatars.filter(a => scenario.avatarIds.includes(a.id));

  if (participants.length === 0) {
    throw new Error('No valid participants for simulation');
  }

  // Round-robin turn taking (sequential for proper context)
  for (let round = 1; round <= scenario.rounds; round++) {
    for (const avatar of participants) {
      const message = await generateMessage({
        avatar,
        scenario,
        history: messages,
        round,
        avatars // Pass avatars for speaker identification in context
      });
      messages.push(message);
    }
  }

  return messages;
}
