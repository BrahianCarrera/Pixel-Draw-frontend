export interface CanvasSurfaceProps {
  grid: string[][];
  gridSize: number;
  showGridLines: boolean;
  canvasSize: number;
}

export interface CanvasSurfaceRef {
  paintCell: (row: number, col: number, color: string) => void;
  redraw: (newGrid?: string[][]) => void;
}
