import React, {
  useRef,
  useState,
  useEffect,
  useImperativeHandle,
  forwardRef,
  useCallback,
} from 'react';
import { View, StyleSheet } from 'react-native';
import {
  Canvas,
  Picture,
  Skia,
  PaintStyle,
  SkPicture,
} from '@shopify/react-native-skia';
import { CanvasSurfaceProps, CanvasSurfaceRef } from './CanvasSurface.types';

function buildSkiaPicture(
  grid: string[][],
  gridSize: number,
  canvasSize: number,
  showGridLines: boolean
): SkPicture {
  const recorder = Skia.PictureRecorder();
  const canvas = recorder.beginRecording(Skia.XYWHRect(0, 0, canvasSize, canvasSize));
  const paint = Skia.Paint();

  const cellW = canvasSize / gridSize;
  const cellH = canvasSize / gridSize;

  // 1. Fondo blanco
  paint.setStyle(PaintStyle.Fill);
  paint.setColor(Skia.Color('#ffffff'));
  canvas.drawRect(Skia.XYWHRect(0, 0, canvasSize, canvasSize), paint);

  // 2. Dibujar celdas pintadas
  for (let r = 0; r < gridSize; r++) {
    const row = grid[r];
    if (!row) continue;
    for (let c = 0; c < gridSize; c++) {
      const color = row[c];
      if (color && color.toLowerCase() !== '#ffffff') {
        try {
          paint.setColor(Skia.Color(color));
          canvas.drawRect(
            Skia.XYWHRect(c * cellW, r * cellH, cellW + 0.5, cellH + 0.5),
            paint
          );
        } catch {
          // Ignorar colores inválidos si existieran
        }
      }
    }
  }

  // 3. Dibujar rejilla vectorial perfecta (un solo trazo con Skia)
  if (showGridLines) {
    paint.setStyle(PaintStyle.Stroke);
    paint.setStrokeWidth(1);
    paint.setColor(Skia.Color('rgba(128, 128, 128, 0.28)'));

    for (let i = 1; i < gridSize; i++) {
      const x = Math.round(i * cellW);
      const y = Math.round(i * cellH);

      // Línea vertical
      canvas.drawLine(x, 0, x, canvasSize, paint);
      // Línea horizontal
      canvas.drawLine(0, y, canvasSize, y, paint);
    }
  }

  return recorder.finishRecordingAsPicture();
}

export const CanvasSurface = forwardRef<CanvasSurfaceRef, CanvasSurfaceProps>(
  ({ grid, gridSize, showGridLines, canvasSize }, ref) => {
    const gridRef = useRef<string[][]>(grid);
    gridRef.current = grid;

    const [picture, setPicture] = useState<SkPicture>(() =>
      buildSkiaPicture(grid, gridSize, canvasSize, showGridLines)
    );

    const updatePicture = useCallback(
      (sourceGrid = gridRef.current) => {
        const nextPic = buildSkiaPicture(
          sourceGrid,
          gridSize,
          canvasSize,
          showGridLines
        );
        setPicture(nextPic);
      },
      [gridSize, canvasSize, showGridLines]
    );

    useEffect(() => {
      updatePicture(grid);
    }, [grid, updatePicture]);

    useImperativeHandle(ref, () => ({
      paintCell: (row: number, col: number, color: string) => {
        if (gridRef.current[row]) {
          gridRef.current[row][col] = color;
        }
        updatePicture();
      },
      redraw: (newGrid?: string[][]) => {
        if (newGrid) {
          gridRef.current = newGrid;
        }
        updatePicture(newGrid);
      },
    }));

    return (
      <View style={[styles.container, { width: canvasSize, height: canvasSize }]}>
        <Canvas style={{ width: canvasSize, height: canvasSize }}>
          <Picture picture={picture} />
        </Canvas>
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    backgroundColor: '#ffffff',
  },
});
