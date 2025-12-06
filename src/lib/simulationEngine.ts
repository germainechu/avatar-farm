import type { Avatar, Scenario, Message, AvatarPosition, CognitiveFunction, PhysicsState } from '../types';
import { initializePhysicsState, updatePhysicsStateAfterMessage, logPhysicsState } from './cognitivePhysics';

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
  physicsState?: PhysicsState; // Physics state for the simulation
}

/**
 * Analyzes which cognitive functions are active in a message
 */
async function analyzeCognitiveFunctions(
  message: Message,
  avatar: Avatar,
  scenario: Scenario
): Promise<CognitiveFunction[]> {
  try {
    const apiUrl = '/api/analyze-cognitive-functions';
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: {
          id: message.id,
          avatarId: message.avatarId,
          content: message.content,
          tag: message.tag,
          round: message.round,
        },
        avatar: {
          id: avatar.id,
          mbtiType: avatar.mbtiType,
          name: avatar.name,
          functions: avatar.functions,
        },
        scenario: {
          topic: scenario.topic,
          style: scenario.style,
        },
      }),
    });

    if (!response.ok) {
      console.warn('Cognitive function analysis failed, using fallback');
      // Fallback to dominant and auxiliary
      const dominant = avatar.functions.find(f => f.role === 'dominant');
      const auxiliary = avatar.functions.find(f => f.role === 'auxiliary');
      return [dominant?.code, auxiliary?.code].filter(Boolean) as CognitiveFunction[];
    }

    const data = await response.json();
    return (data.activeFunctions || []) as CognitiveFunction[];
  } catch (error) {
    console.warn('Error analyzing cognitive functions:', error);
    // Fallback to dominant and auxiliary
    const dominant = avatar.functions.find(f => f.role === 'dominant');
    const auxiliary = avatar.functions.find(f => f.role === 'auxiliary');
    return [dominant?.code, auxiliary?.code].filter(Boolean) as CognitiveFunction[];
  }
}

/**
 * Generates a message using LLM (DeepSeek API)
 */
async function generateLLMMessage(
  context: MessageContext
): Promise<Message> {
  const { avatar, scenario, history, round, avatars = [], physicsState } = context;

      // Extract physics state for this avatar if available
      let avatarPhysicsState = null;
      let relationships = null;
      if (physicsState) {
        const avatarState = physicsState.avatarStates.get(avatar.id);
        if (avatarState) {
          avatarPhysicsState = {
            activation: avatarState.activation,
            baseline: avatarState.baseline,
          };

          // Get relationships for this avatar
          const avatarRelationships = physicsState.relationships.get(avatar.id);
          if (avatarRelationships && avatars) {
            relationships = Array.from(avatarRelationships.entries())
              .map(([otherId, rel]) => {
                const otherAvatar = avatars.find(a => a.id === otherId);
                return otherAvatar ? {
                  avatarId: otherId,
                  avatarName: otherAvatar.name,
                  affinity: rel.affinity,
                  tension: rel.tension,
                } : null;
              })
              .filter((r): r is NonNullable<typeof r> => r !== null);
          }
        }
      }

      // Determine if this is the first message in the conversation
      // First message = no history AND first avatar in first round
      const isFirstMessage = history.length === 0;

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
      physicsState: avatarPhysicsState,
      relationships,
      isFirstMessage,
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

  const message: Message = {
    id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    scenarioId: scenario.id,
    avatarId: avatar.id,
    round,
    content: data.content || '',
    tag: data.tag || 'support',
    createdAt: new Date().toISOString()
  };

  // Analyze cognitive functions used in this message
  const activeFunctions = await analyzeCognitiveFunctions(message, avatar, scenario);
  message.activeFunctions = activeFunctions;

  // Update physics state after message generation if available
  if (physicsState && avatars) {
    updatePhysicsStateAfterMessage(
      physicsState,
      message,
      scenario.topic,
      [...history, message],
      avatars
    );
  }

  return message;
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

  // Initialize physics state for the simulation
  const physicsState = initializePhysicsState(participants);

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
        avatars, // Pass avatars for speaker identification in context
        physicsState, // Pass physics state for prompt integration
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
    
    // Log round completion immediately and synchronously
    // Verify round numbers match to catch any issues
    const messagesInRound = messages.filter(m => m.round === round).length;
    const expectedMessagesInRound = participants.length;
    const roundVerification = messagesInRound === expectedMessagesInRound ? '✓' : '⚠️';
    
    console.log(
      `${roundVerification} Round ${round} complete - ${messagesInRound}/${expectedMessagesInRound} messages generated | ` +
      `Total messages: ${messages.length} | Physics Step: ${physicsState.timeStep} | ` +
      `Timestamp: ${new Date().toISOString()}`
    );
    
    // Log full state summary after each round
    if (messages.length > 0) {
      logPhysicsState(physicsState, participants, `Round ${round} complete`);
    }
  }

  // Log final state summary
  if (messages.length > 0) {
    console.group('🏁 Simulation Complete - Final Physics State');
    logPhysicsState(physicsState, participants, 'Final state');
    console.groupEnd();
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

  // Initialize or restore physics state
  // For continuation, we should ideally restore state from storage, but for now we'll reinitialize
  // TODO: In Phase 4, we'll persist and restore physics state
  const physicsState = initializePhysicsState(participants);
  
  // Update physics state for existing messages to restore state (disable logging during restoration)
  for (const msg of existingMessages) {
    const avatar = participants.find(a => a.id === msg.avatarId);
    if (avatar) {
      updatePhysicsStateAfterMessage(
        physicsState,
        msg,
        scenario.topic,
        existingMessages.slice(0, existingMessages.indexOf(msg) + 1),
        participants,
        false // Disable logging during state restoration
      );
    }
  }
  
  // Log restored state
  if (existingMessages.length > 0) {
    console.group('🔄 Physics State Restored from Existing Messages');
    logPhysicsState(physicsState, participants, 'State restored');
    console.groupEnd();
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
        avatars,
        physicsState, // Pass physics state for prompt integration
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
    
    // Log round completion immediately and synchronously
    // Verify round numbers match to catch any issues
    const messagesInRound = newMessages.filter(m => m.round === round).length;
    const expectedMessagesInRound = participants.length;
    const totalMessages = allMessages.length;
    const roundVerification = messagesInRound === expectedMessagesInRound ? '✓' : '⚠️';
    
    console.log(
      `${roundVerification} Round ${round} complete - ${messagesInRound}/${expectedMessagesInRound} messages generated | ` +
      `Total messages: ${totalMessages} | Physics Step: ${physicsState.timeStep} | ` +
      `Timestamp: ${new Date().toISOString()}`
    );
    
    // Log full state summary after each round
    if (newMessages.length > 0) {
      logPhysicsState(physicsState, participants, `Round ${round} complete`);
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

  // Initialize or restore physics state
  const physicsState = initializePhysicsState(participants);
  
  // Update physics state for existing messages (excluding user interjections, disable logging during restoration)
  for (const msg of existingMessages) {
    if (msg.avatarId !== 'user') {
      const avatar = participants.find(a => a.id === msg.avatarId);
      if (avatar) {
        updatePhysicsStateAfterMessage(
          physicsState,
          msg,
          scenario.topic,
          existingMessages.slice(0, existingMessages.indexOf(msg) + 1),
          participants,
          false // Disable logging during state restoration
        );
      }
    }
  }
  
  // Log restored state
  const existingAvatarMessages = existingMessages.filter(m => m.avatarId !== 'user');
  if (existingAvatarMessages.length > 0) {
    console.group('🔄 Physics State Restored from Existing Messages');
    logPhysicsState(physicsState, participants, 'State restored');
    console.groupEnd();
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
        avatars,
        physicsState, // Pass physics state for prompt integration
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
    
    // Log round completion immediately and synchronously
    // Verify round numbers match to catch any issues
    const messagesInRound = newMessages.filter(m => m.round === round).length;
    const expectedMessagesInRound = participants.length;
    const totalMessages = allMessages.length;
    const roundVerification = messagesInRound === expectedMessagesInRound ? '✓' : '⚠️';
    
    console.log(
      `${roundVerification} Round ${round} complete - ${messagesInRound}/${expectedMessagesInRound} messages generated | ` +
      `Total messages: ${totalMessages} | Physics Step: ${physicsState.timeStep} | ` +
      `Timestamp: ${new Date().toISOString()}`
    );
    
    // Log full state summary after each round
    if (newMessages.length > 0) {
      logPhysicsState(physicsState, participants, `Round ${round} complete`);
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
