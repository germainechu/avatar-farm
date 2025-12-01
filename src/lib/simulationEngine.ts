import type { Avatar, Scenario, Message, AvatarPosition } from '../types';

/**
 * Delay between messages appearing (in milliseconds)
 * This gives readers time to read each message before the next one appears.
 * Adjust this value to fine-tune the pacing of the conversation.
 */
export const MESSAGE_DISPLAY_DELAY_MS = 1500; // 1.5 seconds

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
 * 
 * @param onMessage - Optional callback that fires as each message is generated (for live updates)
 * @param onTypingStart - Optional callback that fires when an avatar starts generating (for typing indicator)
 * @param onTypingEnd - Optional callback that fires when an avatar finishes generating
 */
export async function runSimulation(
  scenario: Scenario, 
  avatars: Avatar[],
  onMessage?: (message: Message) => void,
  onTypingStart?: (avatarId: string) => void,
  onTypingEnd?: (avatarId: string) => void
): Promise<Message[]> {
  const messages: Message[] = [];
  const participants = avatars.filter(a => scenario.avatarIds.includes(a.id));

  if (participants.length === 0) {
    throw new Error('No valid participants for simulation');
  }

  // Round-robin turn taking (sequential for proper context)
  for (let round = 1; round <= scenario.rounds; round++) {
    for (const avatar of participants) {
      // Notify that this avatar is starting to generate (typing indicator)
      if (onTypingStart) {
        onTypingStart(avatar.id);
      }

      const message = await generateMessage({
        avatar,
        scenario,
        history: messages,
        round,
        avatars // Pass avatars for speaker identification in context
      });
      messages.push(message);
      
      // Notify that this avatar finished generating
      if (onTypingEnd) {
        onTypingEnd(avatar.id);
      }
      
      // Fire callback immediately when message is generated (for live chat feel)
      if (onMessage) {
        onMessage(message);
      }

      // Add delay after message appears to give readers time to read it
      // Skip delay after the last message of the last round
      const isLastMessage = round === scenario.rounds && avatar === participants[participants.length - 1];
      if (!isLastMessage) {
        await new Promise(resolve => setTimeout(resolve, MESSAGE_DISPLAY_DELAY_MS));
      }
    }
  }

  return messages;
}

/**
 * Continues a simulation from existing messages
 * Adds additional rounds to an ongoing conversation
 * 
 * @param scenario - The scenario (with updated rounds count)
 * @param existingMessages - Messages from the previous simulation
 * @param avatars - All avatars
 * @param onMessage - Optional callback that fires as each message is generated
 * @param onTypingStart - Optional callback that fires when an avatar starts generating
 * @param onTypingEnd - Optional callback that fires when an avatar finishes generating
 * @returns Array of new messages generated
 */
export async function continueSimulation(
  scenario: Scenario,
  existingMessages: Message[],
  avatars: Avatar[],
  onMessage?: (message: Message) => void,
  onTypingStart?: (avatarId: string) => void,
  onTypingEnd?: (avatarId: string) => void
): Promise<Message[]> {
  const participants = avatars.filter(a => scenario.avatarIds.includes(a.id));

  if (participants.length === 0) {
    throw new Error('No valid participants for simulation');
  }

  // Calculate the starting round (next round after existing messages)
  const lastRound = existingMessages.length > 0 
    ? Math.max(...existingMessages.map(m => m.round))
    : 0;
  const startRound = lastRound + 1;
  const endRound = scenario.rounds;

  const newMessages: Message[] = [];
  const allMessages = [...existingMessages]; // Include existing for context

  // Continue round-robin turn taking
  for (let round = startRound; round <= endRound; round++) {
    for (const avatar of participants) {
      // Notify that this avatar is starting to generate
      if (onTypingStart) {
        onTypingStart(avatar.id);
      }

      const message = await generateMessage({
        avatar,
        scenario,
        history: allMessages, // Use all messages (existing + new) for context
        round,
        avatars
      });
      
      newMessages.push(message);
      allMessages.push(message); // Add to all messages for next iteration's context
      
      // Notify that this avatar finished generating
      if (onTypingEnd) {
        onTypingEnd(avatar.id);
      }
      
      // Fire callback immediately when message is generated
      if (onMessage) {
        onMessage(message);
      }

      // Add delay after message appears
      const isLastMessage = round === endRound && avatar === participants[participants.length - 1];
      if (!isLastMessage) {
        await new Promise(resolve => setTimeout(resolve, MESSAGE_DISPLAY_DELAY_MS));
      }
    }
  }

  return newMessages;
}

/**
 * Continues simulation after a user interjection
 * Avatars will respond to the user's input and continue the conversation
 * 
 * @param scenario - The scenario (with updated rounds count)
 * @param existingMessages - Messages including the user interjection
 * @param avatars - All avatars
 * @param onMessage - Optional callback that fires as each message is generated
 * @param onTypingStart - Optional callback that fires when an avatar starts generating
 * @param onTypingEnd - Optional callback that fires when an avatar finishes generating
 * @returns Array of new messages generated
 */
export async function interjectAndContinue(
  scenario: Scenario,
  existingMessages: Message[],
  avatars: Avatar[],
  onMessage?: (message: Message) => void,
  onTypingStart?: (avatarId: string) => void,
  onTypingEnd?: (avatarId: string) => void
): Promise<Message[]> {
  const participants = avatars.filter(a => scenario.avatarIds.includes(a.id));

  if (participants.length === 0) {
    throw new Error('No valid participants for simulation');
  }

  // Find the user interjection (last message with avatarId === 'user')
  const userMessage = existingMessages.filter(m => m.avatarId === 'user').pop();
  const userInterjectionRound = userMessage?.round || 0;

  // Calculate the starting round (next round after user interjection)
  const startRound = userInterjectionRound + 1;
  const endRound = scenario.rounds;

  const newMessages: Message[] = [];
  const allMessages = [...existingMessages]; // Include existing for context

  // Continue round-robin turn taking, with avatars responding to user interjection
  for (let round = startRound; round <= endRound; round++) {
    for (const avatar of participants) {
      // Notify that this avatar is starting to generate
      if (onTypingStart) {
        onTypingStart(avatar.id);
      }

      const message = await generateMessage({
        avatar,
        scenario,
        history: allMessages, // Use all messages (including user interjection) for context
        round,
        avatars
      });
      
      newMessages.push(message);
      allMessages.push(message); // Add to all messages for next iteration's context
      
      // Notify that this avatar finished generating
      if (onTypingEnd) {
        onTypingEnd(avatar.id);
      }
      
      // Fire callback immediately when message is generated
      if (onMessage) {
        onMessage(message);
      }

      // Add delay after message appears
      const isLastMessage = round === endRound && avatar === participants[participants.length - 1];
      if (!isLastMessage) {
        await new Promise(resolve => setTimeout(resolve, MESSAGE_DISPLAY_DELAY_MS));
      }
    }
  }

  return newMessages;
}

/**
 * Generates a concluding position for an avatar based on the full conversation
 */
async function generateAvatarPosition(
  avatar: Avatar,
  scenario: Scenario,
  messages: Message[],
  avatars: Avatar[],
  round: number
): Promise<AvatarPosition> {
  const apiUrl = '/api/generate-position';
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      avatar,
      scenario,
      messages: messages.map(msg => ({
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
    
    if (response.status === 404) {
      throw new Error(
        `Position API endpoint not found (404). Make sure you're running 'npm run dev:vercel' for local development, ` +
        `or that the API is deployed on Vercel. Details: ${errorText}`
      );
    }
    
    throw new Error(`Position API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  
  if (data.error) {
    throw new Error(data.error);
  }

  return {
    avatarId: avatar.id,
    content: data.content || '',
    round,
  };
}

/**
 * Generates concluding positions for all participating avatars
 * @param scenario - The scenario that was discussed
 * @param messages - All messages from the simulation
 * @param avatars - All avatars (will filter to participants)
 * @returns Array of positions, one per participating avatar
 */
export async function generatePositions(
  scenario: Scenario,
  messages: Message[],
  avatars: Avatar[]
): Promise<AvatarPosition[]> {
  const participants = avatars.filter(a => scenario.avatarIds.includes(a.id));
  
  if (participants.length === 0) {
    return [];
  }

  // Generate positions for all participants in parallel
  const positionPromises = participants.map(avatar =>
    generateAvatarPosition(avatar, scenario, messages, avatars, scenario.rounds)
  );

  try {
    const positions = await Promise.all(positionPromises);
    return positions;
  } catch (error) {
    console.error('Error generating positions:', error);
    // Return empty positions rather than failing completely
    return participants.map(avatar => ({
      avatarId: avatar.id,
      content: `Unable to generate position for ${avatar.name}.`,
      round: scenario.rounds,
    }));
  }
}
