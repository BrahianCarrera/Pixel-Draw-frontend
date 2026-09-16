import React, { useRef, useEffect, useImperativeHandle, forwardRef, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { CanvasSurfaceProps, CanvasSurfaceRef } from './CanvasSurface.types';

export const CanvasSurface = forwardRef<CanvasSurfaceRef, CanvasSurfaceProps>(
  ({ grid, gridSize, showGridLines, canvasSize }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const gridRef = useRef<string[][]>(grid);
    gridRef.current = grid;

    const renderCanvas = useCallback(
      (sourceGrid = gridRef.current) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Soporte de retina / DPR para máxima nitidez
        const dpr = window.devicePixelRatio || 1;
        if (canvas.width !== canvasSize * dpr || canvas.height !== canvasSize * dpr) {
          canvas.width = canvasSize * dpr;
          canvas.height = canvasSize * dpr;
        }

        ctx.save();
        ctx.scale(dpr, dpr);
        ctx.imageSmoothingEnabled = false;

        // Fondo blanco
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvasSize, canvasSize);

        const cellW = canvasSize / gridSize;
        const cellH = canvasSize / gridSize;

        // 1. Dibujar píxeles no blancos
        for (let r = 0; r < gridSize; r++) {
          const row = sourceGrid[r];
          if (!row) continue;
          for (let c = 0; c < gridSize; c++) {
            const color = row[c];
            if (color && color.toLowerCase() !== '#ffffff') {
              ctx.fillStyle = color;
              ctx.fillRect(c * cellW, r * cellH, cellW, cellH);
            }
          }
        }

        // 2. Dibujar líneas de rejilla precisas (un trazo vectorial continuo sin cortes)
        if (showGridLines) {
          ctx.strokeStyle = 'rgba(128, 128, 128, 0.28)';
          ctx.lineWidth = 1;
          ctx.beginPath();

          for (let i = 1; i < gridSize; i++) {
            // Alinear al centro del píxel para trazos de 1px nítidos
            const x = Math.round(i * cellW) - 0.5;
            const y = Math.round(i * cellH) - 0.5;

            // Línea vertical
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvasSize);

            // Línea horizontal
            ctx.moveTo(0, y);
            ctx.lineTo(canvasSize, y);
          }

          ctx.stroke();
        }

        ctx.restore();
      },
      [canvasSize, gridSize, showGridLines]
    );

    useEffect(() => {
      renderCanvas();
    }, [renderCanvas]);

    useImperativeHandle(ref, () => ({
      paintCell: (row: number, col: number, color: string) => {
        if (gridRef.current[row]) {
          gridRef.current[row][col] = color;
        }
        renderCanvas();
      },
      redraw: (newGrid?: string[][]) => {
        if (newGrid) {
          gridRef.current = newGrid;
        }
        renderCanvas();
      },
    }));

    return (
      <View style={[styles.container, { width: canvasSize, height: canvasSize }]}>
        <canvas
          ref={canvasRef as any}
          style={{
            width: canvasSize,
            height: canvasSize,
            display: 'block',
            imageRendering: 'pixelated',
          }}
        />
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
