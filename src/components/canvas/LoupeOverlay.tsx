import React, { useState, useImperativeHandle, forwardRef } from 'react';
import { View, StyleSheet, Text } from 'react-native';

export const LOUPE_SIZE = 106;
export const LOUPE_RADIUS = 3; // 7x7 grid (-3 to +3)
export const LOUPE_GRID_COUNT = LOUPE_RADIUS * 2 + 1; // 7
export const LOUPE_CELL_SIZE = LOUPE_SIZE / LOUPE_GRID_COUNT; // ~15.14px

export interface LoupeData {
  x: number;
  y: number;
  row: number;
  col: number;
  activeColor: string;
  isEraser: boolean;
}

export interface LoupeOverlayRef {
  show: (data: LoupeData) => void;
  update: (data: LoupeData) => void;
  hide: () => void;
}

export interface LoupeOverlayProps {
  gridRef: React.MutableRefObject<string[][]>;
  gridSizeRef: React.MutableRefObject<number>;
  canvasWidth: number;
  canvasHeight: number;
}

export const LoupeOverlay = forwardRef<LoupeOverlayRef, LoupeOverlayProps>(
  ({ gridRef, gridSizeRef, canvasWidth, canvasHeight }, ref) => {
    const [state, setState] = useState<{
      visible: boolean;
      x: number;
      y: number;
      row: number;
      col: number;
      activeColor: string;
      isEraser: boolean;
    }>({
      visible: false,
      x: 0,
      y: 0,
      row: 0,
      col: 0,
      activeColor: '#e11d48',
      isEraser: false,
    });

    useImperativeHandle(ref, () => ({
      show: (data: LoupeData) => {
        setState({
          visible: true,
          ...data,
        });
      },
      update: (data: LoupeData) => {
        setState({
          visible: true,
          ...data,
        });
      },
      hide: () => {
        setState(prev => (prev.visible ? { ...prev, visible: false } : prev));
      },
    }));

    if (!state.visible) return null;

    const canvasW = canvasWidth > 0 ? canvasWidth : 340;
    const canvasH = canvasHeight > 0 ? canvasHeight : 340;
    const gridSize = gridSizeRef.current;
    const curGrid = gridRef.current;

    const loupeHalf = LOUPE_SIZE / 2;
    const loupeLeft = Math.max(6, Math.min(canvasW - LOUPE_SIZE - 6, state.x - loupeHalf));
    const isNearTop = state.y < LOUPE_SIZE + 24;
    const loupeTop = isNearTop
      ? Math.min(canvasH - LOUPE_SIZE - 6, state.y + 24)
      : Math.max(6, state.y - LOUPE_SIZE - 24);

    return (
      <View
        pointerEvents="none"
        style={[
          styles.loupeContainer,
          {
            left: loupeLeft,
            top: loupeTop,
          },
        ]}
      >
        <View style={styles.loupeCircle}>
          {Array.from({ length: LOUPE_GRID_COUNT }, (_, rOffset) => {
            const targetRow = state.row - LOUPE_RADIUS + rOffset;
            return (
              <View key={`lr-${rOffset}`} style={{ flexDirection: 'row' }}>
                {Array.from({ length: LOUPE_GRID_COUNT }, (_, cOffset) => {
                  const targetCol = state.col - LOUPE_RADIUS + cOffset;
                  const isCenter = rOffset === LOUPE_RADIUS && cOffset === LOUPE_RADIUS;
                  const isOutOfBounds =
                    targetRow < 0 ||
                    targetRow >= gridSize ||
                    targetCol < 0 ||
                    targetCol >= gridSize;

                  const cellColor = isOutOfBounds
                    ? ((targetRow + targetCol) % 2 === 0 ? '#18181f' : '#22222a')
                    : (curGrid[targetRow]?.[targetCol] || '#ffffff');

                  return (
                    <View
                      key={`lc-${cOffset}`}
                      style={{
                        width: LOUPE_CELL_SIZE,
                        height: LOUPE_CELL_SIZE,
                        backgroundColor: cellColor,
                        borderRightWidth: 0.5,
                        borderBottomWidth: 0.5,
                        borderColor: 'rgba(128,128,128,0.25)',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {isCenter && (
                        <View
                          style={{
                            width: '100%',
                            height: '100%',
                            borderWidth: 2,
                            borderColor: '#ffffff',
                          }}
                        />
                      )}
                    </View>
                  );
                })}
              </View>
            );
          })}
        </View>

        {/* Insignia con coordenadas y color activo */}
        <View style={styles.loupeBadge}>
          <View
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: state.isEraser ? '#ffffff' : state.activeColor,
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.4)',
            }}
          />
          <Text style={styles.badgeText}>
            {state.col + 1},{state.row + 1}
          </Text>
        </View>
      </View>
    );
  }
);

const styles = StyleSheet.create({
  loupeContainer: {
    position: 'absolute',
    alignItems: 'center',
    zIndex: 999,
    elevation: 20,
  },
  loupeCircle: {
    width: LOUPE_SIZE,
    height: LOUPE_SIZE,
    borderRadius: LOUPE_SIZE / 2,
    borderWidth: 3,
    borderColor: '#e11d48',
    backgroundColor: '#18181f',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.55,
    shadowRadius: 10,
    elevation: 14,
  },
  loupeBadge: {
    marginTop: 4,
    backgroundColor: 'rgba(18, 18, 22, 0.92)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#ffffff',
  },
});
