import React, { createContext, useContext, useMemo, useState } from 'react';

export interface DemoAuthor {
  id: number;
  username: string;
}

export interface DemoArtwork {
  id: number;
  name: string;
  width: number;
  height: number;
  grid: string[][];
  authorId: number;
  author: DemoAuthor;
  createdAt: string;
}

interface DemoArtworkContextType {
  artworks: DemoArtwork[];
  latestArtwork: DemoArtwork | null;
  saveArtwork: (name: string, grid: string[][]) => DemoArtwork;
  resetDemo: () => void;
}

const demoAuthor: DemoAuthor = {
  id: 1,
  username: 'portfolio_demo',
};

const partnerAuthor: DemoAuthor = {
  id: 2,
  username: 'pixel_muse',
};

const createGrid = (size: number, paint: (row: number, col: number) => string | null) =>
  Array.from({ length: size }, (_row, row) =>
    Array.from({ length: size }, (_col, col) => paint(row, col) || '#ffffff')
  );

const sampleHeartGrid = createGrid(16, (row, col) => {
  const heart = [
    [2, 3], [2, 4], [2, 11], [2, 12],
    [3, 2], [3, 3], [3, 4], [3, 5], [3, 10], [3, 11], [3, 12], [3, 13],
    [4, 1], [4, 2], [4, 3], [4, 4], [4, 5], [4, 6], [4, 9], [4, 10], [4, 11], [4, 12], [4, 13], [4, 14],
    [5, 1], [5, 2], [5, 3], [5, 4], [5, 5], [5, 6], [5, 7], [5, 8], [5, 9], [5, 10], [5, 11], [5, 12], [5, 13], [5, 14],
    [6, 2], [6, 3], [6, 4], [6, 5], [6, 6], [6, 7], [6, 8], [6, 9], [6, 10], [6, 11], [6, 12], [6, 13],
    [7, 3], [7, 4], [7, 5], [7, 6], [7, 7], [7, 8], [7, 9], [7, 10], [7, 11], [7, 12],
    [8, 4], [8, 5], [8, 6], [8, 7], [8, 8], [8, 9], [8, 10], [8, 11],
    [9, 5], [9, 6], [9, 7], [9, 8], [9, 9], [9, 10],
    [10, 6], [10, 7], [10, 8], [10, 9],
    [11, 7], [11, 8],
  ];
  return heart.some(([r, c]) => r === row && c === col) ? '#e11d48' : null;
});

const sampleSparkGrid = createGrid(16, (row, col) => {
  if (row === col || row + col === 15) return '#facc15';
  if ((row === 7 || row === 8 || col === 7 || col === 8) && row > 3 && row < 12 && col > 3 && col < 12) {
    return '#fb7185';
  }
  if ((row === 1 && col === 14) || (row === 14 && col === 1) || (row === 3 && col === 4)) return '#06b6d4';
  return null;
});

const initialArtworks: DemoArtwork[] = [
  {
    id: 2,
    name: 'Destello de bienvenida',
    width: 16,
    height: 16,
    grid: sampleSparkGrid,
    authorId: partnerAuthor.id,
    author: partnerAuthor,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
  },
  {
    id: 1,
    name: 'Corazon pixelado',
    width: 16,
    height: 16,
    grid: sampleHeartGrid,
    authorId: demoAuthor.id,
    author: demoAuthor,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 28).toISOString(),
  },
];

const DemoArtworkContext = createContext<DemoArtworkContextType | undefined>(undefined);

export const DemoArtworkProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [artworks, setArtworks] = useState<DemoArtwork[]>(initialArtworks);

  const value = useMemo<DemoArtworkContextType>(
    () => ({
      artworks,
      latestArtwork: artworks[0] || null,
      saveArtwork: (name, grid) => {
        const artwork: DemoArtwork = {
          id: Date.now(),
          name: name.trim() || 'Dibujo de portfolio',
          width: grid.length,
          height: grid[0]?.length || grid.length,
          grid: grid.map((row) => [...row]),
          authorId: demoAuthor.id,
          author: demoAuthor,
          createdAt: new Date().toISOString(),
        };
        setArtworks((current) => [artwork, ...current]);
        return artwork;
      },
      resetDemo: () => setArtworks(initialArtworks),
    }),
    [artworks]
  );

  return <DemoArtworkContext.Provider value={value}>{children}</DemoArtworkContext.Provider>;
};

export const useDemoArtworks = () => {
  const context = useContext(DemoArtworkContext);
  if (!context) {
    throw new Error('useDemoArtworks debe usarse dentro de DemoArtworkProvider');
  }
  return context;
};
