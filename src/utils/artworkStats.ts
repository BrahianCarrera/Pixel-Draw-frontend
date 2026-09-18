/**
 * Pure utilities derived from an Artwork's grid.
 * No imports from React so they can be used anywhere safely.
 */

// ── Dominant color palette ────────────────────────────────────────────────────

const TRANSPARENT_VALUES = new Set(['', 'transparent', '#ffffff', '#fff', 'white']);

/**
 * Returns up to `maxColors` most-used non-white/transparent colors in the grid.
 * Fast bucket count, O(rows × cols).
 */
export function getDominantColors(grid: string[][], maxColors = 5): string[] {
  const counts: Record<string, number> = {};

  for (const row of grid) {
    for (const cell of row) {
      const c = cell?.toLowerCase().trim() ?? '';
      if (!c || TRANSPARENT_VALUES.has(c)) continue;
      counts[c] = (counts[c] ?? 0) + 1;
    }
  }

  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxColors)
    .map(([color]) => color);
}

// ── Fill ratio ────────────────────────────────────────────────────────────────

/**
 * Returns 0–100 representing how many cells are filled (non-white / non-transparent).
 */
export function getFillPercent(grid: string[][]): number {
  if (!grid.length || !grid[0]?.length) return 0;
  let filled = 0;
  let total = 0;
  for (const row of grid) {
    for (const cell of row) {
      total++;
      const c = cell?.toLowerCase().trim() ?? '';
      if (c && !TRANSPARENT_VALUES.has(c)) filled++;
    }
  }
  return total === 0 ? 0 : Math.round((filled / total) * 100);
}

// ── Time-ago ─────────────────────────────────────────────────────────────────

const MINUTE = 60_000;
const HOUR   = 60 * MINUTE;
const DAY    = 24 * HOUR;

/**
 * Returns a short Spanish relative-time string.
 * Examples: "Ahora", "Hace 3h", "Ayer", "Hace 5 días", "16 sep"
 */
export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();

  if (diff < 2 * MINUTE)  return 'Ahora';
  if (diff < HOUR)        return `Hace ${Math.floor(diff / MINUTE)}min`;
  if (diff < 2 * HOUR)   return 'Hace 1h';
  if (diff < DAY)         return `Hace ${Math.floor(diff / HOUR)}h`;
  if (diff < 2 * DAY)    return 'Ayer';
  if (diff < 7 * DAY)    return `Hace ${Math.floor(diff / DAY)} días`;

  return new Date(iso).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}

/**
 * True if the artwork was created less than 24 hours ago.
 */
export function isNew(iso: string): boolean {
  return Date.now() - new Date(iso).getTime() < DAY;
}
