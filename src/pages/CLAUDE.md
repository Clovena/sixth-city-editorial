# CLAUDE.md — Pages (`src/pages/`)

---

## Mobile Responsive Strategy

Breakpoint: `@media (max-width: 768px)`. All mobile overrides use scoped `<style>` blocks at the bottom of each page file (Astro scoped styles apply to class names defined in the same component).

### General patterns applied across pages
- Multi-column grids collapse to `1fr` via `!important` (necessary to override inline styles)
- Elements hidden on mobile use `display: none !important`
- Sidebar/secondary columns move below main content rather than disappearing
- Dynamic border colors are encoded as CSS custom properties on the element (e.g. `--team-b-color: ${teamB?.colors[0]}`) so they can be switched sides (`border-right` → `border-left`) from scoped CSS

---

## Per-Page Mobile Notes

### `index.astro`
- Header nav collapses to hamburger (handled globally in `Layout.astro`)
- Quick Stats: 2×2 grid
- Dynasty Bowl loser div hidden
- Bottom nav links stack vertically
- Footer nav hidden

### `history/index.astro`
- Season Results table hides all columns except Season and Champion; adds a "See more →" column
- Playoff Format grid stacks vertically

### `history/[year].astro`
- Final Standings grid goes vertical (HCC below SCC, each full width)
- Playoff bracket `bracket-wrap` goes vertical
- **Playoff bracket interaction**: All matchup elements are clickable links to game recaps. Each matchup wraps in an `<a href="/games/{year}/{slug}">` tag where slug is built using `buildSlug(teamA, teamB, week)`:
  - Round 1: week 15
  - Semifinals: week 16
  - Championship: week 17
  - Teams in slug are alphabetized and lowercased (e.g., `15-bkb-low`)
  - Matchups without both teams (byes, incomplete) skip the link wrapper
- Text above bracket changed from "{teamCount}-team field • ..." to "Click a matchup for more details →"

### `franchises/[abbr].astro`
- Sidebar moves below Main column at full width
- Season Record table hides PF and PA columns
- All content constrained to screen width (no x-axis overflow)

### `spotlight-games/index.astro`
- `explain-grid`: 2-col info cards stack to 1 column
- `bowl-card`: outer grid collapses to 1 column; `.bowl-teams-inner` switches from `flex-direction: column` to `row`; `.bowl-team-a` gets `flex-direction: row-reverse` so the layout reads badge | logo | name ↔ vs. ↔ name | logo | badge (badges outside, names inside, logos between)
- `.bowl-team-name` spans hidden on mobile to save space

### `spotlight-games/[slug].astro`
- Fetches historical matchup data via `getHistoricalMatchups(teamA, teamB)` which scans all `/data/raw/*-matchups.json` files to find instances where both teams played in the same week with matching `matchup_id`
- Historical Results table displays: Year | Week | Team A | Score A | Score B | Team B with winner highlighted in gold, loser muted
- Score boxes and column widths use `min-width` to ensure consistent vertical alignment across all matchup rows
- `.matchup-card-grid`: 3-col (A | vs | B) collapses to single column; Team B's color border swaps from right to left via `--team-b-color` CSS variable
- `.matchup-desc-grid`: "About This Matchup" + "Historical Results" stack vertically

### `games/[year]/[slug].astro`
- `.lineup-grid`: 2-col side-by-side roster view collapses to 1 column
- CSS `order` property resequences grid items so all Team A rows render first, then Team B header (`order: 50`), then all Team B rows (`order: 51`)
- `.lineup-row-b` gets `flex-direction: row` on mobile (was `row-reverse` on desktop) so element order matches Team A: pos | thumb | name | score
- Team A `border-right` removed (no adjacent column on mobile)

### `hall-of-fame/index.astro`
- Hero is a `data-theme="ink"` broadcast band (dark section on the cream page) — it re-scopes the colour tokens, so any child must use semantic tokens, not hardcoded light values
- `wing-grid`: 2-2-1 layout via `grid-template-columns: 1fr 1fr` with the fifth tile taking `grid-column: 1 / -1`. On mobile it goes single column and the fifth tile's span is reset with `grid-column: auto !important`
- The locked "Hall of Famers" tile is still a working link (the page has explainer content) — it is only styled as anticipated: sunken surface, muted ink, "Not Yet Open" badge
- `recent-grid` collapses to one column

### `hall-of-fame/champions.astro`
- `.podium` is a 3-column grid rendered silver | gold | bronze so the champion sits centred; differing top/bottom padding per tier builds the podium silhouette
- On mobile the grid collapses to 1 column and `--stack-order` (set inline per tier) drives CSS `order` so the champion leads
- `season-card-foot` (conference titles + consolation) collapses to 1 column
- Logos use the **era** abbr (`entry.abbr`); links use the **active** abbr (`entry.activeAbbr`)

### `hall-of-fame/superlatives.astro`
- `award-grid` is `auto-fill, minmax(320px, 1fr)` → 1 column on mobile
- `trade-sides` uses `grid-template-columns: repeat(var(--side-count), 1fr)` so a three-team trade renders three columns; collapses to 1 column on mobile
- Repeat winners get an ember left spine (`.timeline-row.is-repeat`) so a run of the same name reads at a glance

### `hall-of-fame/medals.astro`
- Sortable leaderboard. The inline `<script>` sorts `<tbody>` rows in place off `data-*` attributes and renumbers `.rank-cell` — the markup stays the only copy of the data, no JSON blob is shipped
- All columns except rank, player, and medals are `col-hide-mobile`

### `hall-of-fame/records.astro`
- Rows are clickable to `/games/[year]/[slug]` via `onclick`; the player-name link inside calls `event.stopPropagation()` so it wins over the row handler
- All columns except rank, score, and the subject are `col-hide-mobile`, and the wrapper drops `overflow-x` on mobile

### `hall-of-fame/inductees.astro`
- Placeholder wing. Season numbering is derived (`SEASON_ONE_YEAR = 2021`), and "complete" is judged by a played Week 17 `game_type = 1` matchup, not by a `seasons` row existing
- The gallery preview is `aria-hidden` and deliberately inert — dashed plaques showing the future grid shape

### `players/[id].astro`
- **Only on-demand (SSR) route on the site** — `export const prerender = false`, no `getStaticPaths`. Data is fetched per request, so independent Supabase queries are batched in one `Promise.all` and only the roster→franchise and draft→drafts→drafter chains stay sequential. Adding a serial `await` here costs every visitor, not the build.
- Page wrapper (`player-page-wrap`) constrains to screen width with `overflow-x: hidden` and tighter padding
- Hero section reduces padding/margin
- Layout grid (`player-layout-grid`) stacks to single column; sidebar moves below stats
- Bio grid collapses from 3 to 2 columns
- Stats table: all position-specific stat columns hidden via `col-hide-mobile` class; only Year, GS, and FPTS remain
- Stats table wrapper switches from `overflow-x: auto` to `hidden` (no horizontal scroll needed with reduced columns)
