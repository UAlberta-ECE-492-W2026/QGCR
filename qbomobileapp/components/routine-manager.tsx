import React, { useState, useCallback } from 'react';
import { StyleSheet, TouchableOpacity, Modal, TextInput, ScrollView, Alert } from 'react-native';
import { ThemedView } from './themed-view';
import { ThemedText } from './themed-text';
import { useCommandHistory, CommandHistoryItem } from '@/hooks/use-command-history';

interface RoutineManagerProps {
  onReplayRoutine?: (commands: string[]) => void;
}

export function RoutineManager({ onReplayRoutine }: RoutineManagerProps) {
  const { history, saveRoutine, replayRoutine, deleteRoutine } = useCommandHistory();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [routineName, setRoutineName] = useState('');
  const [currentCommands, setCurrentCommands] = useState<string[]>([]);

  const handleSaveRoutine = useCallback(() => {
    if (!routineName.trim()) {
      Alert.alert('Error', 'Please enter a routine name');
      return;
    }
    if (currentCommands.length === 0) {
      Alert.alert('Error', 'Please add at least one command');
      return;
    }
    saveRoutine(routineName, currentCommands);
    setRoutineName('');
    setCurrentCommands([]);
    Alert.alert('Success', `Routine "${routineName}" saved!`);
  }, [routineName, currentCommands, saveRoutine]);

  const handleReplay = useCallback(
    (item: CommandHistoryItem) => {
      Alert.alert('Replay Routine?', `Execute "${item.name}" with ${item.commands.length} commands?`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Play',
          onPress: () => {
            if (onReplayRoutine) {
              onReplayRoutine(item.commands);
            }
          },
        },
      ]);
    },
    [onReplayRoutine]
  );

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText style={styles.title}>🎬 Routines</ThemedText>
        <TouchableOpacity
          style={styles.manageButton}
          onPress={() => setIsModalOpen(true)}
        >
          <ThemedText style={styles.manageButtonText}>Manage</ThemedText>
        </TouchableOpacity>
      </ThemedView>

      {history.length > 0 ? (
        <ScrollView style={styles.routinesList} nestedScrollEnabled>
          {history.map((routine) => (
            <TouchableOpacity
              key={routine.id}
              style={styles.routineItem}
              onPress={() => handleReplay(routine)}
            >
              <ThemedView>
                <ThemedText style={styles.routineName}>{routine.name}</ThemedText>
                <ThemedText style={styles.routineInfo}>
                  {routine.commands.length} commands •{' '}
                  {routine.createdAt.toLocaleDateString()}
                </ThemedText>
              </ThemedView>
              <ThemedText style={styles.playIcon}>▶️</ThemedText>
            </TouchableOpacity>
          ))}
        </ScrollView>
      ) : (
        <ThemedText style={styles.empty}>No routines yet</ThemedText>
      )}

      <Modal
        visible={isModalOpen}
        animationType="slide"
        onRequestClose={() => setIsModalOpen(false)}
        transparent
      >
        <ThemedView style={styles.modalOverlay}>
          <ThemedView style={styles.modalContent}>
            <ThemedText style={styles.modalTitle}>Create Routine</ThemedText>

            <ThemedText style={styles.label}>Routine Name</ThemedText>
            <TextInput
              style={styles.input}
              placeholder="e.g., Dance Sequence"
              value={routineName}
              onChangeText={setRoutineName}
              placeholderTextColor="#999"
            />

            <ThemedText style={styles.label}>Commands</ThemedText>
            <ThemedView style={styles.commandsList}>
              {currentCommands.length > 0 ? (
                currentCommands.map((cmd, idx) => (
                  <ThemedView key={idx} style={styles.commandItem}>
                    <ThemedText>{idx + 1}. {cmd}</ThemedText>
                    <TouchableOpacity
                      onPress={() =>
                        setCurrentCommands((prev) => prev.filter((_, i) => i !== idx))
                      }
                    >
                      <ThemedText style={styles.removeIcon}>✕</ThemedText>
                    </TouchableOpacity>
                  </ThemedView>
                ))
              ) : (
                <ThemedText style={styles.emptyCommands}>
                  Add commands by pressing "Record" while executing robot actions
                </ThemedText>
              )}
            </ThemedView>

            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSaveRoutine}
            >
              <ThemedText style={styles.saveButtonText}>Save Routine</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setIsModalOpen(false)}
            >
              <ThemedText style={styles.closeButtonText}>Close</ThemedText>
            </TouchableOpacity>
          </ThemedView>
        </ThemedView>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  title: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  manageButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#007AFF',
    borderRadius: 6,
  },
  manageButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  routinesList: {
    maxHeight: 150,
    paddingHorizontal: 12,
  },
  routineItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    marginBottom: 8,
  },
  routineName: {
    fontWeight: '600',
  },
  routineInfo: {
    fontSize: 12,
    opacity: 0.6,
    marginTop: 2,
  },
  playIcon: {
    fontSize: 16,
  },
  empty: {
    fontSize: 12,
    opacity: 0.6,
    textAlign: 'center',
    paddingVertical: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingHorizontal: 16,
    paddingBottom: 40,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  label: {
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    color: '#000',
    marginBottom: 12,
  },
  commandsList: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    maxHeight: 150,
  },
  commandItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  removeIcon: {
    color: '#FF3B30',
    fontWeight: 'bold',
  },
  emptyCommands: {
    fontSize: 12,
    opacity: 0.6,
    fontStyle: 'italic',
  },
  saveButton: {
    backgroundColor: '#34C759',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  closeButton: {
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#007AFF',
    fontWeight: '600',
  },
});
