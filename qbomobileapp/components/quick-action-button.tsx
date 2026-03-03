import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

interface QuickActionButtonProps {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  color?: 'primary' | 'success' | 'danger' | 'warning';
  size?: 'small' | 'medium' | 'large';
}

export const QuickActionButton: React.FC<QuickActionButtonProps> = ({
  label,
  onPress,
  loading = false,
  disabled = false,
  color = 'primary',
  size = 'medium',
}) => {
  const getColorStyle = () => {
    switch (color) {
      case 'success':
        return '#34C759';
      case 'danger':
        return '#FF3B30';
      case 'warning':
        return '#FF9500';
      case 'primary':
      default:
        return '#007AFF';
    }
  };

  const getSizeStyle = () => {
    switch (size) {
      case 'small':
        return { paddingHorizontal: 12, paddingVertical: 8, fontSize: 12 };
      case 'large':
        return { paddingHorizontal: 24, paddingVertical: 14, fontSize: 16 };
      case 'medium':
      default:
        return { paddingHorizontal: 16, paddingVertical: 12, fontSize: 14 };
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.button,
        {
          backgroundColor: getColorStyle(),
          ...getSizeStyle(),
        },
        (disabled || loading) && styles.disabled,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}>
      <ThemedText
        style={[
          styles.text,
          {
            fontSize: getSizeStyle().fontSize,
          },
        ]}>
        {loading ? 'Loading...' : label}
      </ThemedText>
    </TouchableOpacity>
  );
};

interface QuickActionsGridProps {
  actions: Array<{
    label: string;
    onPress: () => void;
    color?: 'primary' | 'success' | 'danger' | 'warning';
    disabled?: boolean;
  }>;
}

export const QuickActionsGrid: React.FC<QuickActionsGridProps> = ({ actions }) => {
  return (
    <ThemedView style={styles.container}>
      <View style={styles.grid}>
        {actions.map((action, index) => (
          <View key={index} style={styles.gridItem}>
            <QuickActionButton
              label={action.label}
              onPress={action.onPress}
              color={action.color || 'primary'}
              disabled={action.disabled}
              size="small"
            />
          </View>
        ))}
      </View>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 10,
    borderRadius: 10,
    marginVertical: 10,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
  },
  gridItem: {
    width: '48%',
  },
  button: {
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 44,
  },
  text: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  disabled: {
    opacity: 0.5,
  },
});
