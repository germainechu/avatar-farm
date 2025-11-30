import type { VercelRequest, VercelResponse } from '@vercel/node';
import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * Vercel Edge Function to generate concluding positions for avatars
 * 
 * This endpoint generates a final position statement from each avatar's perspective
 * after a simulation has completed, summarizing their stance on the topic.
 */

interface GeneratePositionRequest {
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
  };
  messages: Array<{
    id: string;
    avatarId: string;
    content: string;
    tag: string;
    round: number;
  }>;
  avatars: Array<{
    id: string;
    name: string;
    mbtiType: string;
  }>;
  round: number; // The final round number
}

interface GeneratePositionResponse {
  content: string;
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
    const { avatar, scenario, messages, avatars, round }: GeneratePositionRequest = req.body;

    // Validate required fields
    if (!avatar || !scenario || !messages || !avatars || round === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Get API key from environment variables
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      console.error('DEEPSEEK_API_KEY not found in environment variables');
      return res.status(500).json({ error: 'API configuration error' });
    }

    // Build system prompt for position generation
    const systemPrompt = buildPositionPrompt(avatar, scenario, messages, avatars, round);

    // Call DeepSeek API
    const deepseekResponse = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: `After ${round} rounds of discussion on "${scenario.topic}", provide your final position or concluding statement. This should be a clear, concise summary of your perspective on the topic, reflecting your ${avatar.mbtiType} personality and the insights from the conversation.`,
          },
        ],
        temperature: 0.7, // Slightly lower for more focused positions
        max_tokens: 200, // Allow slightly more tokens for positions
      }),
    });

    if (!deepseekResponse.ok) {
      const errorData = await deepseekResponse.text();
      console.error('DeepSeek API error:', errorData);
      return res.status(500).json({ 
        error: 'Failed to generate position',
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

    const response: GeneratePositionResponse = {
      content: content.trim(),
    };

    return res.status(200).json(response);

  } catch (error) {
    console.error('Error generating position:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
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
 * Loads custom personality prompt from markdown file if available
 */
function loadPersonalityPrompt(mbtiType: string): string | null {
  try {
    const promptPath = join(process.cwd(), 'personality-prompts', `${mbtiType}.md`);
    const promptContent = readFileSync(promptPath, 'utf-8');
    return promptContent;
  } catch (error) {
    return null;
  }
}

/**
 * Builds a system prompt for generating concluding positions
 */
function buildPositionPrompt(
  avatar: GeneratePositionRequest['avatar'],
  scenario: GeneratePositionRequest['scenario'],
  messages: GeneratePositionRequest['messages'],
  avatars: GeneratePositionRequest['avatars'],
  round: number
): string {
  const dominant = avatar.functions.find(f => f.role === 'dominant');
  const auxiliary = avatar.functions.find(f => f.role === 'auxiliary');
  const tertiary = avatar.functions.find(f => f.role === 'tertiary');
  const inferior = avatar.functions.find(f => f.role === 'inferior');

  // Try to load custom personality prompt
  const customPrompt = loadPersonalityPrompt(avatar.mbtiType);

  // Build full conversation context
  const conversationContext = messages.length > 0
    ? messages
        .map(msg => {
          const speaker = avatars.find(a => a.id === msg.avatarId);
          const speakerName = speaker?.name || speaker?.mbtiType || 'Unknown';
          return `[Round ${msg.round}] ${speakerName}: "${msg.content}"`;
        })
        .join('\n')
    : '';

  // Get this avatar's messages to highlight their contributions
  const avatarMessages = messages.filter(msg => msg.avatarId === avatar.id);
  const avatarContributions = avatarMessages.length > 0
    ? avatarMessages
        .map(msg => `[Round ${msg.round}] "${msg.content}"`)
        .join('\n')
    : '';

  // If custom prompt exists, use it as the base
  if (customPrompt) {
    return `You are ${avatar.name}, an ${avatar.mbtiType} personality.

PERSONALITY PROFILE:
${customPrompt}

THE DISCUSSION:
- Topic: "${scenario.topic}"
- Style: ${scenario.style}
- Total rounds: ${round}
- Your cognitive function stack: ${dominant?.code || 'N/A'} (dominant) → ${auxiliary?.code || 'N/A'} (auxiliary) → ${tertiary?.code || 'N/A'} (tertiary) → ${inferior?.code || 'N/A'} (inferior)

FULL CONVERSATION:
${conversationContext || 'No conversation history.'}

YOUR CONTRIBUTIONS:
${avatarContributions || 'You have not yet contributed to the conversation.'}

YOUR TASK:
Provide a final position or concluding statement that:
- Summarizes your perspective on "${scenario.topic}" from your ${avatar.mbtiType} personality's viewpoint
- Reflects the insights and points you made during the conversation
- Is clear, concise, and authentic to your personality type
- Synthesizes your thoughts into a coherent position (2-4 sentences)
- Does NOT include quotation marks around the statement`;
  }

  // Fallback to default prompt
  return `You are ${avatar.name}, an ${avatar.mbtiType} personality.

CORE IDENTITY:
- Cognitive Function Stack: ${dominant?.code || 'N/A'} (dominant) → ${auxiliary?.code || 'N/A'} (auxiliary) → ${tertiary?.code || 'N/A'} (tertiary) → ${inferior?.code || 'N/A'} (inferior)
- Communication Style:
  * Abstractness: ${avatar.behavior.abstractness.toFixed(2)} (0=concrete, 1=abstract)
  * Emotional Focus: ${avatar.behavior.emotionalFocus.toFixed(2)} (0=logical, 1=emotional)
  * Structure: ${avatar.behavior.structure.toFixed(2)} (0=flexible, 1=structured)
  * Temporal Focus: ${avatar.behavior.temporalFocus}
  * Risk Taking: ${avatar.behavior.riskTaking.toFixed(2)} (0=cautious, 1=bold)

THE DISCUSSION:
- Topic: "${scenario.topic}"
- Style: ${scenario.style}
- Total rounds: ${round}

FULL CONVERSATION:
${conversationContext || 'No conversation history.'}

YOUR CONTRIBUTIONS:
${avatarContributions || 'You have not yet contributed to the conversation.'}

YOUR TASK:
Provide a final position or concluding statement that:
- Summarizes your perspective on "${scenario.topic}" from your ${avatar.mbtiType} personality's viewpoint
- Reflects the insights and points you made during the conversation
- Is clear, concise, and authentic to your personality type
- Synthesizes your thoughts into a coherent position (2-4 sentences)
- Does NOT include quotation marks around the statement`;
}
