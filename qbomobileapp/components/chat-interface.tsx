import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: Date;
}

export function ChatInterface() {
  const colorScheme = useColorScheme();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const recordingInterval = useRef<NodeJS.Timeout | null>(null);
  const audioRecorderRef = useRef<any>(null);

  // Initialize audio recording (would use expo-audio or similar)
  useEffect(() => {
    // Initialize audio recorder here if using expo-audio
    return () => {
      if (recordingInterval.current) {
        clearInterval(recordingInterval.current);
      }
    };
  }, []);

  const startRecording = useCallback(async () => {
    try {
      setIsRecording(true);
      setRecordingTime(0);

      // Start recording timer
      recordingInterval.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);

      // For now, simulate recording - in production use expo-audio
      // const audio = await audioRecorderRef.current?.startAsync?.();
      console.log('Recording started...');
    } catch (error) {
      console.error('Failed to start recording:', error);
      Alert.alert('Error', 'Failed to start recording');
      setIsRecording(false);
    }
  }, []);

  const stopRecording = useCallback(async () => {
    try {
      if (recordingInterval.current) {
        clearInterval(recordingInterval.current);
      }
      setIsRecording(false);
      setIsProcessing(true);

      // Stop recording and get audio file
      // const audioUri = await audioRecorderRef.current?.stopAndUnloadAsync?.();

      // For demo, create a mock user message
      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'user',
        text: 'Hello robot, can you dance?',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMessage]);

      // Send to backend
      await sendVoiceToBackend();

      setIsProcessing(false);
      setRecordingTime(0);
    } catch (error) {
      console.error('Failed to stop recording:', error);
      Alert.alert('Error', 'Failed to process recording');
      setIsProcessing(false);
    }
  }, []);

  const sendVoiceToBackend = useCallback(async () => {
    try {
      // In production, send actual audio file
      const formData = new FormData();
      // formData.append('audio', {
      //   uri: audioUri,
      //   type: 'audio/wav',
      //   name: 'voice.wav',
      // });

      const response = await fetch('http://localhost:3000/api/robot/chat/voice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: 'User voice message',
        }),
      });

      const data = await response.json();

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: data.text || 'I understood that. Let me help.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);

      // Auto-scroll to bottom
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error('Failed to send voice:', error);
      Alert.alert('Error', 'Failed to process your message');
    }
  }, []);

  const sendTextMessage = useCallback(async (text: string) => {
    if (!text.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: text.trim(),
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setIsProcessing(true);

    try {
      const response = await fetch('http://localhost:3000/api/robot/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: text.trim(),
          history: messages,
        }),
      });

      const data = await response.json();

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: data.text || 'I understood that.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);

      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error('Failed to send message:', error);
      Alert.alert('Error', 'Failed to send message');
    } finally {
      setIsProcessing(false);
    }
  }, [messages]);

  const clearChat = useCallback(() => {
    setMessages([]);
  }, []);

  const backgroundColor =
    colorScheme === 'dark' ? Colors.dark.background : Colors.light.background;
  const textColor = colorScheme === 'dark' ? '#fff' : '#000';
  const bubbleColor =
    colorScheme === 'dark'
      ? { user: '#0084FF', assistant: '#444' }
      : { user: '#0084FF', assistant: '#E5E5EA' };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor }]}
    >
      <ThemedView style={styles.header}>
        <ThemedText type="title">Robot Chat</ThemedText>
        <TouchableOpacity
          onPress={clearChat}
          style={styles.clearButton}
        >
          <ThemedText style={{ fontSize: 12 }}>Clear</ThemedText>
        </TouchableOpacity>
      </ThemedView>

      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
      >
        {messages.length === 0 ? (
          <ThemedView style={styles.emptyState}>
            <ThemedText style={{ textAlign: 'center', opacity: 0.6 }}>
              Start a conversation with your robot!{'\n'}Use voice or text.
            </ThemedText>
          </ThemedView>
        ) : (
          messages.map((msg) => (
            <ThemedView
              key={msg.id}
              style={[
                styles.messageBubble,
                {
                  alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  backgroundColor:
                    msg.role === 'user' ? bubbleColor.user : bubbleColor.assistant,
                  maxWidth: '80%',
                },
              ]}
            >
              <ThemedText
                style={{
                  color: msg.role === 'user' ? '#fff' : textColor,
                  fontSize: 14,
                }}
              >
                {msg.text}
              </ThemedText>
            </ThemedView>
          ))
        )}
        {isProcessing && (
          <ThemedView style={[styles.messageBubble, { alignSelf: 'flex-start' }]}>
            <ActivityIndicator color="#0084FF" />
          </ThemedView>
        )}
      </ScrollView>

      <ThemedView style={styles.inputArea}>
        <TouchableOpacity
          style={[
            styles.recordButton,
            {
              backgroundColor: isRecording ? '#FF4444' : '#0084FF',
              opacity: isProcessing ? 0.5 : 1,
            },
          ]}
          onPress={isRecording ? stopRecording : startRecording}
          disabled={isProcessing}
        >
          <ThemedText style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>
            {isRecording ? `Stop (${recordingTime}s)` : '🎤 Record'}
          </ThemedText>
        </TouchableOpacity>
      </ThemedView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  clearButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  messageBubble: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginVertical: 4,
  },
  inputArea: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  recordButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
