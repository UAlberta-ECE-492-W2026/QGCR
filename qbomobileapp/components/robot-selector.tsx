import React, { useState, useCallback } from 'react';
import { StyleSheet, TouchableOpacity, Modal, TextInput, Alert } from 'react-native';
import { ThemedView } from './themed-view';
import { ThemedText } from './themed-text';
import { useMultiRobotSupport, Robot } from '@/hooks/use-multi-robot';

interface RobotSelectorProps {
  onRobotChange?: (robot: Robot) => void;
}

export function RobotSelector({ onRobotChange }: RobotSelectorProps) {
  const { robots, selectedRobot, switchRobot, addRobot, removeRobot } =
    useMultiRobotSupport();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newAddress, setNewAddress] = useState('');

  const handleAddRobot = useCallback(() => {
    if (!newName.trim() || !newAddress.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    const robot = addRobot(newName, newAddress);
    setNewName('');
    setNewAddress('');
    setIsModalOpen(false);
    if (onRobotChange) {
      onRobotChange(robot);
    }
  }, [newName, newAddress, addRobot, onRobotChange]);

  const handleSelectRobot = useCallback(
    (id: string) => {
      switchRobot(id);
      const robot = robots.find((r) => r.id === id);
      if (robot && onRobotChange) {
        onRobotChange(robot);
      }
    },
    [switchRobot, robots, onRobotChange]
  );

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText style={styles.label}>🤖 Current Robot:</ThemedText>
        <TouchableOpacity onPress={() => setIsModalOpen(true)} style={styles.selector}>
          <ThemedText style={styles.selectedText}>
            {selectedRobot?.name || 'No Robot'}
          </ThemedText>
        </TouchableOpacity>
      </ThemedView>

      {selectedRobot && (
        <ThemedText style={styles.address}>{selectedRobot.address}</ThemedText>
      )}

      <Modal
        visible={isModalOpen}
        animationType="slide"
        onRequestClose={() => setIsModalOpen(false)}
        transparent
      >
        <ThemedView style={styles.modalOverlay}>
          <ThemedView style={styles.modalContent}>
            <ThemedText style={styles.modalTitle}>Robot Manager</ThemedText>

            <ThemedText style={styles.sectionTitle}>Available Robots</ThemedText>
            {robots.map((robot) => (
              <TouchableOpacity
                key={robot.id}
                style={[
                  styles.robotItem,
                  selectedRobot?.id === robot.id && styles.robotItemSelected,
                ]}
                onPress={() => handleSelectRobot(robot.id)}
              >
                <ThemedView>
                  <ThemedText style={styles.robotName}>{robot.name}</ThemedText>
                  <ThemedText style={styles.robotAddress}>{robot.address}</ThemedText>
                </ThemedView>
                <TouchableOpacity
                  onPress={() => removeRobot(robot.id)}
                  style={styles.deleteButton}
                >
                  <ThemedText style={styles.deleteText}>✕</ThemedText>
                </TouchableOpacity>
              </TouchableOpacity>
            ))}

            <ThemedText style={styles.sectionTitle}>Add New Robot</ThemedText>
            <TextInput
              style={styles.input}
              placeholder="Robot Name (e.g., QBO-2)"
              value={newName}
              onChangeText={setNewName}
              placeholderTextColor="#999"
            />
            <TextInput
              style={styles.input}
              placeholder="Address (e.g., 192.168.1.100:3000)"
              value={newAddress}
              onChangeText={setNewAddress}
              placeholderTextColor="#999"
            />

            <TouchableOpacity style={styles.addButton} onPress={handleAddRobot}>
              <ThemedText style={styles.addButtonText}>Add Robot</ThemedText>
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
    paddingHorizontal: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  label: {
    fontWeight: '600',
    flex: 0,
  },
  selector: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#0084FF',
    backgroundColor: '#E7F2FF',
  },
  selectedText: {
    color: '#0084FF',
    fontWeight: '600',
  },
  address: {
    fontSize: 12,
    opacity: 0.6,
    marginTop: 4,
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
  sectionTitle: {
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  robotItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    marginBottom: 8,
  },
  robotItemSelected: {
    borderColor: '#0084FF',
    backgroundColor: '#E7F2FF',
  },
  robotName: {
    fontWeight: '600',
  },
  robotAddress: {
    fontSize: 12,
    opacity: 0.6,
  },
  deleteButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  deleteText: {
    color: '#FF3B30',
    fontSize: 18,
    fontWeight: 'bold',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 8,
    color: '#000',
  },
  addButton: {
    backgroundColor: '#34C759',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 12,
  },
  addButtonText: {
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
