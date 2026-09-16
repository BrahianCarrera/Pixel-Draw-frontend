import React from 'react';
import { View, StyleSheet } from 'react-native';

interface PixelPreviewProps {
  grid: string[][];
  size?: number;
  borderRadius?: number;
}

export const PixelPreview: React.FC<PixelPreviewProps> = ({
  grid,
  size = 200,
  borderRadius = 8,
}) => {
  if (!grid || !Array.isArray(grid) || grid.length === 0) {
    return (
      <View
        style={StyleSheet.flatten([
          styles.container,
          { width: size, height: size, borderRadius, backgroundColor: '#f1f5f9' },
        ])}
      />
    );
  }

  return (
    <View
      style={StyleSheet.flatten([
        styles.container,
        {
          width: size,
          height: size,
          borderRadius,
        },
      ])}
    >
      {grid.map((row, rIdx) => (
        <View key={`prev-row-${rIdx}`} style={styles.row}>
          {row.map((color, cIdx) => (
            <View
              key={`prev-cell-${rIdx}-${cIdx}`}
              style={StyleSheet.flatten([
                styles.cell,
                {
                  backgroundColor: color || '#ffffff',
                },
              ])}
            />
          ))}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  row: {
    flex: 1,
    flexDirection: 'row',
  },
  cell: {
    flex: 1,
  },
});
