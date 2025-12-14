import type { VercelRequest, VercelResponse } from '@vercel/node';
import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * Vercel Edge Function to generate LLM-powered messages for avatars
 * 
 * This endpoint receives avatar data and conversation context,
 * builds a system prompt, calls DeepSeek API, and returns the response.
 */

interface GenerateMessageRequest {
  avatar: {
    id: string;
    mbtiType: string;
    name: string;
    functions: Array<{
      code: string;
      role: string;
    }>;
    behavior: {
      abstractness: number;
      emotionalFocus: number;
      structure: number;
      temporalFocus: string;
      riskTaking: number;
    };
    description: string;
  };
  scenario: {
    id: string;
    topic: string;
    style: string;
    avatarIds: string[];
    rounds: number;
    image?: {
      url: string;
      moderationStatus: string;
    };
  };
  history: Array<{
    id: string;
    avatarId: string;
    content: string;
    tag: string;
    round: number;
    image?: {
      url: string;
      moderationStatus: string;
    };
  }>;
  avatars: Array<{
    id: string;
    name: string;
    mbtiType: string;
  }>; // All avatars for speaker identification in conversation context
  round: number;
  physicsState?: {
    activation: number[]; // [Te, Ti, Fe, Fi, Se, Si, Ne, Ni]
    baseline: number[]; // [Te, Ti, Fe, Fi, Se, Si, Ne, Ni]
  };
  relationships?: Array<{
    avatarId: string;
    avatarName: string;
    affinity: number;
    tension: number;
  }>;
  isFirstMessage?: boolean; // Whether this is the first message in the conversation
}

interface GenerateMessageResponse {
  content: string;
  tag: 'support' | 'critique' | 'idea' | 'clarify';
  error?: string;
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { avatar, scenario, history, avatars, round }: GenerateMessageRequest = req.body;

    // Validate required fields
    if (!avatar || !scenario || !history || !avatars || round === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Get API key from environment variables
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      console.error('DEEPSEEK_API_KEY not found in environment variables');
      return res.status(500).json({ error: 'API configuration error' });
    }

    // Build system prompt from avatar data
    const { physicsState, relationships, isFirstMessage } = req.body;
    const systemPrompt = buildSystemPrompt(
      avatar,
      scenario,
      history,
      avatars,
      round,
      physicsState,
      relationships,
      isFirstMessage
    );

    // Check if there's an image in recent messages or scenario that we should analyze
    const recentImage = history
      .slice(-10) // Check last 10 messages
      .find(msg => msg.image && msg.image.moderationStatus === 'approved');
    
    const hasMessageImage = !!recentImage;
    const hasScenarioImage = scenario.image && scenario.image.moderationStatus === 'approved';
    const hasAnyImage = hasMessageImage || hasScenarioImage;
    
    // Build messages array for DeepSeek API
    const messages: Array<{
      role: 'system' | 'user' | 'assistant';
      content: string | Array<{ type: 'text' | 'image_url'; text?: string; image_url?: { url: string } }>;
    }> = [
      {
        role: 'system',
        content: systemPrompt,
      },
    ];

    // Build image description if there are images
    let imageDescription = '';
    if (hasScenarioImage && hasMessageImage) {
      imageDescription = `[Note: There are images available in this scenario - one attached to the scenario itself, and one shared by a user in the conversation. You can reference these images if they support a point you want to make, but focus primarily on the discussion topic.]`;
    } else if (hasScenarioImage) {
      imageDescription = `[Note: There is an image attached to this scenario. You can reference it if it supports a point you want to make, but focus primarily on the discussion topic.]`;
    } else if (hasMessageImage) {
      imageDescription = `[Note: The user has shared an image in the conversation. You can reference it if it supports a point you want to make, but focus primarily on the discussion topic.]`;
    }

    // If there's an image, include it in the prompt
    if (hasAnyImage) {
      messages.push({
        role: 'user',
        content: `The group is discussing: "${scenario.topic}"\n\n${imageDescription}\n\nGenerate your response for round ${round}. Keep it concise (1-3 sentences), stay true to your ${avatar.mbtiType} personality, and respond to the question being discussed.${history.length > 0 ? ` Consider the recent conversation context when forming your response.` : ''}`,
      });
    } else {
      messages.push({
        role: 'user',
        content: `The group is discussing: "${scenario.topic}"\n\nGenerate your response for round ${round}. Keep it concise (1-3 sentences), stay true to your ${avatar.mbtiType} personality, and respond to the question being discussed.${history.length > 0 ? ` Consider the recent conversation context when forming your response.` : ''}`,
      });
    }

    // Call DeepSeek API with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000); // 25 second timeout
    
    let deepseekResponse;
    try {
      deepseekResponse = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'deepseek-chat', // or 'deepseek-coder' for code-focused
          messages: messages,
          temperature: 0.8, // Slightly creative but consistent
          max_tokens: 150, // Keep responses concise
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError' || fetchError.code === 'UND_ERR_CONNECT_TIMEOUT') {
        console.error('DeepSeek API connection timeout - possible causes: network issues, API unreachable, or firewall blocking');
        return res.status(504).json({ 
          error: 'Connection timeout',
          details: 'The request to DeepSeek API timed out. This could be due to network connectivity issues, the API being temporarily unavailable, or firewall restrictions.',
          suggestion: 'Check your internet connection and try again. If the issue persists, the DeepSeek API may be experiencing issues.'
        });
      }
      throw fetchError; // Re-throw other errors to be caught by outer catch
    }

    if (!deepseekResponse.ok) {
      const errorData = await deepseekResponse.text();
      console.error('DeepSeek API error:', errorData);
      return res.status(500).json({ 
        error: 'Failed to generate message',
        details: errorData 
      });
    }

    const data = await deepseekResponse.json();
    let content = data.choices[0]?.message?.content || '';

    if (!content) {
      return res.status(500).json({ error: 'Empty response from API' });
    }

    // Clean the content: strip unnecessary quotes and formatting
    content = cleanResponseContent(content);

    // Determine message tag based on content and avatar behavior
    const tag = determineMessageTag(content, avatar);

    const response: GenerateMessageResponse = {
      content: content.trim(),
      tag,
    };

    return res.status(200).json(response);

  } catch (error) {
    console.error('Error generating message:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Loads custom personality prompt from markdown file if available
 */
function loadPersonalityPrompt(mbtiType: string): string | null {
  try {
    // Try to read from personality-prompts folder
    // In Vercel, the working directory is the project root
    const promptPath = join(process.cwd(), 'personality-prompts', `${mbtiType}.md`);
    const promptContent = readFileSync(promptPath, 'utf-8');
    return promptContent;
  } catch (error) {
    // File doesn't exist or can't be read - that's okay, we'll use default prompt
    return null;
  }
}

/**
 * Returns the master prompt with cognitive function definitions and cognitive state system
 * This should be included once per conversation (first message only)
 */
function getMasterPrompt(): string {
  return `COGNITIVE FUNCTION DEFINITIONS:
These definitions apply to all avatars. Activation levels indicate how strongly each function is currently engaged.

Te (Extraverted Thinking): Systematic, externally-focused logic. Organizes and optimizes external systems through empirical evidence, measurable results, and efficiency. Focuses on "what works" in the real world, system design, and objective effectiveness. When highly activated, you think in terms of structures, processes, and outcomes.

Ti (Introverted Thinking): Internal logical frameworks. Builds precise, internally-consistent systems of thought. Values accuracy, logical precision, and understanding how things work in theory. When highly activated, you analyze systems for internal consistency and logical coherence.

Fe (Extraverted Feeling): Group emotional harmony. Attuned to collective values, social atmosphere, and others' emotional needs. Creates connection and understanding in groups. When highly activated, you prioritize group harmony, social validation, and emotional attunement.

Fi (Introverted Feeling): Personal values and authenticity. Evaluates based on deeply-held individual values, personal meaning, and what feels authentic. When highly activated, you make decisions based on personal ethics, authenticity, and individual values.

Se (Extraverted Sensing): Immediate sensory reality. Engages directly with present-moment experiences, physical details, and immediate opportunities, focusing on what is material and tangible. When highly activated, you focus on what's happening now, concrete details, and taking action.

Si (Introverted Sensing): Past experiences and patterns. Recalls detailed personal experiences, compares present to past, values tradition and what has worked before, focusing on what is material and obvious. When highly activated, you reference past patterns, established methods, and detailed memories.

Ne (Extraverted Intuition): Possibilities and connections. Explores multiple possibilities, novel connections, and potential alternatives. When highly activated, you generate ideas, see patterns, and explore "what if" scenarios.

Ni (Introverted Intuition): Synthesized insights and future implications. Sees underlying meanings, future trajectories, and extrapolate from history, creating singular insights from patterns. When you are highly activated, you are able to see the future and understand the deeper meanings of the past.

COGNITIVE STATE SYSTEM:
Activation levels (0-1) reflect current mental state:
- High (0.7+): Function is actively engaged - use it prominently
- Moderate (0.4-0.7): Function is available - use it naturally  
- Low (0.0-0.4): Function is less accessible - avoid relying on it
Activation changes based on topic, social dynamics, and conversation flow.

IMAGE CONTEXT:
Images may be provided in the conversation or attached to the scenario as additional context. When images are present:
- You are aware of the image content and can reference it when you have a relevant point about it
- The primary focus of your response should be the discussion topic itself
- Only mention or analyze the image if it directly relates to a point you want to make
- Avoid starting every response with "Looking at the image" - reference images naturally when they support your perspective
- Use your cognitive functions to interpret images from your personality's unique perspective when relevant

---
`;

}

/**
 * Function order: [Te, Ti, Fe, Fi, Se, Si, Ne, Ni]
 */
const FUNCTION_ORDER = ['Te', 'Ti', 'Fe', 'Fi', 'Se', 'Si', 'Ne', 'Ni'] as const;

/**
 * Function descriptions for natural language formatting
 */
const FUNCTION_DESCRIPTIONS: Record<string, string> = {
  Te: 'systematic logic and optimization',
  Ti: 'internal logical frameworks',
  Fe: 'group emotional harmony',
  Fi: 'personal values and authenticity',
  Se: 'immediate sensory reality',
  Si: 'past experiences and patterns',
  Ne: 'possibilities and connections',
  Ni: 'synthesized insights and future vision',
};

/**
 * Determines if a function has significant deviation from baseline
 * Uses relative threshold for low baselines (<0.2), absolute threshold (0.15) for others
 */
function hasSignificantDeviation(activation: number, baseline: number): boolean {
  if (baseline < 0.2) {
    // Relative threshold: 2x baseline
    return Math.abs(activation - baseline) >= baseline * 2;
  }
  // Absolute threshold: 0.15
  return Math.abs(activation - baseline) >= 0.15;
}

/**
 * Formats activation guidance from physics state
 * Returns empty string if no significant deviations
 */
function formatActivationGuidance(
  activation: number[],
  baseline: number[],
  functions: Array<{ code: string; role: string }>
): string {
  // Find functions with significant deviations
  const significantFunctions: Array<{
    code: string;
    activation: number;
    baseline: number;
    deviation: number;
    role: string;
  }> = [];

  for (let i = 0; i < FUNCTION_ORDER.length; i++) {
    const funcCode = FUNCTION_ORDER[i];
    const act = activation[i];
    const base = baseline[i];
    
    if (hasSignificantDeviation(act, base)) {
      const func = functions.find(f => f.code === funcCode);
      significantFunctions.push({
        code: funcCode,
        activation: act,
        baseline: base,
        deviation: act - base,
        role: func?.role || 'unknown',
      });
    }
  }

  // If no significant deviations, return empty
  if (significantFunctions.length === 0) {
    return '';
  }

  // Sort by absolute deviation (most significant first)
  significantFunctions.sort((a, b) => Math.abs(b.deviation) - Math.abs(a.deviation));

  // Categorize by activation level
  const high: typeof significantFunctions = [];
  const moderate: typeof significantFunctions = [];
  const low: typeof significantFunctions = [];

  for (const func of significantFunctions) {
    if (func.activation >= 0.7) {
      high.push(func);
    } else if (func.activation >= 0.4) {
      moderate.push(func);
    } else {
      low.push(func);
    }
  }

  // Build guidance text
  const parts: string[] = [];

  if (high.length > 0) {
    const funcList = high
      .slice(0, 3) // Top 3
      .map(f => `${f.code} (${f.activation.toFixed(2)})`)
      .join(', ');
    const descriptions = high
      .slice(0, 3)
      .map(f => FUNCTION_DESCRIPTIONS[f.code])
      .join(', ');
    parts.push(`- HIGHLY ACTIVATED: ${funcList} - You're actively using ${descriptions}`);
  }

  if (moderate.length > 0) {
    const funcList = moderate
      .slice(0, 2) // Top 2
      .map(f => `${f.code} (${f.activation.toFixed(2)})`)
      .join(', ');
    const descriptions = moderate
      .slice(0, 2)
      .map(f => FUNCTION_DESCRIPTIONS[f.code])
      .join(', ');
    parts.push(`- MODERATELY ACTIVATED: ${funcList} - ${descriptions} are accessible`);
  }

  if (low.length > 0) {
    const funcList = low
      .slice(0, 2) // Top 2
      .map(f => `${f.code} (${f.activation.toFixed(2)})`)
      .join(', ');
    const descriptions = low
      .slice(0, 2)
      .map(f => FUNCTION_DESCRIPTIONS[f.code])
      .join(', ');
    parts.push(`- LOW ACTIVATION: ${funcList} - ${descriptions} are less accessible`);
  }

  return parts.join('\n');
}

/**
 * Formats relationship guidance from physics state
 * Only includes significant relationships (affinity >0.7 or <0.3, tension >0.4)
 */
function formatRelationshipGuidance(
  relationships: Array<{
    avatarId: string;
    avatarName: string;
    affinity: number;
    tension: number;
  }>
): string {
  if (!relationships || relationships.length === 0) {
    return '';
  }

  const significant: Array<{
    name: string;
    affinity: number;
    tension: number;
    type: 'high_affinity' | 'low_affinity' | 'high_tension';
  }> = [];

  for (const rel of relationships) {
    if (rel.affinity > 0.7) {
      significant.push({
        name: rel.avatarName,
        affinity: rel.affinity,
        tension: rel.tension,
        type: 'high_affinity',
      });
    } else if (rel.affinity < 0.3) {
      significant.push({
        name: rel.avatarName,
        affinity: rel.affinity,
        tension: rel.tension,
        type: 'low_affinity',
      });
    } else if (rel.tension > 0.4) {
      significant.push({
        name: rel.avatarName,
        affinity: rel.affinity,
        tension: rel.tension,
        type: 'high_tension',
      });
    }
  }

  if (significant.length === 0) {
    return '';
  }

  const parts: string[] = [];

  const highAffinity = significant.filter(s => s.type === 'high_affinity');
  if (highAffinity.length > 0) {
    const names = highAffinity.map(s => s.name).join(', ');
    parts.push(`- Strong alignment with ${names}'s perspective`);
  }

  const lowAffinity = significant.filter(s => s.type === 'low_affinity');
  if (lowAffinity.length > 0) {
    const names = lowAffinity.map(s => s.name).join(', ');
    parts.push(`- Finding ${names}'s approach challenging`);
  }

  const highTension = significant.filter(s => s.type === 'high_tension');
  if (highTension.length > 0) {
    const names = highTension.map(s => s.name).join(', ');
    parts.push(`- Tension with ${names} (${highTension[0].tension.toFixed(2)})`);
  }

  return parts.join('\n');
}

/**
 * Builds a system prompt that encodes the avatar's MBTI personality
 * Uses custom personality prompts if available, otherwise falls back to default
 * Includes physics state guidance when available
 */
function buildSystemPrompt(
  avatar: GenerateMessageRequest['avatar'],
  scenario: GenerateMessageRequest['scenario'],
  history: GenerateMessageRequest['history'],
  avatars: GenerateMessageRequest['avatars'],
  round: number,
  physicsState?: GenerateMessageRequest['physicsState'],
  relationships?: GenerateMessageRequest['relationships'],
  isFirstMessage?: boolean
): string {
  const dominant = avatar.functions.find(f => f.role === 'dominant');
  const auxiliary = avatar.functions.find(f => f.role === 'auxiliary');
  const tertiary = avatar.functions.find(f => f.role === 'tertiary');
  const inferior = avatar.functions.find(f => f.role === 'inferior');

  // Build master prompt (function definitions) - only on first message
  const masterPrompt = isFirstMessage ? getMasterPrompt() : '';

  // Build physics state guidance if available
  let physicsGuidance = '';
  if (physicsState && physicsState.activation && physicsState.baseline) {
    const activationGuidance = formatActivationGuidance(
      physicsState.activation,
      physicsState.baseline,
      avatar.functions
    );
    
    const relationshipGuidance = relationships
      ? formatRelationshipGuidance(relationships)
      : '';

    if (activationGuidance || relationshipGuidance) {
      physicsGuidance = `\nCOGNITIVE STATE:\n`;
      if (activationGuidance) {
        physicsGuidance += activationGuidance + '\n';
      }
      if (relationshipGuidance) {
        physicsGuidance += `\nRELATIONSHIP CONTEXT:\n${relationshipGuidance}\n`;
      }
    }
  }

  // Try to load custom personality prompt
  const customPrompt = loadPersonalityPrompt(avatar.mbtiType);

  // Build conversation context with speaker names
  // Use dynamic window size: more messages for later rounds to maintain context
  // Start with 5 messages, increase to 8 for rounds 5+, and 10 for rounds 10+
  const windowSize = round <= 4 ? 5 : round <= 9 ? 8 : 10;
  const recentMessages = history.slice(-windowSize);
  
  // If we have more history than the window, add a brief summary of earlier conversation
  const earlierMessages = history.slice(0, -windowSize);
  const earlierSummary = earlierMessages.length > 0 
    ? `\n[Earlier conversation summary: ${earlierMessages.length} previous messages discussing "${scenario.topic}"]`
    : '';
  
  // Check if there's a user interjection in recent messages
  const userInterjection = recentMessages.find(msg => msg.avatarId === 'user');
  const hasUserInterjection = !!userInterjection;

  // Check if there's an image attached to the scenario
  const hasScenarioImage = scenario.image && scenario.image.moderationStatus === 'approved';

  const conversationContext = recentMessages.length > 0
    ? recentMessages
        .map(msg => {
          if (msg.avatarId === 'user') {
            const imageNote = msg.image ? ' [USER SHARED AN IMAGE]' : '';
            return `[Round ${msg.round}] USER INTERJECTION: "${msg.content}"${imageNote}`;
          }
          const speaker = avatars.find(a => a.id === msg.avatarId);
          const speakerName = speaker?.name || speaker?.mbtiType || 'Unknown';
          const imageNote = msg.image ? ' [IMAGE ATTACHED]' : '';
          return `[Round ${msg.round}] ${speakerName}: "${msg.content}"${imageNote}`;
        })
        .join('\n') + earlierSummary
    : '';

  // Build interaction style guidance
  let interactionGuidance = '';
  if (scenario.style === 'debate') {
    interactionGuidance = `DEBATE MODE - Your approach:
- Actively engage with others' claims by either refuting or supporting them based on your cognitive functions and values
- ${dominant?.code === 'Ti' || dominant?.code === 'Te' ? 'Use your logical framework (' + dominant.code + ') to challenge inconsistencies or support sound reasoning' : ''}
- ${dominant?.code === 'Fi' || dominant?.code === 'Fe' ? 'Evaluate claims through your value system (' + dominant.code + ') - support what aligns with your values, challenge what conflicts' : ''}
- ${dominant?.code === 'Ni' || dominant?.code === 'Ne' ? 'Use your intuitive insights (' + dominant.code + ') to question assumptions or highlight overlooked possibilities' : ''}
- ${dominant?.code === 'Si' || dominant?.code === 'Se' ? 'Ground your responses in concrete evidence (' + dominant.code + ') - challenge abstract claims or support practical points' : ''}
- Do NOT force collaboration or consensus - it's a debate, so take clear positions
- Reference specific claims from others and respond directly to them
- Build on or challenge previous points rather than simply agreeing`;
  } else if (scenario.style === 'brainstorm') {
    interactionGuidance = `BRAINSTORM MODE - Your approach:
- Generate and build upon creative ideas
- Explore possibilities and alternatives
- Build on others' ideas or introduce new angles`;
  } else if (scenario.style === 'cooperative') {
    interactionGuidance = `COOPERATIVE MODE - Your approach:
- Work together toward consensus
- Find common ground and build on shared understanding
- Support collaborative problem-solving`;
  }

  // If custom prompt exists, use it as the base and enhance with context
  if (customPrompt) {
    return `${masterPrompt}You are ${avatar.name}, an ${avatar.mbtiType} personality.

PERSONALITY PROFILE:
${customPrompt}

CURRENT SITUATION:
- You are participating in a ${scenario.style} discussion
- The topic being discussed is: "${scenario.topic}"
${hasScenarioImage ? '- Note: An image is attached to this scenario as additional context. You can reference it if it supports a point you want to make, but focus primarily on the discussion topic.' : ''}
- This is round ${round} of ${scenario.rounds}
- Your cognitive function stack: ${dominant?.code || 'N/A'} (dominant) → ${auxiliary?.code || 'N/A'} (auxiliary) → ${tertiary?.code || 'N/A'} (tertiary) → ${inferior?.code || 'N/A'} (inferior)

${physicsGuidance}${conversationContext ? `RECENT CONVERSATION (last ${windowSize} messages):\n${conversationContext}\n` : 'This is the first message in the conversation.\n'}

${hasUserInterjection ? `IMPORTANT: There is a USER INTERJECTION in the recent conversation. The user has shared their perspective, asked a question, or guided the discussion. You should:
- Acknowledge and respond to the user's interjection directly
- Engage with their perspective from your ${avatar.mbtiType} personality's viewpoint
- Use your cognitive functions to evaluate, support, or challenge their input as appropriate
- Continue the conversation naturally after addressing their interjection
` : ''}

${interactionGuidance}

YOUR TASK:
- Stay true to your ${avatar.mbtiType} personality as described above
- Respond naturally to the topic "${scenario.topic}" from your personality's perspective
- Engage authentically with the conversation context
- If images are provided, reference them only when you have a relevant point about them - don't feel obligated to mention images in every response
- Keep your response concise (1-3 sentences)
- Let your communication style reflect your personality traits as described in the profile above
- Reference specific points from the conversation when relevant
- Avoid repeating points you or others have already made - build on the conversation or introduce new perspectives
- While staying true to your core values and cognitive functions, vary your expression and approach to avoid sounding repetitive`;
  }

  // Fallback to default prompt if no custom prompt exists
  const prompt = `${masterPrompt}You are ${avatar.name}, an ${avatar.mbtiType} personality.

CORE IDENTITY:
- Cognitive Function Stack: ${dominant?.code || 'N/A'} (dominant) → ${auxiliary?.code || 'N/A'} (auxiliary) → ${tertiary?.code || 'N/A'} (tertiary) → ${inferior?.code || 'N/A'} (inferior)
- Communication Style:
  * Abstractness: ${avatar.behavior.abstractness.toFixed(2)} (0=concrete, 1=abstract)
  * Emotional Focus: ${avatar.behavior.emotionalFocus.toFixed(2)} (0=logical, 1=emotional)
  * Structure: ${avatar.behavior.structure.toFixed(2)} (0=flexible, 1=structured)
  * Temporal Focus: ${avatar.behavior.temporalFocus}
  * Risk Taking: ${avatar.behavior.riskTaking.toFixed(2)} (0=cautious, 1=bold)

THE QUESTION BEING DISCUSSED:
"${scenario.topic}"
${hasScenarioImage ? '\n\nNote: An image is attached to this scenario as additional context. You can reference it if it supports a point you want to make, but focus primarily on the discussion topic.' : ''}

This is the central question or topic that the group is discussing. Keep this question in mind as you respond. Your response should be relevant to this question and reflect your personality's perspective on it.

CURRENT CONTEXT:
- Interaction Style: ${scenario.style}
- Round: ${round} of ${scenario.rounds}

${physicsGuidance}${conversationContext ? `RECENT CONVERSATION (sliding window of last ${windowSize} messages):\n${conversationContext}\n` : 'This is the first message in the conversation.\n'}

${hasUserInterjection ? `IMPORTANT: There is a USER INTERJECTION in the recent conversation. The user has shared their perspective, asked a question, or guided the discussion. You should:
- Acknowledge and respond to the user's interjection directly
- Engage with their perspective from your ${avatar.mbtiType} personality's viewpoint
- Use your cognitive functions to evaluate, support, or challenge their input as appropriate
- Continue the conversation naturally after addressing their interjection
` : ''}

${interactionGuidance}

YOUR ROLE:
- Stay in character as ${avatar.name} (${avatar.mbtiType})
- Respond to the question "${scenario.topic}" from your personality's perspective
- Engage with the recent conversation context when relevant
- If images are provided, reference them only when you have a relevant point about them - don't feel obligated to mention images in every response
- Keep responses concise (1-3 sentences)
- Match your communication style parameters
- Reference specific points from the conversation when relevant
- Avoid repeating points you or others have already made - build on the conversation or introduce new perspectives
- While staying true to your core values and cognitive functions, vary your expression and approach to avoid sounding repetitive`;

  return prompt;
}

/**
 * Cleans response content by removing unnecessary quotes and formatting
 * Strips surrounding quotes (single, double, or smart quotes) if they wrap the entire response
 */
function cleanResponseContent(content: string): string {
  if (!content) return content;

  let cleaned = content.trim();

  // Check for surrounding quotes (double quotes, single quotes, or smart quotes)
  // Pattern: starts and ends with matching quote marks
  const quotePatterns = [
    /^[""](.*)[""]$/s,  // Double quotes (regular and smart)
    /^[''](.*)['']$/s,  // Single quotes (regular and smart)
    /^"(.*)"$/s,        // Regular double quotes
    /^'(.*)'$/s,        // Regular single quotes
  ];

  for (const pattern of quotePatterns) {
    const match = cleaned.match(pattern);
    if (match && match[1]) {
      // Only strip if the content inside is substantial (not just empty or whitespace)
      const innerContent = match[1].trim();
      if (innerContent.length > 0) {
        cleaned = innerContent;
        break; // Only strip one layer of quotes
      }
    }
  }

  return cleaned.trim();
}

/**
 * Determines message tag based on content and avatar behavior
 * This is a simple heuristic - could be improved with LLM classification
 */
function determineMessageTag(
  content: string,
  avatar: GenerateMessageRequest['avatar']
): 'support' | 'critique' | 'idea' | 'clarify' {
  const lowerContent = content.toLowerCase();
  
  // Simple keyword-based classification
  const supportKeywords = ['agree', 'yes', 'support', 'good', 'right', 'exactly', 'absolutely'];
  const critiqueKeywords = ['but', 'however', 'disagree', 'wrong', 'problem', 'issue', 'concern'];
  const ideaKeywords = ['what if', 'maybe', 'could', 'perhaps', 'imagine', 'consider', 'suggest'];
  const clarifyKeywords = ['clarify', 'mean', 'understand', 'specifically', 'detail', 'explain'];

  const supportScore = supportKeywords.filter(kw => lowerContent.includes(kw)).length;
  const critiqueScore = critiqueKeywords.filter(kw => lowerContent.includes(kw)).length;
  const ideaScore = ideaKeywords.filter(kw => lowerContent.includes(kw)).length;
  const clarifyScore = clarifyKeywords.filter(kw => lowerContent.includes(kw)).length;

  // Adjust based on avatar's dominant function
  const dominant = avatar.functions.find(f => f.role === 'dominant')?.code;
  
  if (dominant === 'Ti' || dominant === 'Te') {
    // Thinking types more likely to critique
    if (critiqueScore > 0) return 'critique';
  }
  if (dominant === 'Ne' || dominant === 'Ni') {
    // Intuitive types more likely to generate ideas
    if (ideaScore > 0) return 'idea';
  }
  if (dominant === 'Si' || dominant === 'Se') {
    // Sensing types more likely to clarify
    if (clarifyScore > 0) return 'clarify';
  }
  if (dominant === 'Fi' || dominant === 'Fe') {
    // Feeling types more likely to support
    if (supportScore > 0) return 'support';
  }

  // Default based on highest score
  const scores = { support: supportScore, critique: critiqueScore, idea: ideaScore, clarify: clarifyScore };
  const maxScore = Math.max(...Object.values(scores));
  
  if (maxScore === 0) {
    // Default based on avatar behavior
    if (avatar.behavior.emotionalFocus > 0.6) return 'support';
    if (avatar.behavior.structure > 0.6) return 'clarify';
    if (avatar.behavior.abstractness > 0.6) return 'idea';
    return 'support';
  }

  return Object.entries(scores).find(([_, score]) => score === maxScore)?.[0] as 'support' | 'critique' | 'idea' | 'clarify' || 'support';
}
