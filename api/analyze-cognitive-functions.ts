import type { VercelRequest, VercelResponse } from '@vercel/node';
import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * Vercel Edge Function to analyze which cognitive functions are being used in a message
 * 
 * This endpoint analyzes a message from an avatar and determines which of their
 * cognitive functions (Ni, Ne, Si, Se, Ti, Te, Fi, Fe) are actively being used.
 */

interface AnalyzeCognitiveFunctionsRequest {
  message: {
    id: string;
    avatarId: string;
    content: string;
    tag: string;
    round: number;
  };
  avatar: {
    id: string;
    mbtiType: string;
    name: string;
    functions: Array<{
      code: string;
      role: string;
    }>;
  };
  scenario: {
    topic: string;
    style: string;
  };
}

interface AnalyzeCognitiveFunctionsResponse {
  activeFunctions: string[]; // Array of cognitive function codes (e.g., ["Ne", "Fi"])
  error?: string;
}

// Cognitive function descriptions for the LLM
const FUNCTION_DESCRIPTIONS: Record<string, string> = {
  Ni: "Introverted Intuition: Synthesizes patterns into singular insights about future implications, sees underlying meanings and connections, focuses on what could be",
  Ne: "Extraverted Intuition: Explores multiple possibilities and novel connections, generates ideas, sees potential and alternatives",
  Si: "Introverted Sensing: Recalls detailed personal experiences and compares to present, values tradition and what has worked before, focuses on past patterns",
  Se: "Extraverted Sensing: Engages directly with immediate sensory reality, acts on present opportunities, focuses on what is happening now",
  Ti: "Introverted Thinking: Builds precise internal logical frameworks, analyzes systems for internal consistency, values accuracy and logical precision",
  Te: "Extraverted Thinking: Organizes external systems for efficient outcomes, focuses on effectiveness and results, structures and optimizes",
  Fi: "Introverted Feeling: Evaluates based on deeply held personal values, considers authenticity and personal meaning, focuses on individual values",
  Fe: "Extraverted Feeling: Harmonizes group emotions and social atmosphere, considers others' feelings and social harmony, focuses on collective values"
};

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, avatar, scenario }: AnalyzeCognitiveFunctionsRequest = req.body;

    // Validate required fields
    if (!message || !avatar || !scenario) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Get API key from environment variables
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      console.error('DEEPSEEK_API_KEY not found in environment variables');
      return res.status(500).json({ error: 'API configuration error' });
    }

    // Get avatar's cognitive function stack
    const avatarFunctions = avatar.functions.map(f => ({
      code: f.code,
      role: f.role,
      description: FUNCTION_DESCRIPTIONS[f.code] || f.code
    }));

    // Build the analysis prompt
    const analysisPrompt = `You are analyzing a message from ${avatar.name} (${avatar.mbtiType}) in a conversation about "${scenario.topic}".

AVATAR'S COGNITIVE FUNCTION STACK:
${avatarFunctions.map(f => `- ${f.code} (${f.role}): ${f.description}`).join('\n')}

MESSAGE TO ANALYZE:
"${message.content}"

MESSAGE TAG: ${message.tag}

TASK:
Analyze which cognitive function(s) from ${avatar.name}'s stack are actively being used in this message. A person typically uses 1-3 functions in any given response, with the dominant and auxiliary being most common, but tertiary and inferior can also appear.

Consider:
- What type of thinking is being demonstrated? (Intuitive vs Sensing, Thinking vs Feeling)
- Is the focus on patterns/future (Ni/Ne) or concrete details/past (Si/Se)?
- Is the evaluation based on logic (Ti/Te) or values/emotions (Fi/Fe)?
- Is the approach introverted (internal focus) or extraverted (external focus)?

Return ONLY a JSON array of the cognitive function codes being used (e.g., ["Ne", "Fi"] or ["Ti"] or ["Te", "Ni"]).
Do not include any explanation, just the JSON array.`;

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
            content: 'You are an expert in MBTI cognitive functions. Analyze messages and return only a JSON array of cognitive function codes.',
          },
          {
            role: 'user',
            content: analysisPrompt,
          },
        ],
        temperature: 0.3, // Lower temperature for more consistent analysis
        max_tokens: 100,
      }),
    });

    if (!deepseekResponse.ok) {
      const errorText = await deepseekResponse.text();
      console.error('DeepSeek API error:', errorText);
      throw new Error(`DeepSeek API error: ${deepseekResponse.status}`);
    }

    const deepseekData = await deepseekResponse.json();
    const responseContent = deepseekData.choices?.[0]?.message?.content?.trim();

    if (!responseContent) {
      throw new Error('No response from DeepSeek API');
    }

    // Parse the JSON array from the response
    let activeFunctions: string[] = [];
    try {
      // Try to extract JSON array from the response (might have markdown code blocks)
      const jsonMatch = responseContent.match(/\[[\s\S]*?\]/);
      if (jsonMatch) {
        activeFunctions = JSON.parse(jsonMatch[0]);
      } else {
        activeFunctions = JSON.parse(responseContent);
      }

      // Validate that all returned functions are in the avatar's stack
      const validFunctions = avatar.functions.map(f => f.code);
      activeFunctions = activeFunctions.filter((func: string) => validFunctions.includes(func));

      // If no valid functions found, default to dominant and auxiliary
      if (activeFunctions.length === 0) {
        const dominant = avatar.functions.find(f => f.role === 'dominant');
        const auxiliary = avatar.functions.find(f => f.role === 'auxiliary');
        activeFunctions = [dominant?.code, auxiliary?.code].filter(Boolean) as string[];
      }
    } catch (parseError) {
      console.error('Error parsing cognitive function analysis:', parseError);
      // Fallback to dominant and auxiliary
      const dominant = avatar.functions.find(f => f.role === 'dominant');
      const auxiliary = avatar.functions.find(f => f.role === 'auxiliary');
      activeFunctions = [dominant?.code, auxiliary?.code].filter(Boolean) as string[];
    }

    const response: AnalyzeCognitiveFunctionsResponse = {
      activeFunctions,
    };

    return res.status(200).json(response);
  } catch (error) {
    console.error('Error analyzing cognitive functions:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Return fallback response with dominant and auxiliary
    try {
      const { avatar } = req.body;
      if (avatar?.functions) {
        const dominant = avatar.functions.find((f: { role: string }) => f.role === 'dominant');
        const auxiliary = avatar.functions.find((f: { role: string }) => f.role === 'auxiliary');
        const fallbackFunctions = [dominant?.code, auxiliary?.code].filter(Boolean) as string[];
        
        return res.status(200).json({
          activeFunctions: fallbackFunctions,
          error: `Analysis failed, using fallback: ${errorMessage}`,
        });
      }
    } catch (fallbackError) {
      // If fallback also fails, return error
    }

    return res.status(500).json({
      error: errorMessage,
      activeFunctions: [],
    });
  }
}

