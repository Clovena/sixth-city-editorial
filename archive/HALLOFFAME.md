# Hall of Fame — Wireframe Handoff

Prepared by Claude (chat) for Claude Code. This is a structural and content
brief, not a visual spec — styling, tokens, and component conventions should
be pulled from `CLAUDE.md` and the project's existing CSS, not from this
document. Nothing here should be treated as pixel-accurate; it describes
what goes where and why, and leaves *how it looks* to the established design
system.

---

## 1. Sitemap

```
/hall-of-fame                → Lobby (hero + wing grid, sub-nav for the section)
/hall-of-fame/champions       → Season Results & Charity
/hall-of-fame/superlatives    → Player Awards + Manager Awards
/hall-of-fame/medals          → Player Medal Leaderboard
/hall-of-fame/records         → Single-Game Highs
/hall-of-fame/inductees       → "Hall of Famers" — career inductions (post-S6)
```

Global nav keeps a single "Hall of Fame" entry pointing at `/hall-of-fame`.
The wing grid on the lobby *is* the sub-navigation into the five inner pages
— there is no separate persistent tab bar; each inner page should still
provide a clear way back to `/hall-of-fame` (breadcrumb or back-link
consistent with how `/franchises/TOR` links back to `/franchises`).

---

## 2. `/hall-of-fame` — Lobby

### Hero band
- Full-width, trophy/podium imagery as the visual anchor. Likely the
  Borealis Trophy asset (`borealis-outline` + color paths) or a stylized
  podium silhouette — reuse existing trophy/medal art if it exists in
  `/brand` or `/images` rather than commissioning new art at this stage.
- Headline: "The Hall of Fame" (or similar — final copy TBD, not locked).
- Optional kicker line with a live count pulled from `seasons` /
  `results` (e.g. number of completed seasons, number of champions) —
  nice-to-have, not required for v1.

### Wing grid — 2-2-1 layout
This is the core structural requirement for the lobby. Five wings, laid
out as two rows of two followed by one full-width row:

```
┌─────────────────┬─────────────────┐
│    Champions     │   Superlatives   │
├─────────────────┼─────────────────┤
│     Medals       │     Records      │
├─────────────────┴─────────────────┤
│           Hall of Famers            │
└─────────────────────────────────────┘
```

Each tile:
- Wing name (as displayed — see table below; note "Hall of Famers" is
  the *display* name, `inductees` is the *slug*, these differ
  intentionally)
- A one-liner beneath the name (final, locked copy — see table)
- No teaser stats on the tiles themselves. Zac was explicit that stats on
  the tiles make the grid feel less like a clean, self-contained sub-nav.
  Keep tiles minimal: name + one-liner only.
- The "Hall of Famers" tile should read as anticipated/locked rather than
  broken, since `/inductees` won't have real content until post-Season 6
  (visually dimmed, disabled-looking, or otherwise distinct — exact
  treatment per design system).

| Display name    | Slug            | One-liner                                  |
|------------------|------------------|---------------------------------------------|
| Champions        | `champions`      | "Ultimate glory"                             |
| Superlatives     | `superlatives`   | "Awards from the people"                     |
| Medals           | `medals`         | "Players who reached the stars"              |
| Records          | `records`        | "Unforgettable moments"                      |
| Hall of Famers   | `inductees`      | "The legends of Sixth City. Coming soon."    |

### Recent additions module
Below the wing grid: a spotlight on what's new across the Hall, to keep
the lobby feeling current for repeat visitors. Suggested approach: one
row or set of small callouts, one per wing (excluding Hall of Famers,
which has no data yet), each surfacing the most recent addition to that
wing — e.g. most recent champion, most recent superlative winner, most
recent medal, most recent record broken. This does not need to be
exhaustive or symmetrical; if a wing has nothing recent to show, it's
fine to omit that slot rather than force content.

---

## 3. `/hall-of-fame/champions`

Expansion of what `/history` already summarizes, built for depth per
season rather than a single table row.

**Per-season card**, reverse chronological, ceremony/podium layout
(distinct from the dense-table treatment used on Records):
- Champion (gold tier)
- Runner-Up (silver tier)
- 3rd Place (bronze tier)
- Consolation Champion — smaller, visually subordinate callout; it's a
  real cash prize but not the headline result
- Charity donation tied directly to the champion's card for that year
  (`seasons.charity`), with a stronger visual tether than the current
  `/history` page gives it — this was explicitly called out as
  underserved on the existing page
- Conference title winners (SCC/HCC) for that season, likely as a
  secondary line on the same card rather than a separate section

**Data sources**: `scdfl.results` (`finish` field carries placement —
confirm exact string values in use, e.g. "Champion", "Runner-Up", "3rd
Place", "Consolation Champion" — before building the query), `scdfl.seasons`
(`scc_champion`, `hcc_champion`, `charity`).

---

## 4. `/hall-of-fame/superlatives`

Two clearly separated sections on one page:
- **Player Awards** — MVP, ROTY, Geriatric, etc.
- **Manager Awards** — MOTY, Most Improved, Most Impactful Trade, league
  championships / conference titles if surfaced here rather than only on
  the Champions wing (TBD — avoid duplicating the Champions wing's job)

Each award type should read as a timeline/history — winner by year — so
repeat winners are visually obvious at a glance, rather than one
flat list of year+winner rows with no grouping by award.

**Most Impactful Trade** needs its own card treatment, not the standard
single-winner-crest card used for MVP/MOTY/etc. It's technically a
multi-manager award — the players involved didn't do anything to earn
inclusion, the managers who made the trade did — so the card should
show both franchises involved (two-franchise-logo layout) rather than
forcing a single "winner."

**Data source**: `scdfl.accolades`. This table is populated in Supabase
(the `rows: 0` reported by the `list_tables` tool during wireframing
appears to be a tool-side limitation, not a reflection of actual data —
Claude Code should query it directly and treat it as populated).
Key columns: `year`, `award_code`, `award_desc`, `player_id` (player
awards), `sleeper_id` (manager/franchise awards), `transaction_id`
(trade awards), `vote_share`, `total_votes`. One row per year+award_code.
Since `player_id`, `sleeper_id`, and `transaction_id` are all nullable,
the query/display logic needs to branch on which one is populated to
determine award type (player vs. manager vs. trade) — there's no
explicit "award category" column, so this has to be inferred or a
category should be derived from `award_code` conventions if one exists.

---

## 5. `/hall-of-fame/medals`

Standalone wing (not folded into Superlatives — confirmed). Functions as
a **leaderboard**, not a duplicate of what's already on player profile
pages. Most-decorated players league-wide, sortable, linking back to
individual player profiles rather than re-rendering medal detail here.

**Data source**: Zac referenced a view called `v_medals` — described as
top scorers by year by position — as the intended source for this wing.

**Flag for Claude Code**: I was not able to confirm this view exists or
inspect its columns. The Supabase tool available to me in this session
(`list_tables`) only enumerates base tables in the `scdfl` schema, not
views, so `v_medals` would be invisible to that tool regardless of
whether it exists. Claude Code should verify `v_medals` directly (e.g.
via `information_schema.views` or a direct `select * from scdfl.v_medals
limit 5`) before building against it, and confirm its actual column
names/grain (per-year-per-position top scorer, per the description) match
what this wing needs for a "most decorated player" leaderboard — it's
possible `v_medals` is a building block for this wing rather than a
1:1 source, depending on how "medal" is defined (e.g. does finishing
#1 at a position in a season = a medal, and is there a silver/bronze
tier per position per year, or just a single winner?).

---

## 6. `/hall-of-fame/records`

Dense stat tables — the one wing where a table, not a card, is the right
pattern.

- Top 10 single-game team scores
- Top 10 single-game player scores
- Room to extend later (biggest blowout, closest game, longest win
  streak) without restructuring the page

**Data sources**: `scdfl.matchups` for team scores (`score_a`/`score_b`
per `roster_id_a`/`roster_id_b`, joined to `franchises` — remember the
`roster_id` int vs. `sleeper_id` text cast issue noted in prior schema
work); `starter_points_a`/`starter_points_b` arrays (paired positionally
with `starters_a`/`starters_b`) for single-player single-week highs.
Exclude `0-0` placeholder rows for unplayed weeks, per existing
matchups-table conventions. No new table needed — this is a query/view,
not new schema.

---

## 7. `/hall-of-fame/inductees` ("Hall of Famers")

Distinct in kind from the other four wings: this is prose + career
narrative per inductee, not a leaderboard or a per-season record. Modeled
on Pro Football Hall of Fame induction pages. Voted on by the league
based on career performance and merit, beginning after Season 6.

**Until Season 6 concludes**, this page should exist as an explainer /
"coming soon" state — how induction will work, what the voting process
will look like — rather than an empty or broken page. This is
placeholder content, not a stub to skip.

**Post-Season 6**, the intended pattern is a gallery grid of inductee
portraits/badges linking to individual induction pages, structurally
similar to how `/franchises` (grid) relates to `/franchises/TOR`
(detail page).

No schema currently exists for this and none is expected to be needed
immediately — flagging it as a known future dependency, not something to
build against now.

---

## 8. Sequencing notes

- **Champions** and **Records** wings can be built first — their
  underlying data (`results`, `seasons`, `matchups`) already exists and
  is populated.
- **Superlatives** and **Medals** depend on `accolades` (confirmed
  populated) and `v_medals` (existence/shape to be confirmed by Claude
  Code directly, per the flag in Section 5).
- **Hall of Famers / `inductees`** ships as a placeholder/explainer now;
  real content arrives post-Season 6.

## 9. Explicitly out of scope for this handoff

- No Figma specs, dimensions, or type scale — this is an Astro site and
  Claude Code should apply existing design tokens and CSS conventions
  directly.
- No new database schema proposed here — everything above maps to
  existing tables/views, pending confirmation of `v_medals`.
- No copy has been finalized beyond the five wing one-liners in Section
  2, which are locked.