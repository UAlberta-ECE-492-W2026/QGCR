import React, { useState, useCallback } from 'react';
import { StyleSheet, Switch, TextInput } from 'react-native';

// settings page – no collapsible sections needed any more
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { QuickActionButton } from '@/components/quick-action-button';
import { useQboRobot } from '@/hooks/use-qbo-robot';
import { Fonts } from '@/constants/theme';

export default function SettingsScreen() {
  const robot = useQboRobot();

  // local settings state
  const [defaultSpeed, setDefaultSpeed] = useState('100');
  const [defaultTurnSpeed, setDefaultTurnSpeed] = useState('90');
  const [ledDuration, setLedDuration] = useState('1000');
  const [volume, setVolume] = useState('50');
  const [enableAnimations, setEnableAnimations] = useState(true);
  const [saving, setSaving] = useState(false);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const payload = {
        defaultSpeed: parseInt(defaultSpeed, 10),
        defaultTurnSpeed: parseInt(defaultTurnSpeed, 10),
        ledDuration: parseInt(ledDuration, 10),
        volume: parseInt(volume, 10),
        enableAnimations,
      };
      await fetch('/api/robot/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      alert('Settings saved');
    } catch (e) {
      console.error(e);
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  }, [defaultSpeed, defaultTurnSpeed, ledDuration, volume, enableAnimations]);

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#D0D0D0', dark: '#353636' }}
      headerImage={
        <IconSymbol
          size={310}
          color="#808080"
          name="gear.fill"
          style={styles.headerImage}
        />
      }>
      <ThemedView style={styles.titleContainer}>
        <ThemedText
          type="title"
          style={{ fontFamily: Fonts.rounded }}>
          Settings
        </ThemedText>
      </ThemedView>

      <ThemedView style={styles.section}>
        <ThemedText type="defaultSemiBold">Default move speed</ThemedText>
        <TextInput
          style={styles.input}
          value={defaultSpeed}
          onChangeText={setDefaultSpeed}
          keyboardType="numeric"
        />
      </ThemedView>

      <ThemedView style={styles.section}>
        <ThemedText type="defaultSemiBold">Default turn speed</ThemedText>
        <TextInput
          style={styles.input}
          value={defaultTurnSpeed}
          onChangeText={setDefaultTurnSpeed}
          keyboardType="numeric"
        />
      </ThemedView>

      <ThemedView style={styles.section}>
        <ThemedText type="defaultSemiBold">LED duration (ms)</ThemedText>
        <TextInput
          style={styles.input}
          value={ledDuration}
          onChangeText={setLedDuration}
          keyboardType="numeric"
        />
      </ThemedView>

      <ThemedView style={styles.section}>
        <ThemedText type="defaultSemiBold">Sound volume (0-100)</ThemedText>
        <TextInput
          style={styles.input}
          value={volume}
          onChangeText={setVolume}
          keyboardType="numeric"
        />
      </ThemedView>

      <ThemedView style={styles.toggleSection}>
        <ThemedText type="defaultSemiBold">Enable animations</ThemedText>
        <Switch
          value={enableAnimations}
          onValueChange={setEnableAnimations}
        />
      </ThemedView>

      <QuickActionButton
        label={saving ? 'Saving...' : 'Save Settings'}
        onPress={handleSave}
        disabled={saving}
        color="primary"
      />
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  headerImage: {
    color: '#808080',
    bottom: -90,
    left: -35,
    position: 'absolute',
  },
  titleContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  section: {
    marginVertical: 12,
  },
  toggleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 8,
    borderRadius: 4,
    marginTop: 4,
    width: 120,
  },
});
