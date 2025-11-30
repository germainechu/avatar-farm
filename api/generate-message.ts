import type { VercelRequest, VercelResponse } from '@vercel/node';

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
  };
  history: Array<{
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
  }>; // All avatars for speaker identification in conversation context
  round: number;
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
    const systemPrompt = buildSystemPrompt(avatar, scenario, history, avatars, round);

    // Call DeepSeek API
    const deepseekResponse = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat', // or 'deepseek-coder' for code-focused
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: `The group is discussing: "${scenario.topic}"\n\nGenerate your response for round ${round}. Keep it concise (1-3 sentences), stay true to your ${avatar.mbtiType} personality, and respond to the question being discussed.${history.length > 0 ? ` Consider the recent conversation context when forming your response.` : ''}`,
          },
        ],
        temperature: 0.8, // Slightly creative but consistent
        max_tokens: 150, // Keep responses concise
      }),
    });

    if (!deepseekResponse.ok) {
      const errorData = await deepseekResponse.text();
      console.error('DeepSeek API error:', errorData);
      return res.status(500).json({ 
        error: 'Failed to generate message',
        details: errorData 
      });
    }

    const data = await deepseekResponse.json();
    const content = data.choices[0]?.message?.content || '';

    if (!content) {
      return res.status(500).json({ error: 'Empty response from API' });
    }

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
 * Builds a system prompt that encodes the avatar's MBTI personality
 */
function buildSystemPrompt(
  avatar: GenerateMessageRequest['avatar'],
  scenario: GenerateMessageRequest['scenario'],
  history: GenerateMessageRequest['history'],
  avatars: GenerateMessageRequest['avatars'],
  round: number
): string {
  const dominant = avatar.functions.find(f => f.role === 'dominant');
  const auxiliary = avatar.functions.find(f => f.role === 'auxiliary');
  const tertiary = avatar.functions.find(f => f.role === 'tertiary');
  const inferior = avatar.functions.find(f => f.role === 'inferior');

  // Build conversation context with speaker names
  const recentMessages = history.slice(-5);
  const conversationContext = recentMessages.length > 0
    ? recentMessages
        .map(msg => {
          const speaker = avatars.find(a => a.id === msg.avatarId);
          const speakerName = speaker?.name || speaker?.mbtiType || 'Unknown';
          return `[Round ${msg.round}] ${speakerName}: "${msg.content}"`;
        })
        .join('\n')
    : '';

  const prompt = `You are ${avatar.name}, an ${avatar.mbtiType} personality.

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

This is the central question or topic that the group is discussing. Keep this question in mind as you respond. Your response should be relevant to this question and reflect your personality's perspective on it.

CURRENT CONTEXT:
- Interaction Style: ${scenario.style}
- Round: ${round} of ${scenario.rounds}

${conversationContext ? `RECENT CONVERSATION (sliding window of last 5 messages):\n${conversationContext}\n` : 'This is the first message in the conversation.\n'}

YOUR ROLE:
- Stay in character as ${avatar.name} (${avatar.mbtiType})
- Respond to the question "${scenario.topic}" from your personality's perspective
- Engage with the recent conversation context when relevant
- Keep responses concise (1-3 sentences)
- Match your communication style parameters
- Reference specific points from the conversation when relevant`;

  return prompt;
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
