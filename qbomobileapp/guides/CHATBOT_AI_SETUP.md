# Chatbot AI Setup Guide

## Overview

Your QBO robot now has an AI chatbot interface powered by OpenAI's GPT-4 and Whisper APIs. The robot can understand voice commands, respond naturally, and execute actions based on conversation.

## Architecture

```
┌─────────────────────┐
│   Mobile App        │
│  (React Native)     │
│  - Chat UI          │
│  - Voice Recording  │
│  - Message History  │
└──────────┬──────────┘
           │ HTTP/REST
           ↓
┌─────────────────────┐
│ Chatbot Server      │
│ (Node.js/Express)   │
│ - OpenAI Integration│
│ - Voice Handling    │
│ - Session History   │
└──────────┬──────────┘
           │
           ↓
┌─────────────────────┐
│  OpenAI Services    │
│  - GPT-4 (chat)     │
│  - Whisper (speech) │
│  - TTS (optional)   │
└─────────────────────┘
```

## Frontend Setup

### 1. Install Dependencies

```bash
cd qbomobileapp
npm install
# This adds expo-audio for voice recording
```

### 2. New Components

- **`components/chat-interface.tsx`** — Full chat UI with voice recording
- **`hooks/use-chatbot.ts`** — Chat API hook
- **`app/(tabs)/chat.tsx`** — Chat tab screen

### 3. How It Works

```typescript
// User records voice
// App sends to: POST /api/robot/chat/voice
// Backend: Transcribes audio with Whisper
// Backend: Sends text to GPT-4
// Backend: Returns response + optional audio
// App: Displays response and plays audio
```

## Backend Setup

### 1. Create Backend Project

```bash
mkdir ../qbo-chatbot-backend
cd ../qbo-chatbot-backend
npm init -y
npm install express cors dotenv openai multer
```

### 2. Environment Configuration

Create `.env` file:

```env
OPENAI_API_KEY=sk-your-api-key-here
PORT=3000
```

Get your OpenAI API key from: https://platform.openai.com/api-keys

### 3. Copy Server Code

Copy the contents of `CHATBOT_SERVER.js` from the mobile app folder to your backend project as `server.js`:

```bash
cp ../qbomobileapp/CHATBOT_SERVER.js ./server.js
```

### 4. Start the Server

```bash
node server.js
# Output: 🤖 Chatbot AI server running on port 3000
```

## API Endpoints

### Text Chat
```bash
POST /api/robot/chat
Content-Type: application/json

{
  "message": "Make the robot dance",
  "sessionId": "user-123"
}

Response:
{
  "text": "I'll make the robot perform a dance animation. Here it goes!",
  "audio": null
}
```

### Voice Chat
```bash
POST /api/robot/chat/voice
Content-Type: multipart/form-data

Files:
- audio: (WAV/MP3 audio file)
- sessionId: "user-123"

Response:
{
  "transcribed": "Make the robot dance",
  "text": "I'll make the robot perform a dance animation...",
  "audio": null
}
```

### Get History
```bash
GET /api/robot/chat/history/user-123

Response:
{
  "history": [
    { "role": "user", "content": "..." },
    { "role": "assistant", "content": "..." }
  ]
}
```

### Clear History
```bash
DELETE /api/robot/chat/history/user-123

Response:
{
  "success": true,
  "message": "History cleared"
}
```

## Chat Features

### What the AI Can Help With

The chatbot is configured to understand:
- **Movement**: "Move forward 30cm", "Turn left"
- **Animations**: "Do a dance", "Wave at me"
- **Lights**: "Turn on red lights", "Blink blue"
- **Sounds**: "Play a beep", "Make a siren sound"
- **General chat**: Regular conversation and questions

### Example Conversations

```
User: "Can you do a little dance?"
AI: "Of course! I'll perform a fun dance animation for the robot."

User: "What's your favorite color?"
AI: "Blue is a great color for the robot's LED lights!"

User: "Move forward slowly"
AI: "I'll move the robot forward at a slow, steady pace."
```

## Text-to-Speech (Optional)

The server includes placeholder code for TTS. To add audio responses:

### Using ElevenLabs (recommended)

1. Sign up at https://elevenlabs.io
2. Get your API key
3. Add to `.env`:
```env
ELEVENLABS_API_KEY=sk-your-key
```

4. Uncomment the TTS code in `CHATBOT_SERVER.js`

### Using Google Cloud TTS

1. Set up Google Cloud project
2. Enable Text-to-Speech API
3. Download service account JSON
4. Implement using `google-tts` package

## Testing

### 1. Test Text Chat
```bash
curl -X POST http://localhost:3000/api/robot/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Say hello to me","sessionId":"test"}'
```

### 2. Test Voice Chat
```bash
# Record a WAV file or use an existing one
curl -X POST http://localhost:3000/api/robot/chat/voice \
  -F "audio=@voice.wav" \
  -F "sessionId=test"
```

### 3. Get History
```bash
curl http://localhost:3000/api/robot/chat/history/test
```

## Integrating with Robot Control

To execute robot actions based on chat responses, integrate with your main robot control:

```typescript
// In your chat handler
const response = await fetch('/api/robot/chat', {...});
const { text, command } = await response.json();

// Check if response contains robot commands
if (text.includes('dance')) {
  robot.dance('simple');
}
if (text.includes('light')) {
  robot.setLight(255, 0, 0, 1000);
}
```

## Troubleshooting

### "Invalid API key"
- Verify OPENAI_API_KEY is set in `.env`
- Check key is valid at platform.openai.com

### "Audio file too large"
- Whisper has file size limits (~25MB)
- Compress audio before sending

### "No response from server"
- Ensure chatbot server is running on port 3000
- Check CORS is enabled
- Verify network connectivity

### "Permission denied for audio"
- Request microphone permissions in app
- Add to `app.json` if needed

## Cost Estimation

- **Whisper API**: ~$0.02 per minute of audio
- **GPT-4**: ~$0.03 per 1K tokens (input/output)
- **ElevenLabs TTS**: ~$0.30 per 1M characters

For testing, use GPT-3.5-turbo (~$0.001 per 1K tokens) in `CHATBOT_SERVER.js`:
```javascript
model: 'gpt-3.5-turbo',  // Cheaper alternative
```

## Next Steps

1. ✅ Set up OpenAI API key
2. ✅ Start chatbot server
3. ✅ Test endpoints with curl
4. ✅ Run mobile app and test chat tab
5. 🔄 Integrate robot actions (dance, lights, etc.)
6. 🔄 Add TTS for voice responses
7. 🔄 Deploy to production

## Files Created

- `components/chat-interface.tsx` — Chat UI component
- `hooks/use-chatbot.ts` — Chat hook
- `app/(tabs)/chat.tsx` — Chat tab
- `CHATBOT_SERVER.js` — Backend server
- `CHATBOT_AI_SETUP.md` — This guide
