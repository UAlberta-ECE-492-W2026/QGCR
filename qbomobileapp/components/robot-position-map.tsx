import React, useMemo from 'react';
import { StyleSheet, Dimensions } from 'react-native';
import { ThemedView } from './themed-view';
import { ThemedText } from './themed-text';

interface RobotPositionMapProps {
  x: number;
  y: number;
  angle: number; // degrees 0-360
}

export function RobotPositionMap({ x, y, angle }: RobotPositionMapProps) {
  const { mapWidth, mapHeight } = useMemo(() => {
    const screenWidth = Dimensions.get('window').width;
    return { mapWidth: screenWidth - 40, mapHeight: 150 };
  }, []);

  // Scale coordinates to fit in map (assuming max 200cm x 200cm space)
  const maxDistance = 200;
  const scaledX = (x / maxDistance) * mapWidth * 0.8 + mapWidth * 0.1;
  const scaledY = (y / maxDistance) * mapHeight * 0.8 + mapHeight * 0.1;

  // Arrow direction based on angle
  const angleRad = (angle * Math.PI) / 180;
  const arrowLength = 20;
  const arrowX = Math.cos(angleRad) * arrowLength;
  const arrowY = Math.sin(angleRad) * arrowLength;

  return (
    <ThemedView style={styles.container}>
      <ThemedText style={styles.title}>📍 Position Map</ThemedText>
      <ThemedView
        style={[
          styles.map,
          {
            width: mapWidth,
            height: mapHeight,
          },
        ]}
      >
        {/* Grid lines */}
        <ThemedView style={styles.gridLine} />
        <ThemedView style={[styles.gridLine, { transform: [{ rotate: '90deg' }] }]} />

        {/* Robot position indicator */}
        <ThemedView
          style={[
            styles.robotIndicator,
            {
              left: scaledX - 12,
              top: scaledY - 12,
            },
          ]}
        >
          {/* Arrow showing direction */}
          <ThemedView
            style={[
              styles.arrow,
              {
                transform: [{ rotate: `${angle}deg` }],
              },
            ]}
          />
        </ThemedView>

        {/* Coordinates text */}
        <ThemedText style={styles.coords}>
          {x.toFixed(1)}cm, {y.toFixed(1)}cm
        </ThemedText>
      </ThemedView>

      {/* Angle display */}
      <ThemedText style={styles.angle}>Angle: {angle.toFixed(0)}°</ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
    paddingHorizontal: 12,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 8,
    fontSize: 14,
  },
  map: {
    borderWidth: 2,
    borderColor: '#ccc',
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
    position: 'relative',
    overflow: 'hidden',
  },
  gridLine: {
    position: 'absolute',
    backgroundColor: '#eee',
  },
  robotIndicator: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#0084FF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#0066CC',
  },
  arrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderBottomWidth: 12,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#fff',
  },
  coords: {
    position: 'absolute',
    bottom: 4,
    left: 8,
    fontSize: 11,
    opacity: 0.7,
  },
  angle: {
    marginTop: 8,
    fontSize: 12,
    textAlign: 'center',
  },
});
