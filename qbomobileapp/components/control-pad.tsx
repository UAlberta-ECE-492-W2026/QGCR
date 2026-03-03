import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, View, Text, Dimensions, Alert } from 'react-native';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface ControlPadProps {
  onUp?: () => void;
  onDown?: () => void;
  onLeft?: () => void;
  onRight?: () => void;
  onCenter?: () => void;
  disabled?: boolean;
}

export const ControlPad: React.FC<ControlPadProps> = ({
  onUp,
  onDown,
  onLeft,
  onRight,
  onCenter,
  disabled = false,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <ThemedView style={styles.container}>
      <View style={styles.padGrid}>
        {/* Top */}
        <View style={styles.row1}>
          <TouchableOpacity
            style={[styles.button, styles.topButton, disabled && styles.disabled]}
            onPress={onUp}
            disabled={disabled}>
            <ThemedText style={styles.buttonText}>↑</ThemedText>
          </TouchableOpacity>
        </View>

        {/* Middle Row */}
        <View style={styles.row2}>
          <TouchableOpacity
            style={[styles.button, styles.sideButton, disabled && styles.disabled]}
            onPress={onLeft}
            disabled={disabled}>
            <ThemedText style={styles.buttonText}>←</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.centerButton, disabled && styles.disabled]}
            onPress={onCenter}
            disabled={disabled}>
            <ThemedText style={styles.buttonText}>●</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.sideButton, disabled && styles.disabled]}
            onPress={onRight}
            disabled={disabled}>
            <ThemedText style={styles.buttonText}>→</ThemedText>
          </TouchableOpacity>
        </View>

        {/* Bottom */}
        <View style={styles.row3}>
          <TouchableOpacity
            style={[styles.button, styles.bottomButton, disabled && styles.disabled]}
            onPress={onDown}
            disabled={disabled}>
            <ThemedText style={styles.buttonText}>↓</ThemedText>
          </TouchableOpacity>
        </View>
      </View>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    borderRadius: 15,
    marginVertical: 10,
  },
  padGrid: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  row1: {
    marginBottom: 10,
  },
  row2: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 10,
  },
  row3: {
    marginTop: 10,
  },
  button: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    activeOpacity: 0.7,
  },
  topButton: {
    marginLeft: 55,
  },
  bottomButton: {
    marginLeft: 55,
  },
  sideButton: {},
  centerButton: {
    backgroundColor: '#FF3B30',
  },
  buttonText: {
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  disabled: {
    opacity: 0.5,
  },
});
