# AI Interview Feature Setup

## Overview
The AI Interview feature allows users to practice technical interviews with an AI interviewer powered by OpenAI's GPT models. The AI can:
- Present coding problems based on topic and difficulty
- Provide hints when requested
- Evaluate the candidate's approach
- Engage in natural conversation about problem-solving

## Setup Instructions

### 1. Get an OpenAI API Key

1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign up or log in to your account
3. Navigate to **API Keys** section
4. Click **Create new secret key**
5. Copy the key (you won't be able to see it again!)

### 2. Add API Key to Environment Variables

Open your `.env` file in the project root and add:

```env
OPENAI_API_KEY=your_openai_api_key_here
```

**Example:**
```env
SUPABASE_URL=https://kupggnglhxhglxapqfjl.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
PORT=3000
NODE_ENV=development
```

### 3. Restart the Backend Server

After adding the API key, restart your backend:

```bash
npm start
```

Or if using the development server:

```bash
npm run dev
```

### 4. Verify Setup

1. Navigate to `http://localhost:5500/ai-interview.html`
2. Select a topic and difficulty
3. Click "Start AI Interview"
4. You should receive a coding problem from the AI

## Features

### Interview Setup
- **Topic Selection**: Choose from 16 different algorithm/data structure topics
- **Difficulty Levels**: Easy, Medium, or Hard
- **Real-time Chat**: Interactive conversation with the AI

### During Interview
- **Send Messages**: Share your thought process and approach
- **Request Hints**: Get guidance without spoiling the solution
- **Request Evaluation**: Get feedback on your current approach
- **Session Tracking**: Monitor duration and message count

### AI Capabilities
The AI interviewer will:
- Present clear problem statements with examples
- Ask clarifying questions about your approach
- Provide hints that guide without revealing the solution
- Evaluate time and space complexity
- Suggest improvements and edge cases
- Be encouraging and supportive

## Cost Considerations

The feature uses **GPT-4o-mini** by default for cost efficiency:
- GPT-4o-mini: ~$0.15 per 1M input tokens, ~$0.60 per 1M output tokens
- Average interview session: ~2,000-5,000 tokens (~$0.001-$0.003 per session)

To upgrade to GPT-4o for better quality, edit `backend/routes/ai-interview.ts`:

```typescript
model: 'gpt-4o', // Change from 'gpt-4o-mini'
```

## Troubleshooting

### Error: "OpenAI API key not configured"
- Make sure `OPENAI_API_KEY` is set in your `.env` file
- Restart the backend server after adding the key
- Check that the key starts with `sk-`

### Error: "Failed to process AI request"
- Check your OpenAI account has available credits
- Verify your API key is valid
- Check the backend console for detailed error messages

### Session Not Starting
- Open browser console (F12) to check for errors
- Verify backend is running on `http://localhost:3000`
- Check that `window.API_URL` is set correctly in `supabase-config.js`

## API Endpoint

**POST** `/api/ai-interview`

Request body:
```json
{
  "sessionId": "session_123456",
  "action": "start|message|hint|evaluate",
  "topic": "arrays",
  "difficulty": "medium",
  "message": "I think I should use a hash map...",
  "conversationHistory": []
}
```

Response:
```json
{
  "success": true,
  "message": "Here's a medium difficulty problem about arrays...",
  "conversationHistory": [...]
}
```

## Session Management

- Sessions are stored in-memory on the backend
- Sessions auto-expire after 2 hours of inactivity
- Conversation history is limited to last 20 messages for efficiency
- Session IDs are generated client-side

## Future Enhancements

Potential improvements:
- Save interview sessions to database
- Generate performance reports
- Support for multiple programming languages
- Code execution and validation
- Voice interaction
- Interview scheduling and reminders

