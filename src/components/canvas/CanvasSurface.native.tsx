import React, {
  useRef,
  useState,
  useEffect,
  useImperativeHandle,
  forwardRef,
  useCallback,
  useMemo,
} from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Rect, Line } from 'react-native-svg';
import { CanvasSurfaceProps, CanvasSurfaceRef } from './CanvasSurface.types';

let Skia: any = null;
let Canvas: any = null;
let Picture: any = null;
let PaintStyle: any = null;

try {
  // Dynamically resolve Skia if available in native runtime
  const skiaModule = require('@shopify/react-native-skia');
  Skia = skiaModule.Skia;
  Canvas = skiaModule.Canvas;
  Picture = skiaModule.Picture;
  PaintStyle = skiaModule.PaintStyle;
} catch {
  // Graceful fallback to react-native-svg for Expo Go / Expo Snack
}

function buildSkiaPicture(
  grid: string[][],
  gridSize: number,
  canvasSize: number,
  showGridLines: boolean
) {
  if (!Skia) return null;
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

  // 3. Dibujar rejilla vectorial
  if (showGridLines) {
    paint.setStyle(PaintStyle.Stroke);
    paint.setStrokeWidth(1);
    paint.setColor(Skia.Color('rgba(128, 128, 128, 0.28)'));

    for (let i = 1; i < gridSize; i++) {
      const x = Math.round(i * cellW);
      const y = Math.round(i * cellH);
      canvas.drawLine(x, 0, x, canvasSize, paint);
      canvas.drawLine(0, y, canvasSize, y, paint);
    }
  }

  return recorder.finishRecordingAsPicture();
}

export const CanvasSurface = forwardRef<CanvasSurfaceRef, CanvasSurfaceProps>(
  ({ grid, gridSize, showGridLines, canvasSize }, ref) => {
    const gridRef = useRef<string[][]>(grid);
    gridRef.current = grid;

    const [currentGrid, setCurrentGrid] = useState<string[][]>(grid);
    const [picture, setPicture] = useState<any>(() =>
      buildSkiaPicture(grid, gridSize, canvasSize, showGridLines)
    );

    const updateSurface = useCallback(
      (sourceGrid = gridRef.current) => {
        if (Skia && Canvas && Picture) {
          const nextPic = buildSkiaPicture(
            sourceGrid,
            gridSize,
            canvasSize,
            showGridLines
          );
          setPicture(nextPic);
        } else {
          setCurrentGrid(sourceGrid.map((row) => [...row]));
        }
      },
      [gridSize, canvasSize, showGridLines]
    );

    useEffect(() => {
      updateSurface(grid);
    }, [grid, updateSurface]);

    useImperativeHandle(ref, () => ({
      paintCell: (row: number, col: number, color: string) => {
        if (gridRef.current[row]) {
          gridRef.current[row][col] = color;
        }
        updateSurface();
      },
      redraw: (newGrid?: string[][]) => {
        if (newGrid) {
          gridRef.current = newGrid;
        }
        updateSurface(newGrid);
      },
    }));

    const cellW = canvasSize / gridSize;
    const cellH = canvasSize / gridSize;

    const gridLines = useMemo(() => {
      if (!showGridLines) return [];
      const lines = [];
      for (let i = 1; i < gridSize; i++) {
        const x = Math.round(i * cellW);
        const y = Math.round(i * cellH);
        lines.push(
          <Line
            key={`vl-${i}`}
            x1={x}
            y1={0}
            x2={x}
            y2={canvasSize}
            stroke="rgba(128, 128, 128, 0.28)"
            strokeWidth={1}
          />
        );
        lines.push(
          <Line
            key={`hl-${i}`}
            x1={0}
            y1={y}
            x2={canvasSize}
            y2={y}
            stroke="rgba(128, 128, 128, 0.28)"
            strokeWidth={1}
          />
        );
      }
      return lines;
    }, [showGridLines, gridSize, cellW, cellH, canvasSize]);

    if (Skia && Canvas && Picture && picture) {
      return (
        <View style={[styles.container, { width: canvasSize, height: canvasSize }]}>
          <Canvas style={{ width: canvasSize, height: canvasSize }}>
            <Picture picture={picture} />
          </Canvas>
        </View>
      );
    }

    // Fallback SVG render for Expo Go / Expo Snack
    return (
      <View style={[styles.container, { width: canvasSize, height: canvasSize }]}>
        <Svg width={canvasSize} height={canvasSize}>
          <Rect width={canvasSize} height={canvasSize} fill="#ffffff" />
          {currentGrid.map((row, r) =>
            row.map((color, c) => {
              if (!color || color.toLowerCase() === '#ffffff') return null;
              return (
                <Rect
                  key={`cell-${r}-${c}`}
                  x={c * cellW}
                  y={r * cellH}
                  width={cellW + 0.5}
                  height={cellH + 0.5}
                  fill={color}
                />
              );
            })
          )}
          {gridLines}
        </Svg>
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
