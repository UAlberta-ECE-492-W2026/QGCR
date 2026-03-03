const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { OpenAI } = require('openai');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

dotenv.config();

const app = express();
const upload = multer({ dest: 'uploads/' });

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.use(cors());
app.use(express.json());

// Store conversation history
const conversationHistory = {};

/**
 * POST /api/robot/chat
 * Text-based chat endpoint
 */
app.post('/api/robot/chat', async (req, res) => {
  try {
    const { message, sessionId = 'default' } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message required' });
    }

    // Initialize session history if needed
    if (!conversationHistory[sessionId]) {
      conversationHistory[sessionId] = [];
    }

    // Add user message to history
    conversationHistory[sessionId].push({
      role: 'user',
      content: message,
    });

    // Get response from OpenAI
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: conversationHistory[sessionId],
      max_tokens: 150,
      system:
        'You are a helpful AI assistant controlling a QBO robot. Keep responses concise and practical. You can help with robot movement, animations, lights, and sounds.',
    });

    const assistantMessage =
      response.choices[0].message.content;

    // Add assistant response to history
    conversationHistory[sessionId].push({
      role: 'assistant',
      content: assistantMessage,
    });

    // Convert response to speech (optional - using Google TTS as example)
    let audioUrl = null;
    try {
      audioUrl = await textToSpeech(assistantMessage);
    } catch (error) {
      console.warn('TTS conversion failed, returning text only:', error.message);
    }

    res.json({
      text: assistantMessage,
      audio: audioUrl,
    });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'Failed to process chat' });
  }
});

/**
 * POST /api/robot/chat/voice
 * Voice message endpoint - accepts audio and transcribes
 */
app.post('/api/robot/chat/voice', upload.single('audio'), async (req, res) => {
  const audioFile = req.file;
  const sessionId = req.body.sessionId || 'default';

  try {
    if (!audioFile) {
      return res.status(400).json({ error: 'Audio file required' });
    }

    // Transcribe audio using Whisper
    console.log(`Transcribing audio file: ${audioFile.path}`);
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(audioFile.path),
      model: 'whisper-1',
      language: 'en',
    });

    const userText = transcription.text;
    console.log(`Transcribed text: ${userText}`);

    // Initialize session history if needed
    if (!conversationHistory[sessionId]) {
      conversationHistory[sessionId] = [];
    }

    // Add transcribed message to history
    conversationHistory[sessionId].push({
      role: 'user',
      content: userText,
    });

    // Get response from OpenAI
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: conversationHistory[sessionId],
      max_tokens: 150,
      system:
        'You are a helpful AI assistant controlling a QBO robot. Keep responses concise and practical. You can help with robot movement, animations, lights, and sounds.',
    });

    const assistantMessage =
      response.choices[0].message.content;

    // Add assistant response to history
    conversationHistory[sessionId].push({
      role: 'assistant',
      content: assistantMessage,
    });

    // Convert response to speech
    let audioUrl = null;
    try {
      audioUrl = await textToSpeech(assistantMessage);
    } catch (error) {
      console.warn('TTS conversion failed:', error.message);
    }

    // Clean up uploaded audio file
    fs.unlinkSync(audioFile.path);

    res.json({
      transcribed: userText,
      text: assistantMessage,
      audio: audioUrl,
    });
  } catch (error) {
    console.error('Voice chat error:', error);
    if (audioFile && fs.existsSync(audioFile.path)) {
      fs.unlinkSync(audioFile.path);
    }
    res.status(500).json({ error: 'Failed to process voice message' });
  }
});

/**
 * Text-to-Speech helper using ElevenLabs or Google TTS
 * For now, returns null - implement with your preferred TTS service
 */
async function textToSpeech(text) {
  try {
    // Example: Using ElevenLabs
    // const response = await fetch('https://api.elevenlabs.io/v1/text-to-speech/{voice_id}', {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     'xi-api-key': process.env.ELEVENLABS_API_KEY,
    //   },
    //   body: JSON.stringify({ text }),
    // });
    // const audioBuffer = await response.arrayBuffer();
    // // Save and return URL
    // return audioUrl;

    // For now, just log that TTS would be called
    console.log(`TTS would convert: "${text}"`);
    return null;
  } catch (error) {
    console.error('TTS error:', error);
    return null;
  }
}

/**
 * GET /api/robot/chat/history/:sessionId
 * Retrieve conversation history
 */
app.get('/api/robot/chat/history/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  const history = conversationHistory[sessionId] || [];
  res.json({ history });
});

/**
 * DELETE /api/robot/chat/history/:sessionId
 * Clear conversation history
 */
app.delete('/api/robot/chat/history/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  delete conversationHistory[sessionId];
  res.json({ success: true, message: 'History cleared' });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'chatbot-ai' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🤖 Chatbot AI server running on port ${PORT}`);
  console.log('Endpoints:');
  console.log('  POST /api/robot/chat - Text chat');
  console.log('  POST /api/robot/chat/voice - Voice chat');
  console.log('  GET /api/robot/chat/history/:sessionId - Get history');
  console.log('  DELETE /api/robot/chat/history/:sessionId - Clear history');
});

module.exports = app;
