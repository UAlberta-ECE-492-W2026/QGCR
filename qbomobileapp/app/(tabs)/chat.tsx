import React from 'react';
import { StyleSheet } from 'react-native';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { ChatInterface } from '@/components/chat-interface';

export default function ChatScreen() {
  return (
    <ThemedView style={styles.container}>
      <ChatInterface />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
