# Sixth City — Widget Handoff Brief

**For:** Claude Code session (this repo)
**Context:** Two new data visualizations for the Sixth City Dynasty FFL site (Astro + Tailwind, Supabase `scdfl` schema).
**Author:** Zac (commissioner / developer)

---

## How to use this document

This brief describes two widgets in enough detail to build them, but it deliberately does **not** prescribe exact file paths, component names, charting library, or data-access patterns — you should infer those from the existing repo. Before implementing, inspect:

- How existing pages under `/franchises/[abbr]/` are structured and what data they already load.
- The existing commish tools, especially the `trans-audit` page (this brief extends it).
- The established Supabase access pattern (client, schema exposure, query helpers). All data lives in the **`scdfl`** schema, **not** `public`.
- The existing charting / visualization approach, if any. Match it. If none exists, pick something consistent with the stack and note the choice.
- Team color tokens and the site's design system (dark terminal / neon-noir aesthetic; league gold `#f2b22e` is the dominant accent; SCC blue `#4a7fa5`, HCC orange `#e67e22`).

Two important schema reminders that have bitten this project before:
- The `scdfl` schema requires quoting `"to"` and `"from"` columns anywhere they appear (reserved words).
- Supabase's default row limit is **1,000 rows** and can silently truncate. The queries here are small, but be deliberate about limits.

---

# Widget A — Franchise Game-by-Game Performance

**The primary deliverable of this handoff.** A longitudinal bar chart of a single franchise's complete regular-season history, one bar per game, that lives on each franchise overview page.

## Placement

One instance per franchise overview page, e.g.:

```
/franchises/bkb/
/franchises/tor/
/franchises/nfd/
```

The widget takes **one fixed parameter: the team abbreviation** (lowercase, e.g. `bkb`). Everything else it needs, it derives from that. The abbreviation is already known at the page level from the route, so wire it through as a prop.

## Data source

Pull from the `scdfl` schema. The shape needed per game (one row per game the franchise played):

- `year`, `week`
- **Point differential** for the franchise in that game (`points_for − points_against`)
- **Result** — win or loss
- The **opponent's** abbreviation (needed to build the click-through URL — see below)
- Enough to compute two "context" flags (see Luck callouts)

### Resolving the franchise

`franchises.sleeper_id` (text) is the franchise's Sleeper roster id, and it maps to `matchups.roster_id_a` / `matchups.roster_id_b`. Given an abbreviation:

1. Look up the franchise row in `franchises` by `abbr` → get its `sleeper_id`.
2. In `matchups`, the franchise is whichever of `roster_id_a` / `roster_id_b` equals that `sleeper_id`. Normalize each row so the franchise-in-question is always "self" and the other side is "opponent."

### Regular season only

**Filter `matchups` on `game_type = 0`.** This is the regular season. Exclude everything else (playoffs, exhibitions, etc.).

### Exclude unplayed games

The current season's future weeks exist as placeholder rows with **all-zero scores** (`score_a = 0`, `score_b = 0`). These must be excluded — a `0-0` game is not a real game and would render as a meaningless flat bar and a phantom "loss." Filter them out (e.g. drop rows where both scores are zero, or otherwise detect that the week hasn't been played yet). Once the current season's weeks are actually played, they should appear automatically.

### Reference query (adapt as needed)

This is the analytical query used to prototype the chart. It normalizes to "self," computes the weekly league average (for the luck flags below), and joins the two. Treat it as a spec for the data shape, not necessarily the final in-app query.

```sql
WITH self AS (
  SELECT sleeper_id::int AS rid, abbr
  FROM scdfl.franchises
  WHERE abbr = :ABBR            -- e.g. 'BKB'
),
games AS (
  SELECT s.abbr, m.year, m.week,
    CASE WHEN m.roster_id_a = s.rid THEN m.score_a ELSE m.score_b END AS pf,
    CASE WHEN m.roster_id_a = s.rid THEN m.score_b ELSE m.score_a END AS pa,
    CASE WHEN m.roster_id_a = s.rid THEN m.roster_id_b ELSE m.roster_id_a END AS opp_rid
  FROM scdfl.matchups m
  JOIN self s ON (m.roster_id_a = s.rid OR m.roster_id_b = s.rid)
  WHERE m.game_type = 0
    AND NOT (m.score_a = 0 AND m.score_b = 0)   -- drop unplayed placeholder weeks
),
wk_avg AS (
  SELECT year, week, AVG(sc) AS lg_avg
  FROM (
    SELECT year, week, score_a AS sc FROM scdfl.matchups WHERE game_type = 0 AND NOT (score_a = 0 AND score_b = 0)
    UNION ALL
    SELECT year, week, score_b       FROM scdfl.matchups WHERE game_type = 0 AND NOT (score_a = 0 AND score_b = 0)
  ) t
  GROUP BY year, week
)
SELECT g.year, g.week, g.pf, g.pa,
  (g.pf - g.pa)          AS diff,
  CASE WHEN g.pf > g.pa THEN 'W' ELSE 'L' END AS result,
  opp.abbr               AS opp_abbr,
  ROUND(w.lg_avg, 2)     AS lg_avg,
  ROUND(g.pa - w.lg_avg, 2) AS opp_vs_avg
FROM games g
JOIN wk_avg w    ON g.year = w.year AND g.week = w.week
JOIN scdfl.franchises opp ON opp.sleeper_id::int = g.opp_rid
ORDER BY g.year, g.week;
```

## Visual design

- **One bar per game**, ordered chronologically (year, then week), spanning the franchise's entire regular-season history.
- **Bar height/length = point differential** for that game. Positive (win margin) points one way, negative (loss margin) the other, from a zero baseline.
- **Bar color encodes the result:** wins one color, losses another. Use the site's existing win/loss semantics if they exist; otherwise green = win, red = loss, adapted to the neon-noir palette.
- **Season boundaries:** draw a subtle vertical divider (or clear axis grouping) between seasons, with the year labeled once per season block. On the prototype, the x-axis labeled only the first week of each season with the year; do the same so the axis doesn't get crowded with 70+ week labels.
- **Y-axis:** point differential, single axis, zero baseline centered.
- **Tooltip / hover:** show at minimum `YEAR Wk WEEK`, the result, and the margin (e.g. "Win +84.6"). Opponent abbreviation is a nice-to-have in the tooltip. Desktop only; mobile users should see no tooltip on hover.

## Interaction — click a bar to open that game's recap

Clicking a bar navigates to that game's recap page. **URL format:**

```
/games/[year]/[week]-[team_a]-[team_b]/
```

Where:
- `year` is the game's season.
- `week` is **zero-padded to two digits** (`04`, not `4`; `10` stays `10`).
- `team_a` and `team_b` are the two franchise abbreviations, **lowercase**, **sorted alphabetically**. The alphabetical ordering is the canonical rule already used site-wide for game slugs — it is independent of home/away or `roster_id_a`/`roster_id_b` order. So a BKB-vs-MIS game is always `bkb-mis`, never `mis-bkb`.

**Example:** BKB's 2025 Week 10 game against MIS →

```
/games/2025/10-bkb-mis/
```

To build the slug for a given bar you need: the game's `year`, its zero-padded `week`, the current franchise's `abbr`, and the opponent's `abbr` — then lowercase both abbreviations and sort them alphabetically before joining with `-`. This is why the opponent abbreviation must come through in the per-game data.

When dealing with franchises whose abbreviations have changed, use the global convention of resolving to the actual abbreviation, rather than the current abbreviation. 

There is no need to verify a recap file exists before linking — the games route already handles the "no recap written" state gracefully (it renders the score block alone). Every bar links to a valid game page regardless of whether editorial prose exists for it.

## Responsive behavior — the mobile/desktop split

The full-history chart is **very wide** (70+ bars and growing every week). It reads well on desktop and wide screens but will not fit on mobile.

**Desktop / wide screens:**
- Render the **entire history**, all seasons, in one continuous chart.
- The season dropdown (below) is **hidden**.

**Mobile / narrow screens:**
- Show a **season-selector dropdown** that is **only visible on mobile**.
- The dropdown **requires a selection** and displays **exactly one season of data at a time** — never the full multi-season history on mobile.
- Populate the dropdown options from the seasons the franchise actually has games in (don't hardcode; derive from the data so it stays correct as seasons are added).
- On changing the selection, the chart re-renders with just that season's games (~14 bars), which fits comfortably.
- Decide a sensible default selection. Recommended: the **most recent season** with played games. Requiring a selection does not mean forcing a blank initial state — it means the chart is always scoped to one season on mobile, never "all." (If you prefer a true empty-until-chosen initial state, that's acceptable too; confirm which reads better in the layout.)

Use the site's established breakpoint conventions for the desktop/mobile cutoff rather than inventing a new one. The dropdown's visibility and the "one season vs. all" data scoping should both key off that same breakpoint.

## Edge cases

- **Franchise with predecessor identities (rebrands / ownership transfers):** some franchises operated under prior names/ids. For this widget, include all games across all years, between the current franchise identity and all predecessors. Tooltips and game recap links should resolve to the actual `abbr` value and other corresponding team metadata as appropriate.
- **A franchise's very first season** starts the chart; there's no "before." No special handling needed beyond ordering. This should always be 2021, the league's inaugural season.
- **Ties:** the reference query treats non-wins as losses (`pf > pa` ⇒ W, else L). If ties are possible in this scoring format they'd currently render as losses. Superflex with kickers and decimal scoring makes exact ties nearly impossible, but if the repo has a canonical tie definition, honor it.

---

# Widget B — League-Wide Trade Timing Heatmap (Commish Tool)

A calendar heatmap of when trades happen across the year, folded into the existing commissioner **`trans-audit`** page as a more static, league-wide view.

## Placement & intent

This lives on the pre-existing `trans-audit` commish page — **do not build a new page.** It sits alongside the audit/health-check tooling already there.

The design intent is a **division of labor** between two views that work in tandem:
- **This widget = the whole-league view.** "When does trading happen across the league, year over year?"
- **The existing per-team activity view** (already built) answers "how active is *this* team?"

So this widget is intentionally **league-wide and aggregate** — it does not filter by team. Keep it relatively **static** (a rendered heatmap, not a heavily interactive dashboard). Hover tooltips are welcome; complex controls are not the point.

## Data source

From the `scdfl` schema, `transactions` table.

- **Filter `type = 'trade'`.** This isolates accepted, processed trades from waivers/adds/drops/commissioner moves.
- **Deduplicate on `transaction_id`.** Sleeper writes **one row per asset leg** of a trade (each player and each pick moved is its own row), so a single 3-player trade may be several rows sharing one `transaction_id`. Counting raw rows massively overcounts. **Count distinct `transaction_id` to get the number of trades.**

### The `created` field — real timestamp available

`created` is a **millisecond Unix epoch** (`bigint`), e.g. `1626651002173` → `2021-07-18 19:30 ET`. **Use it** as the real timestamp; do not fall back to the `year`/`week` composite. Convert to a real date, in **US Eastern time** (`America/New_York`), before bucketing, so games/trades land in the intuitive calendar week.

```sql
to_timestamp(created / 1000) AT TIME ZONE 'America/New_York'
```

**One data-quality caveat to surface (not fix):** the earliest 2021 trades all share an identical `created` value — the signature of a bulk startup/import rather than separately negotiated deals. Don't try to correct it; just be aware the very first 2021 bucket may be inflated/artificial. A small footnote on the widget is appropriate.

## Heatmap structure

Build a matrix of **calendar week-of-year (rows) × year (columns)**, colored by trade count. This layout lets the commish read **across a row** to compare the same part of the calendar year over year — e.g. "mid-October activity in 2022 vs 2023 vs 2024 vs 2025" — which is the whole point.

- **Rows:** ISO week-of-year (`EXTRACT(ISOYEAR …)` / `EXTRACT(WEEK …)` on the ET-converted date). In practice trades only span roughly weeks 7–48 (late Feb through late Nov); it's fine to clamp the visible rows to the active range rather than showing 52 mostly-empty rows. Label a subset of rows with month anchors (e.g. Feb, Mar, … Nov) so the reader can orient without counting week numbers.
- **Columns:** one per season year present in the data (2021 → current). Derive from data; don't hardcode the set.
- **Cell value:** count of **distinct `transaction_id`** whose ET date falls in that (year, week) bucket.
- **Color scale:** sequential single-hue ramp, light (few/zero) → dark (many). Zero cells should be visually distinct from low-but-nonzero cells (e.g. an empty/neutral cell vs. the palest ramp step). Include a small legend showing the ramp and the max. Keep it within the site's palette; blue or gold-family ramps both work against the dark background.
- **Hover tooltip:** `YEAR week WW: N trades`.

### Reference query (week-of-year grain)

```sql
WITH trades AS (
  SELECT DISTINCT transaction_id,
    (to_timestamp(created / 1000) AT TIME ZONE 'America/New_York')::date AS d
  FROM scdfl.transactions
  WHERE type = 'trade' AND created IS NOT NULL
)
SELECT EXTRACT(ISOYEAR FROM d)::int AS iso_year,
       EXTRACT(WEEK    FROM d)::int AS iso_week,
       COUNT(*)                     AS trades
FROM trades
GROUP BY 1, 2
ORDER BY 1, 2;
```

A coarser **month × year** version of the same query (swap `EXTRACT(MONTH …)` for the week extract) is a good sanity check and could be offered as an alternate granularity, but the **week-of-year grain is the primary requested view** — it's what enables "Week 6 across years" comparisons.

## What this widget is *not*

- Not per-team (that view already exists elsewhere).
- Not a live/interactive filtering dashboard — keep it static and legible.
- Not counting raw transaction rows — always distinct `transaction_id`.

---

## Summary checklist

**Widget A (franchise game-by-game) — franchise overview pages:**
- [ ] One param: team abbreviation.
- [ ] Pull regular-season games (`game_type = 0`), exclude unplayed `0-0` placeholder weeks.
- [ ] Bar per game; height = point differential; color = win/loss; season dividers + per-season year labels.
- [ ] Click a bar → `/games/[year]/[zero-padded-week]-[abbrs-lowercase-alphabetical]/`.
- [ ] Desktop/wide: full history, dropdown hidden.
- [ ] Mobile: mobile-only season dropdown, requires selection, one season shown at a time.
- [ ] Handle rebrand/predecessor history deliberately; flag the decision.

**Widget B (trade timing heatmap) — folded into existing `trans-audit` commish page:**
- [ ] `transactions` where `type = 'trade'`, **distinct `transaction_id`**.
- [ ] Bucket by real ET date from `created` (ms epoch), week-of-year × year.
- [ ] Sequential heatmap, zero ≠ palest step, legend, hover tooltips, month row anchors.
- [ ] Static league-wide view; complements the existing per-team activity view.
- [ ] Footnote the artificial identical-timestamp 2021 startup batch.

**Cross-cutting:**
- [ ] All data from `scdfl` schema (not `public`); quote `"to"`/`"from"` if touched.
- [ ] Mind the 1,000-row default limit.
- [ ] Match the existing charting approach, design tokens, and Supabase access pattern in the repo.