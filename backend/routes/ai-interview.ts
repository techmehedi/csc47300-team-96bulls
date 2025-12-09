import express, { Request, Response } from 'express';

const router = express.Router();

// Store active sessions (in production, use Redis or database)
const activeSessions = new Map<string, any>();

// System prompt for the AI interviewer
const SYSTEM_PROMPT = `You are an expert technical interviewer conducting a live coding interview. Your role is to:

1. Present coding problems clearly and professionally
2. Guide candidates through their thought process
3. Provide hints when requested (without giving away the solution)
4. Evaluate their approach and provide constructive feedback
5. Ask clarifying questions to understand their reasoning
6. Discuss time and space complexity
7. Be encouraging and supportive while maintaining professional standards

Keep your responses concise but informative. Focus on helping the candidate demonstrate their problem-solving skills.`;

interface ConversationMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

// POST /api/ai-interview - Handle AI interview interactions
router.post('/', async (req: Request, res: Response) => {
  try {
    const { sessionId, action, topic, difficulty, conversationHistory, message } = req.body;

    if (!sessionId) {
      return res.status(400).json({ success: false, error: 'Session ID required' });
    }

    // Initialize or get session
    let session = activeSessions.get(sessionId);
    if (!session) {
      session = {
        id: sessionId,
        topic,
        difficulty,
        startTime: new Date(),
        conversationHistory: []
      };
      activeSessions.set(sessionId, session);
    }

    // Build conversation history
    let messages: ConversationMessage[] = [];

    if (action === 'start') {
      // Initial question request
      messages = [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: `Please provide a ${difficulty} difficulty coding problem about ${topic}. Include:
1. Clear problem statement
2. Example test cases
3. Any constraints or edge cases to consider

Format it in a friendly, conversational way as if speaking to the candidate.`
        }
      ];
    } else if (action === 'hint') {
      // Request hint
      messages = [
        { role: 'system', content: SYSTEM_PROMPT },
        ...session.conversationHistory,
        {
          role: 'user',
          content: 'The candidate is requesting a hint. Provide a helpful hint that guides them toward the solution without revealing it completely. Focus on the next logical step or a key insight they might be missing.'
        }
      ];
    } else if (action === 'evaluate') {
      // Request evaluation
      messages = [
        { role: 'system', content: SYSTEM_PROMPT },
        ...session.conversationHistory,
        {
          role: 'user',
          content: 'The candidate is requesting an evaluation of their current approach. Provide constructive feedback on: 1) Correctness of approach, 2) Time and space complexity, 3) Potential improvements, 4) Edge cases they should consider. Be specific and encouraging.'
        }
      ];
    } else if (action === 'message') {
      // Regular message
      messages = [
        { role: 'system', content: SYSTEM_PROMPT },
        ...session.conversationHistory,
        { role: 'user', content: message }
      ];
    } else {
      return res.status(400).json({ success: false, error: 'Invalid action' });
    }

    // Call OpenAI API
    const aiResponse = await callOpenAI(messages);

    // Update conversation history
    if (action === 'message') {
      session.conversationHistory.push({ role: 'user', content: message });
    }
    session.conversationHistory.push({ role: 'assistant', content: aiResponse });

    // Keep conversation history manageable (last 20 messages)
    if (session.conversationHistory.length > 20) {
      session.conversationHistory = session.conversationHistory.slice(-20);
    }

    return res.json({
      success: true,
      message: aiResponse,
      conversationHistory: session.conversationHistory
    });

  } catch (error: any) {
    console.error('AI Interview Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to process AI request',
      details: error.message
    });
  }
});

// Function to call OpenAI API
async function callOpenAI(messages: ConversationMessage[]): Promise<string> {
  const openaiApiKey = process.env.OPENAI_API_KEY;

  if (!openaiApiKey) {
    throw new Error('OpenAI API key not configured. Please set OPENAI_API_KEY in your .env file.');
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // Using GPT-4o-mini for cost efficiency, can upgrade to gpt-4o for better quality
        messages,
        temperature: 0.7,
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      const errorData: any = await response.json();
      throw new Error(`OpenAI API error: ${errorData.error?.message || response.statusText}`);
    }

    const data: any = await response.json();
    return data.choices[0].message.content;

  } catch (error: any) {
    console.error('OpenAI API call failed:', error);
    throw error;
  }
}

// Clean up old sessions periodically (optional)
setInterval(() => {
  const now = new Date();
  for (const [sessionId, session] of activeSessions.entries()) {
    const sessionAge = now.getTime() - session.startTime.getTime();
    // Remove sessions older than 2 hours
    if (sessionAge > 2 * 60 * 60 * 1000) {
      activeSessions.delete(sessionId);
    }
  }
}, 30 * 60 * 1000); // Run every 30 minutes

export default router;

