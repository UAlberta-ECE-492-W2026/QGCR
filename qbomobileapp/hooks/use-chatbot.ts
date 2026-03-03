import { useState, useCallback } from 'react';

interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
}

export function useChatbot() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = useCallback(async (userText: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:3000/api/robot/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userText,
          history: messages,
        }),
      });

      const data = await response.json();
      setMessages((prev) => [
        ...prev,
        { role: 'user', text: userText },
        { role: 'assistant', text: data.text },
      ]);
      return data;
    } catch (error) {
      console.error('Chat error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [messages]);

  return { messages, isLoading, sendMessage };
}
