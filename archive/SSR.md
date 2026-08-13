# Handoff: Migrate Player Pages to On-Demand (SSR) Rendering

## Context

Repo: `github.com/Clovena/sixth-city-dynasty` (branch: `dev`)
Stack: Astro 5 + Tailwind CSS 4 + Supabase (schema `scdfl`) + Netlify

The site is built with Astro's static site generation (SSG) — at `npm run build`,
every route is pre-rendered to plain HTML. This works well for pages that are few
in number and change rarely (franchise pages, history, scores). It has broken down
for one route:

**`src/pages/players/[id].astro`** uses `getStaticPaths()` to pre-render one HTML
page per player returned by the `scdfl.get_started_player_ids()` RPC. Each of those
pages fires ~8 sequential Supabase queries at build time. The combination of
(row count × serial per-page query chains) has pushed the Netlify build past 15
minutes.

## Goal

Convert `src/pages/players/[id].astro` from a static (SSG) route to an on-demand
(SSR) route, so player pages render per-request instead of at build time. All other
routes (franchises, history, scores, spotlight games, game recaps, etc.) **stay
static** — this is a targeted, single-route change, not a site-wide rendering
migration.

## Required changes

### 1. Add the Netlify adapter (if not already present)

Check `package.json` / `astro.config.mjs` first — if `@astrojs/netlify` is already
a dependency and configured, skip this step.

```bash
npm install @astrojs/netlify
```

```js
// astro.config.mjs
import netlify from '@astrojs/netlify';

export default defineConfig({
  output: 'static',      // site-wide default stays static
  adapter: netlify(),    // required for any prerender:false route to work at all
  // ...existing config
});
```

Without the adapter, `prerender = false` will fail the build. This is the step
most likely to be silently skipped — verify it explicitly.

### 2. Convert the player route to on-demand rendering

In `src/pages/players/[id].astro`:

- Add `export const prerender = false;` near the top of the frontmatter.
- **Delete** the entire `getStaticPaths()` function — it has no meaning on an
  on-demand route and Astro will error if it's left in.
- `Astro.params` and the existing `Astro.redirect('/franchises')` fallback for a
  bad `pid` both work unchanged in SSR mode — no changes needed there.

### 3. Batch the independent Supabase queries with `Promise.all`

This step isn't required for the build-time fix to work, but should be done in
the same pass. At build time, serial `await` chains were largely invisible
(hidden in aggregate across many parallel page builds). At request time, they
become added latency on every single pageview, so this is the point where it
starts actually costing real visitors real seconds.

Queries with no dependency on each other's results should be parallelized. As
currently written, the file does these fully sequentially:

```
playerRow → rosterRow → franchise → draftRow → draftMeta → drafter →
activeFranchise → udfaInfo(query) → medalRows → accoladeRows →
statsRows → startsRows → allFranchiseRows
```

Batch these seven independent queries together:

```js
const [
  { data: playerRow },
  { data: rosterRow },
  { data: medalRows },
  { data: accoladeRows },
  { data: statsRows },
  { data: startsRows },
  { data: allFranchiseRows },
] = await Promise.all([
  supabase.schema('scdfl').from('v_players')
    .select('player_id, first_name, last_name, position, fantasy_positions, team, status, age, years_exp, height, weight, college, espn_id')
    .eq('player_id', pid).single(),
  supabase.schema('scdfl').from('rosters')
    .select('sleeper_id').eq('player_id', pid).limit(1).single(),
  supabase.schema('scdfl').from('v_medals')
    .select('year, position').eq('player_id', pid),
  supabase.schema('scdfl').from('accolades')
    .select('year, award_desc').eq('player_id', pid),
  supabase.schema('scdfl').from('v_player_season_stats')
    .select('*').eq('player_id', pid).order('year', { ascending: true }),
  supabase.schema('scdfl').from('v_player_starts')
    .select('year, week, roster_id').eq('player_id', pid),
  supabase.schema('scdfl').from('franchises')
    .select('id, abbr, "from", "to"'),
]);
```

Leave these chains sequential — each genuinely depends on the prior result, so
they can't be parallelized, but they're now a much shorter critical path than
the full serial version:
- `rosterRow` → `franchise` lookup (needs `rosterRow.sleeper_id`)
- `draftRow` → `draftMeta` → `drafter` / `activeFranchise` (needs `draftRow.draft_id` / `.roster_id`)
- `udfaInfo` fallback query (only runs if `draftInfo` is null — must stay after the draft chain resolves)

Note: `playerRow` must resolve and be checked (`if (pErr || !playerRow) return Astro.redirect(...)`)
before it's safe to proceed — that early-return logic should stay, just move to
after the `Promise.all` block since `playerRow` is now available from it directly
rather than a separate earlier query.

### 4. Verify Netlify environment variables

Confirm `SUPABASE_URL` and `SUPABASE_ANON_KEY` are set in Netlify's site settings
(Site configuration → Environment variables), not just in a local `.env`. These
were previously only needed at build time; they're now also needed at serverless
function runtime for every player page request. A missing var here fails silently
as a blank page or 500, not a build error — worth an explicit post-deploy check by
visiting a player page in production after merge.

## Explicitly out of scope for this change

- No changes to any other route (`franchises/[abbr].astro`, `history.astro`,
  `scores.astro`, `spotlight-games/[slug].astro`, `games/[year]/[slug].astro`,
  etc.) — these remain fully static.
- No URL structure changes — `/players/[id]` stays the same path pattern.
- No changes to the `get_started_player_ids()` RPC or any Supabase schema/view.
- Not implementing the "static for currently-rostered players, on-demand for
  historical/inactive players" hybrid split — that's a possible future
  optimization if per-request latency on popular current-roster players becomes
  a problem after this change ships, but is not part of this task.

## Repo conventions to follow

- Target branch: `dev`. Do not push directly to `main` (production deploys are
  triggered by pushes to `main` and should be infrequent/deliberate).
- Supabase schema is always `scdfl`, never `public` — this file already follows
  that convention; preserve it in any new/modified queries.
- Reserved words (`"to"`, `"from"`) must stay quoted in queries.
- `roster_id` / `sleeper_id` cross-type joins: `franchises.sleeper_id` is text;
  cast integers for joins (`roster_id::text`) — check existing joins in this file
  for the pattern already in use before adding new ones.

## Definition of done

- `npm run build` no longer generates individual static HTML files for player IDs.
- Build time drops significantly (target: comparable to build time before player
  pages were added).
- Visiting any `/players/[id]` URL in a deployed preview/prod build returns a
  correctly rendered page (spot-check a QB, a skill position player, a kicker,
  and an IDP position player, since the table columns are position-conditional).
- Visiting an invalid/nonexistent player ID redirects to `/franchises` as before.
- All other routes are unaffected and still build/render as static HTML.