# Chatbot AI - Quick Start

## 60-Second Setup

### 1. Get OpenAI API Key
Go to https://platform.openai.com/api-keys and create a new secret key.

### 2. Start Chatbot Server
```bash
cd ../qbo-chatbot-backend  # Create this folder first
npm init -y
npm install express cors dotenv openai multer

# Copy CHATBOT_SERVER.js from mobile app
cp ../qbomobileapp/CHATBOT_SERVER.js ./server.js

# Create .env
echo "OPENAI_API_KEY=sk-YOUR-API-KEY-HERE" > .env

# Start server
node server.js
```

### 3. Test in Mobile App
```bash
cd qbomobileapp
npm start
# Go to "Chat" tab, tap record button or type
```

## Chat Tab Features

- 🎤 **Voice Recording** — Tap "Record" button to speak
- 💬 **Text Input** — Type messages (add TextInput component as desired)
- 📱 **Message History** — View full conversation
- 🤖 **AI Responses** — Powered by GPT-4
- 🔊 **Audio Transcription** — Whisper converts voice to text

## What to Say

```
"Can you dance?"
"Turn on red lights"
"Move forward slowly"
"What time is it?"
"Make a beeping sound"
```

## Common Issues

| Issue | Solution |
|-------|----------|
| "Invalid API key" | Check OpenAI dashboard, key must start with `sk-` |
| "No response" | Ensure server running on port 3000 |
| "Audio permission" | Grant microphone access in iOS/Android settings |
| "Too expensive" | Use `gpt-3.5-turbo` instead of `gpt-4` in server |

## File Structure

```
qbomobileapp/
├── app/(tabs)/chat.tsx           ← New tab
├── components/chat-interface.tsx ← UI
├── hooks/use-chatbot.ts          ← Hook
├── CHATBOT_SERVER.js             ← Backend
└── CHATBOT_AI_SETUP.md           ← Full guide

../qbo-chatbot-backend/
├── server.js                     ← Copy CHATBOT_SERVER.js here
├── .env                          ← API key goes here
├── package.json
└── node_modules/
```

## Next: Robot Integration

To make the AI actually control the robot:

```typescript
// In chat response handler
if (response.text.includes('dance')) {
  await robot.dance('simple');
}
if (response.text.includes('red')) {
  await robot.setLight(255, 0, 0, 1000);
}
if (response.text.includes('move') || response.text.includes('forward')) {
  await robot.move(20, 100);
}
```

## Endpoints Reference

```bash
# Text chat
curl -X POST http://localhost:3000/api/robot/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Say hello"}'

# Voice chat (requires audio file)
curl -X POST http://localhost:3000/api/robot/chat/voice \
  -F "audio=@voice.wav"

# Clear history
curl -X DELETE http://localhost:3000/api/robot/chat/history/default
```

See `CHATBOT_AI_SETUP.md` for complete documentation.
