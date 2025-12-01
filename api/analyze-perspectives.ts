import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Vercel Edge Function to analyze conversation perspectives
 * 
 * This endpoint analyzes the conversation to extract:
 * - Individual perspectives from each avatar
 * - Common ground (overlapping opinions/themes)
 */

interface AnalyzePerspectivesRequest {
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
  positions: Array<{
    avatarId: string;
    content: string;
    round: number;
  }>;
  avatars: Array<{
    id: string;
    name: string;
    mbtiType: string;
  }>;
}

interface PerspectiveAnalysis {
  avatarId: string;
  avatarName: string;
  mbtiType: string;
  keyPoints: string[];
}

interface AnalyzePerspectivesResponse {
  perspectives: PerspectiveAnalysis[];
  commonGround: string[];
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
    const { scenario, messages, positions, avatars }: AnalyzePerspectivesRequest = req.body;

    // Validate required fields
    if (!scenario || !messages || !positions || !avatars) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Get API key from environment variables
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      console.error('DEEPSEEK_API_KEY not found in environment variables');
      return res.status(500).json({ error: 'API configuration error' });
    }

    // Build conversation summary
    const conversationSummary = messages
      .map(msg => {
        const speaker = avatars.find(a => a.id === msg.avatarId);
        const speakerName = speaker?.name || speaker?.mbtiType || 'Unknown';
        return `${speakerName}: "${msg.content}"`;
      })
      .join('\n');

    // Build positions summary
    const positionsSummary = positions
      .map(pos => {
        const avatar = avatars.find(a => a.id === pos.avatarId);
        const avatarName = avatar?.name || avatar?.mbtiType || 'Unknown';
        return `${avatarName}: "${pos.content}"`;
      })
      .join('\n');

    // Call DeepSeek API to analyze perspectives
    const messageCount = messages.length;
    const roundCount = Math.max(...messages.map(m => m.round || 0), 0);
    const hasUserInterjection = messages.some(m => m.avatarId === 'user');
    
    const analysisPrompt = `You are analyzing a conversation about "${scenario.topic}".

FULL CONVERSATION (${messageCount} messages, ${roundCount} rounds):
${conversationSummary}

FINAL POSITIONS:
${positionsSummary}

TASK:
Analyze this conversation and provide a JSON response with:
1. For each participant, extract 2-3 key points that represent their unique perspective
2. Identify common ground (themes or opinions where multiple participants agree or overlap)

IMPORTANT - EVOLVING COMMON GROUND:
- As conversations progress, common ground should NARROW and become MORE SPECIFIC
- Early in conversations, common ground may be broad and general
- Later in conversations (especially after ${hasUserInterjection ? 'user interjections or ' : ''}additional rounds), common ground should reflect:
  * More specific points of agreement that emerged through discussion
  * Concrete areas where participants converged or found alignment
  * Refined understanding based on the full conversation flow
- If this is a longer conversation (${roundCount} rounds), focus on the most specific and refined common ground that has emerged

Return ONLY valid JSON in this exact format:
{
  "perspectives": [
    {
      "avatarName": "Name",
      "mbtiType": "TYPE",
      "keyPoints": ["point 1", "point 2", "point 3"]
    }
  ],
  "commonGround": ["specific theme 1", "specific theme 2", "specific theme 3"]
}

Make sure the keyPoints are specific to each personality's unique perspective, and commonGround represents the most specific and refined areas of agreement that have emerged through the conversation.`;

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
            content: 'You are a conversation analyst. You extract key perspectives and common themes from discussions. Always respond with valid JSON only.',
          },
          {
            role: 'user',
            content: analysisPrompt,
          },
        ],
        temperature: 0.5, // Lower temperature for more consistent analysis
        max_tokens: 1000,
      }),
    });

    if (!deepseekResponse.ok) {
      const errorData = await deepseekResponse.text();
      console.error('DeepSeek API error:', errorData);
      return res.status(500).json({ 
        error: 'Failed to analyze perspectives',
        details: errorData 
      });
    }

    const data = await deepseekResponse.json();
    let content = data.choices[0]?.message?.content || '';

    if (!content) {
      return res.status(500).json({ error: 'Empty response from API' });
    }

    // Clean the content - remove markdown code blocks if present
    content = content.trim();
    if (content.startsWith('```json')) {
      content = content.replace(/^```json\n?/, '').replace(/\n?```$/, '');
    } else if (content.startsWith('```')) {
      content = content.replace(/^```\n?/, '').replace(/\n?```$/, '');
    }

    let analysis;
    try {
      analysis = JSON.parse(content);
    } catch (parseError) {
      console.error('Failed to parse analysis JSON:', content);
      // Fallback: create a simple analysis from positions
      analysis = createFallbackAnalysis(positions, avatars);
    }

    // Map analysis to include avatarIds
    const perspectives: PerspectiveAnalysis[] = analysis.perspectives.map((p: any) => {
      const avatar = avatars.find(a => a.name === p.avatarName || a.mbtiType === p.mbtiType);
      return {
        avatarId: avatar?.id || '',
        avatarName: p.avatarName || avatar?.name || 'Unknown',
        mbtiType: p.mbtiType || avatar?.mbtiType || '',
        keyPoints: p.keyPoints || [],
      };
    });

    const response: AnalyzePerspectivesResponse = {
      perspectives,
      commonGround: analysis.commonGround || [],
    };

    return res.status(200).json(response);

  } catch (error) {
    console.error('Error analyzing perspectives:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Fallback analysis if LLM parsing fails
 */
function createFallbackAnalysis(
  positions: Array<{ avatarId: string; content: string; round: number }>,
  avatars: Array<{ id: string; name: string; mbtiType: string }>
): { perspectives: any[]; commonGround: string[] } {
  const perspectives = positions.map(pos => {
    const avatar = avatars.find(a => a.id === pos.avatarId);
    // Extract first sentence as key point
    const firstSentence = pos.content.split('.')[0] || pos.content.substring(0, 100);
    return {
      avatarName: avatar?.name || 'Unknown',
      mbtiType: avatar?.mbtiType || '',
      keyPoints: [firstSentence],
    };
  });

  return {
    perspectives,
    commonGround: ['The conversation explored multiple perspectives on the topic'],
  };
}

