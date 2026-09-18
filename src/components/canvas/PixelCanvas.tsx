import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  GestureResponderEvent,
  LayoutChangeEvent,
  PanResponder,
  Platform,
  ScrollView,
  StyleSheet,
  useColorScheme,
  View,
} from 'react-native';
import {
  Button,
  Card,
  Paragraph,
  Separator,
  XStack,
  YStack,
} from 'tamagui';
import {
  Eraser,
  GridIcon,
  Paintbrush,
  PaintBucket,
  Pipette,
  RotateCcw,
  Trash2,
} from '../icons';
import { CanvasSurface } from './CanvasSurface';
import { CanvasSurfaceRef } from './CanvasSurface.types';
import { LoupeOverlay, LoupeOverlayRef } from './LoupeOverlay';

export type ToolType = 'pencil' | 'eraser' | 'bucket' | 'eyedropper';

export interface PixelCanvasProps {
  initialGrid?: string[][];
  size?: number; // 16 o 32
  onSave?: (grid: string[][]) => void;
  isSaving?: boolean;
}

const PALETTE = [
  '#000000', '#ffffff', '#e11d48', '#f43f5e', '#fb7185', '#fda4af',
  '#f97316', '#fbbf24', '#facc15', '#22c55e', '#10b981', '#06b6d4',
  '#0ea5e9', '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#ec4899',
  '#78716c', '#475569', '#1e293b', '#451a03', '#713f12', '#14532d',
];

const createEmptyGrid = (dim: number, defaultColor = '#ffffff'): string[][] => {
  return Array.from({ length: dim }, () => Array(dim).fill(defaultColor));
};

// Algoritmo de línea de Bresenham para trazos continuos sin huecos
function getLineCells(r0: number, c0: number, r1: number, c1: number): Array<{ row: number; col: number }> {
  const cells: Array<{ row: number; col: number }> = [];
  const dx = Math.abs(c1 - c0);
  const dy = Math.abs(r1 - r0);
  const sx = c0 < c1 ? 1 : -1;
  const sy = r0 < r1 ? 1 : -1;
  let err = dx - dy;

  let currC = c0;
  let currR = r0;

  while (true) {
    cells.push({ row: currR, col: currC });
    if (currR === r1 && currC === c1) break;
    const e2 = 2 * err;
    if (e2 > -dy) {
      err -= dy;
      currC += sx;
    }
    if (e2 < dx) {
      err += dx;
      currR += sy;
    }
  }

  return cells;
}

export const PixelCanvas: React.FC<PixelCanvasProps> = ({
  initialGrid,
  size = 32,
  onSave,
  isSaving = false,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [gridSize, setGridSize] = useState<number>(size);
  const [scrollEnabled, setScrollEnabled] = useState<boolean>(true);
  const [grid, setGrid] = useState<string[][]>(() => {
    if (initialGrid && initialGrid.length > 0) {
      return initialGrid;
    }
    return createEmptyGrid(size);
  });

  const [history, setHistory] = useState<string[][][]>([]);
  const [selectedColor, setSelectedColor] = useState<string>('#e11d48');
  const [activeTool, setActiveTool] = useState<ToolType>('pencil');
  const [showGridLines, setShowGridLines] = useState<boolean>(true);
  const [canvasSize, setCanvasSize] = useState<number>(340);

  // Refs síncronos para evitar cierres obsoletos y eliminar re-renders durante el dibujo
  const gridSizeRef = useRef<number>(size);
  const activeToolRef = useRef<ToolType>('pencil');
  const selectedColorRef = useRef<string>('#e11d48');
  const gridRef = useRef<string[][]>(grid);
  const isDrawingRef = useRef<boolean>(false);
  const lastDrawnCellRef = useRef<{ r: number; c: number } | null>(null);
  const strokeStartSnapshotRef = useRef<string[][] | null>(null);
  const strokeChangedRef = useRef<boolean>(false);

  // Refs a componentes aislados de alto rendimiento
  const surfaceRef = useRef<CanvasSurfaceRef | null>(null);
  const loupeRef = useRef<LoupeOverlayRef | null>(null);
  const containerRef = useRef<View>(null);

  const canvasLayoutRef = useRef<{ width: number; height: number; pageX: number; pageY: number }>({
    width: 340,
    height: 340,
    pageX: 0,
    pageY: 0,
  });

  // Sincronizar refs con el estado
  useEffect(() => {
    gridSizeRef.current = gridSize;
  }, [gridSize]);

  useEffect(() => {
    activeToolRef.current = activeTool;
  }, [activeTool]);

  useEffect(() => {
    selectedColorRef.current = selectedColor;
  }, [selectedColor]);

  const pushToHistory = useCallback((newGrid: string[][]) => {
    setHistory(prev => [...prev.slice(-15), newGrid]);
  }, []);

  const handleUndo = () => {
    if (history.length === 0) return;
    const previous = history[history.length - 1];
    setHistory(prev => prev.slice(0, -1));
    gridRef.current = previous;
    setGrid(previous);
    surfaceRef.current?.redraw(previous);
  };

  const handleClear = () => {
    pushToHistory(gridRef.current);
    const empty = createEmptyGrid(gridSizeRef.current);
    gridRef.current = empty;
    setGrid(empty);
    surfaceRef.current?.redraw(empty);
  };

  // Pintar celda individual de forma hiper-eficiente directamente en el Surface
  const paintPixel = (row: number, col: number) => {
    const curSize = gridSizeRef.current;
    if (row < 0 || row >= curSize || col < 0 || col >= curSize) return;

    const tool = activeToolRef.current;
    const colorToApply = tool === 'eraser' ? '#ffffff' : selectedColorRef.current;

    if (gridRef.current[row][col] === colorToApply) return;

    gridRef.current[row][col] = colorToApply;
    surfaceRef.current?.paintCell(row, col, colorToApply);
    strokeChangedRef.current = true;
  };

  // Algoritmo Flood Fill (Cubo de pintura)
  const floodFill = (startRow: number, startCol: number, fillColor: string) => {
    const curSize = gridSizeRef.current;
    const currentGrid = gridRef.current;
    const targetColor = currentGrid[startRow]?.[startCol];
    if (!targetColor || targetColor === fillColor) return;

    pushToHistory(currentGrid);
    const newGrid = currentGrid.map(row => [...row]);
    const queue: Array<[number, number]> = [[startRow, startCol]];
    const visited = new Uint8Array(curSize * curSize);

    while (queue.length > 0) {
      const [r, c] = queue.pop()!;
      const idx = r * curSize + c;
      if (visited[idx]) continue;
      visited[idx] = 1;

      if (r < 0 || r >= curSize || c < 0 || c >= curSize) continue;
      if (newGrid[r][c] !== targetColor) continue;

      newGrid[r][c] = fillColor;

      if (r + 1 < curSize && newGrid[r + 1][c] === targetColor) queue.push([r + 1, c]);
      if (r - 1 >= 0 && newGrid[r - 1][c] === targetColor) queue.push([r - 1, c]);
      if (c + 1 < curSize && newGrid[r][c + 1] === targetColor) queue.push([r, c + 1]);
      if (c - 1 >= 0 && newGrid[r][c - 1] === targetColor) queue.push([r, c - 1]);
    }

    gridRef.current = newGrid;
    setGrid(newGrid);
    surfaceRef.current?.redraw(newGrid);
  };

  // Conversión precisa de coordenadas táctiles a celda
  const getCoordsFromEvent = (evt: GestureResponderEvent) => {
    const curSize = gridSizeRef.current;
    const layout = canvasLayoutRef.current;
    const canvasWidth = layout.width > 0 ? layout.width : canvasSize;
    const canvasHeight = layout.height > 0 ? layout.height : canvasSize;

    let x = evt.nativeEvent.locationX;
    let y = evt.nativeEvent.locationY;

    if (typeof x !== 'number' || isNaN(x)) {
      x = evt.nativeEvent.pageX - layout.pageX;
      y = evt.nativeEvent.pageY - layout.pageY;
    }

    x = Math.max(0, Math.min(canvasWidth - 0.001, x));
    y = Math.max(0, Math.min(canvasHeight - 0.001, y));

    const col = Math.floor((x / canvasWidth) * curSize);
    const row = Math.floor((y / canvasHeight) * curSize);

    return {
      row: Math.max(0, Math.min(curSize - 1, row)),
      col: Math.max(0, Math.min(curSize - 1, col)),
      x,
      y,
      canvasWidth,
      canvasHeight,
    };
  };

  // PanResponder fluido con soporte de lupa y dibujo continuo sin re-renderizar PixelCanvas
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponderCapture: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (evt: GestureResponderEvent) => {
        setScrollEnabled(false);
        isDrawingRef.current = true;
        strokeChangedRef.current = false;
        strokeStartSnapshotRef.current = gridRef.current.map(r => [...r]);

        const pt = getCoordsFromEvent(evt);
        const curTool = activeToolRef.current;

        if (curTool === 'eyedropper') {
          const picked = gridRef.current[pt.row]?.[pt.col] || '#ffffff';
          setSelectedColor(picked);
          selectedColorRef.current = picked;
        } else if (curTool === 'bucket') {
          floodFill(pt.row, pt.col, selectedColorRef.current);
        } else {
          lastDrawnCellRef.current = { r: pt.row, c: pt.col };
          paintPixel(pt.row, pt.col);
        }

        // Mostrar lupa de manera aislada sin re-renderizar todo el árbol
        loupeRef.current?.show({
          x: pt.x,
          y: pt.y,
          row: pt.row,
          col: pt.col,
          activeColor: selectedColorRef.current,
          isEraser: curTool === 'eraser',
        });
      },
      onPanResponderMove: (evt: GestureResponderEvent) => {
        if (!isDrawingRef.current) return;
        const pt = getCoordsFromEvent(evt);
        const curTool = activeToolRef.current;

        if (curTool === 'eyedropper') {
          const picked = gridRef.current[pt.row]?.[pt.col] || '#ffffff';
          setSelectedColor(picked);
          selectedColorRef.current = picked;
        } else if (curTool === 'pencil' || curTool === 'eraser') {
          if (lastDrawnCellRef.current) {
            const line = getLineCells(
              lastDrawnCellRef.current.r,
              lastDrawnCellRef.current.c,
              pt.row,
              pt.col
            );
            for (const cell of line) {
              paintPixel(cell.row, cell.col);
            }
          } else {
            paintPixel(pt.row, pt.col);
          }
          lastDrawnCellRef.current = { r: pt.row, c: pt.col };
        }

        // Actualizar lupa aislada
        loupeRef.current?.update({
          x: pt.x,
          y: pt.y,
          row: pt.row,
          col: pt.col,
          activeColor: selectedColorRef.current,
          isEraser: curTool === 'eraser',
        });
      },
      onPanResponderRelease: () => {
        isDrawingRef.current = false;
        lastDrawnCellRef.current = null;
        setScrollEnabled(true);
        loupeRef.current?.hide();

        if (activeToolRef.current === 'eyedropper') {
          setActiveTool('pencil');
          activeToolRef.current = 'pencil';
        }

        // Guardar snapshot en historial si hubo modificaciones
        if (strokeChangedRef.current && strokeStartSnapshotRef.current) {
          pushToHistory(strokeStartSnapshotRef.current);
          setGrid([...gridRef.current]);
        }
      },
      onPanResponderTerminate: () => {
        isDrawingRef.current = false;
        lastDrawnCellRef.current = null;
        setScrollEnabled(true);
        loupeRef.current?.hide();
      },
    })
  ).current;

  const handleLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    const computedSize = Math.round(width);
    if (computedSize > 0 && Math.abs(computedSize - canvasSize) > 2) {
      setCanvasSize(computedSize);
    }

    if (containerRef.current) {
      containerRef.current.measure((_x, _y, w, h, pageX, pageY) => {
        canvasLayoutRef.current = {
          width: w || width || computedSize,
          height: h || height || computedSize,
          pageX: pageX || 0,
          pageY: pageY || 0,
        };
      });
    }
  };

  const handleResize = (newSize: number) => {
    if (newSize === gridSize) return;
    gridSizeRef.current = newSize;
    setGridSize(newSize);
    setHistory([]);
    const newGrid = createEmptyGrid(newSize);
    gridRef.current = newGrid;
    setGrid(newGrid);
    surfaceRef.current?.redraw(newGrid);
  };

  return (
    <ScrollView
      scrollEnabled={scrollEnabled}
      contentContainerStyle={styles.scrollContainer}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <YStack gap="$3" width="100%" maxWidth={500} alignSelf="center">
        {/* Barra de herramientas superior */}
        <XStack justifyContent="space-between" alignItems="center" flexWrap="wrap" gap="$2">
          <XStack gap="$1" backgroundColor="$backgroundHover" padding="$1.5" borderRadius="$4">
            <Button
              size="$3"
              theme={activeTool === 'pencil' ? 'active' : undefined}
              chromeless={activeTool !== 'pencil'}
              icon={<Paintbrush size={18} />}
              onPress={() => setActiveTool('pencil')}
              accessibilitylabel="Pincel"
            />
            <Button
              size="$3"
              theme={activeTool === 'eraser' ? 'active' : undefined}
              chromeless={activeTool !== 'eraser'}
              icon={<Eraser size={18} />}
              onPress={() => setActiveTool('eraser')}
              accessibilitylabel="Borrador"
            />
            <Button
              size="$3"
              theme={activeTool === 'bucket' ? 'active' : undefined}
              chromeless={activeTool !== 'bucket'}
              icon={<PaintBucket size={18} />}
              onPress={() => setActiveTool('bucket')}
              accessibilitylabel="Bote de pintura"
            />
            <Button
              size="$3"
              theme={activeTool === 'eyedropper' ? 'active' : undefined}
              chromeless={activeTool !== 'eyedropper'}
              icon={<Pipette size={18} />}
              onPress={() => setActiveTool('eyedropper')}
              accessibilitylabel="Cuentagotas"
            />
          </XStack>

          <XStack gap="$1">
            <Button
              size="$3"
              chromeless
              icon={<RotateCcw size={18} />}
              disabled={history.length === 0}
              opacity={history.length === 0 ? 0.4 : 1}
              onPress={handleUndo}
              accessibilitylabel="Deshacer"
            />
            <Button
              size="$3"
              chromeless
              icon={<GridIcon size={18} />}
              theme={showGridLines ? 'active' : undefined}
              onPress={() => setShowGridLines(!showGridLines)}
              accessibilitylabel="Rejilla"
            />
            <Button
              size="$3"
              chromeless
              icon={<Trash2 size={18} color="#f43f5e" />}
              theme="red"
              onPress={handleClear}
              accessibilitylabel="Limpiar"
            />
          </XStack>
        </XStack>

        {/* Selector de tamaño del lienzo */}
        <XStack justifyContent="center" gap="$2">
          <Button
            size="$2"
            theme={gridSize === 16 ? 'active' : undefined}
            onPress={() => handleResize(16)}
          >
            16x16
          </Button>
          <Button
            size="$2"
            theme={gridSize === 32 ? 'active' : undefined}
            onPress={() => handleResize(32)}
          >
            32x32
          </Button>
        </XStack>

        {/* Contenedor del Lienzo Pixel Art de Alto Rendimiento */}
        <Card
          borderWidth={1}
          borderColor="$borderColor"
          padding="$2"
          borderRadius="$4"
          alignItems="center"
          justifyContent="center"
          backgroundColor="#1e1e24"
          style={{ position: 'relative' }}
        >
          <View
            ref={containerRef}
            onLayout={handleLayout}
            style={[
              styles.canvas,
              {
                aspectRatio: 1,
                width: '100%',
                maxWidth: 360,
              },
            ]}
            {...panResponder.panHandlers}
          >
            {/* Superficie Canvas acelerada por hardware (Skia en móvil / HTML5 Canvas en web) */}
            <CanvasSurface
              ref={surfaceRef}
              grid={grid}
              gridSize={gridSize}
              showGridLines={showGridLines}
              canvasSize={canvasSize}
            />

            {/* Lupa aislada sobre el dedo que NO provoca re-renderizados en PixelCanvas */}
            <LoupeOverlay
              ref={loupeRef}
              gridRef={gridRef}
              gridSizeRef={gridSizeRef}
              canvasWidth={canvasSize}
              canvasHeight={canvasSize}
            />
          </View>
        </Card>

        {/* Paleta de colores */}
        <YStack gap="$2">
          <XStack alignItems="center" justifyContent="space-between">
            <Paragraph size="$2" color="$colorFocus">Paleta de Colores</Paragraph>
            <XStack alignItems="center" gap="$2">
              <Paragraph size="$2">Actual:</Paragraph>
              <View
                style={[
                  styles.colorPreview,
                  { backgroundColor: selectedColor },
                ]}
              />
            </XStack>
          </XStack>

          <XStack flexWrap="wrap" gap="$1.5" justifyContent="center">
            {PALETTE.map((color) => {
              const isSelected = selectedColor === color;
              const isDarkColor =
                color === '#000000' ||
                color === '#1e293b' ||
                color === '#451a03' ||
                color === '#14532d' ||
                color === '#713f12';
              const isLightColor = color === '#ffffff';

              const swatchBorder = isSelected
                ? '#e11d48'
                : isDark && isDarkColor
                ? 'rgba(255, 255, 255, 0.35)'
                : !isDark && isLightColor
                ? 'rgba(0, 0, 0, 0.3)'
                : 'rgba(0, 0, 0, 0.12)';

              return (
                <Button
                  key={color}
                  size="$2"
                  circular
                  backgroundColor={color}
                  borderWidth={isSelected ? 3 : 1}
                  borderColor={swatchBorder}
                  scale={isSelected ? 1.15 : 1}
                  pressStyle={{ opacity: 0.85 }}
                  onPress={() => {
                    setSelectedColor(color);
                    if (activeTool === 'eraser') setActiveTool('pencil');
                  }}
                  accessibilitylabel={`Color ${color}`}
                />
              );
            })}
          </XStack>
        </YStack>

        <Separator marginVertical="$1" />

        {/* Botón de Enviar / Guardar */}
        {onSave && (
          <Button
            size="$4"
            theme="active"
            disabled={isSaving}
            onPress={() => onSave(gridRef.current)}
            backgroundColor="#e11d48"
            color="white"
            pressStyle={{ opacity: 0.8 }}
          >
            {isSaving ? 'Enviando a tu pareja...' : 'Enviar Dibujo'}
          </Button>
        )}
      </YStack>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  canvas: {
    backgroundColor: '#ffffff',
    overflow: 'hidden',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333333',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    ...(Platform.OS === 'web'
      ? ({
          touchAction: 'none',
          userSelect: 'none',
          cursor: 'crosshair',
        } as any)
      : {}),
  },
  colorPreview: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#888',
  },
});
