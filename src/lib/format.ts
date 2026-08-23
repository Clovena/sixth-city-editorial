/**
 * Shared, pure formatting helpers with no data dependency.
 */

const ROMAN_VALUES = [1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1];
const ROMAN_SYMBOLS = ['M', 'CM', 'D', 'CD', 'C', 'XC', 'L', 'XL', 'X', 'IX', 'V', 'IV', 'I'];

/** Converts a positive integer to a Roman numeral (e.g. `toRoman(6)` → `'VI'`). */
export function toRoman(n: number): string {
  let remaining = n;
  let result = '';
  for (let i = 0; i < ROMAN_VALUES.length; i++) {
    while (remaining >= ROMAN_VALUES[i]) {
      result += ROMAN_SYMBOLS[i];
      remaining -= ROMAN_VALUES[i];
    }
  }
  return result;
}

/** Ordinal suffix for a positive integer (e.g. `ordinal(3)` → `'3rd'`). */
export function ordinal(n: number): string {
  const suffix = n % 10 === 1 && n % 100 !== 11 ? 'st'
    : n % 10 === 2 && n % 100 !== 12 ? 'nd'
    : n % 10 === 3 && n % 100 !== 13 ? 'rd'
    : 'th';
  return `${n}${suffix}`;
}

/** Zero-pads a number to two digits (week numbers, etc.). */
export function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

/** Draft pick label as `round.slot`, slot derived from an overall pick number in a 14-team league. */
export function draftPickLabel(round: number, pickNo: number): string {
  return `${round}.${pad2(((pickNo - 1) % 14) + 1)}`;
}

/** Null-safe fixed-point score/points display; renders missing values as an em dash. */
export function formatPoints(n: number | null | undefined): string {
  return n === null || n === undefined ? '—' : n.toFixed(2);
}

/** Joins a player's first/last name, dropping whichever half is missing; falls back if both are absent. */
export function playerName(
  first: string | null | undefined,
  last: string | null | undefined,
  fallback: string,
): string {
  const parts = [first, last].filter(Boolean);
  return parts.length ? parts.join(' ') : fallback;
}

/** Sleeper timestamps are unix ms — render one as `Sep 14, 2021`. */
export function formatTimestamp(ms: number | string | null | undefined): string {
  if (ms === null || ms === undefined) return '—';
  const date = new Date(Number(ms));
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/** ESPN headshot URL for a player, or the site placeholder image if no ESPN id is known. */
export function espnHeadshotUrl(espnId: string | null | undefined): string {
  return espnId
    ? `https://a.espncdn.com/i/headshots/nfl/players/full/${espnId}.png`
    : '/images/player-placeholder.png';
}

/**
 * Franchise logo path — logos live in public/images/logos/, filenamed by abbr.
 *
 * Lives here (not franchise-identity.ts) because remark-team-headers.ts runs
 * inside astro.config.mjs's evaluation context, before Vite env vars are
 * available — importing anything that transitively pulls in lib/supabase.ts
 * there crashes the config load. format.ts has no such dependency.
 */
export function logoPath(abbr: string): string {
  return `/images/logos/${abbr}.png`;
}

/** A franchise's primary accent color, with a design-system border color as the fallback. */
export function primaryColor(
  colors: string[] | null | undefined,
  fallback = 'var(--border-default)',
): string {
  return colors?.[0] ?? fallback;
}
