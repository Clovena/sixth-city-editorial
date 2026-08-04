export interface RosterSlot {
  position: string;
  /** Matches the CSS variable suffix: --color-{colorVar}, --color-{colorVar}-surface, --color-{colorVar}-glow */
  colorVar: string;
  /** True for DL, LB, DB, DFLX — absent in 2021 season; hide these slots when not applicable */
  isDefensive: boolean;
}

/**
 * Canonical starter order across all seasons.
 * The final four slots (isDefensive: true) do not exist in the 2021 season
 * and should be hidden when rendering that year's data.
 */
export const ROSTER_SLOTS: RosterSlot[] = [
  { position: 'QB',   colorVar: 'qb',   isDefensive: false },
  { position: 'RB',   colorVar: 'rb',   isDefensive: false },
  { position: 'RB',   colorVar: 'rb',   isDefensive: false },
  { position: 'WR',   colorVar: 'wr',   isDefensive: false },
  { position: 'WR',   colorVar: 'wr',   isDefensive: false },
  { position: 'WR',   colorVar: 'wr',   isDefensive: false },
  { position: 'TE',   colorVar: 'te',   isDefensive: false },
  { position: 'FLX',  colorVar: 'flex', isDefensive: false },
  { position: 'FLX',  colorVar: 'flex', isDefensive: false },
  { position: 'SFLX', colorVar: 'flex', isDefensive: false },
  { position: 'PK',   colorVar: 'pk',   isDefensive: false },
  { position: 'DL',   colorVar: 'idp',  isDefensive: true  },
  { position: 'LB',   colorVar: 'idp',  isDefensive: true  },
  { position: 'DB',   colorVar: 'idp',  isDefensive: true  },
  { position: 'DFLX', colorVar: 'idp',  isDefensive: true  },
];

/**
 * Starter order for exhibition games, which differ in various ways
 * from the canonical order used across standard matchups.
 */
export const ROSTER_SLOTS_TAGTEAM: RosterSlot[] = [
  { position: 'QB',   colorVar: 'qb',   isDefensive: false },
  { position: 'QB',   colorVar: 'qb',   isDefensive: false },
  { position: 'RB',   colorVar: 'rb',   isDefensive: false },
  { position: 'RB',   colorVar: 'rb',   isDefensive: false },
  { position: 'RB',   colorVar: 'rb',   isDefensive: false },
  { position: 'RB',   colorVar: 'rb',   isDefensive: false },
  { position: 'WR',   colorVar: 'wr',   isDefensive: false },
  { position: 'WR',   colorVar: 'wr',   isDefensive: false },
  { position: 'WR',   colorVar: 'wr',   isDefensive: false },
  { position: 'WR',   colorVar: 'wr',   isDefensive: false },
  { position: 'WR',   colorVar: 'wr',   isDefensive: false },
  { position: 'WR',   colorVar: 'wr',   isDefensive: false },
  { position: 'TE',   colorVar: 'te',   isDefensive: false },
  { position: 'TE',   colorVar: 'te',   isDefensive: false },
  { position: 'FLX',  colorVar: 'flex', isDefensive: false },
  { position: 'FLX',  colorVar: 'flex', isDefensive: false },
  { position: 'FLX',  colorVar: 'flex', isDefensive: false },
  { position: 'FLX',  colorVar: 'flex', isDefensive: false },
  { position: 'SFLX', colorVar: 'flex', isDefensive: false },
  { position: 'SFLX', colorVar: 'flex', isDefensive: false },
  { position: 'PK',   colorVar: 'pk',   isDefensive: false },
  { position: 'PK',   colorVar: 'pk',   isDefensive: false },
  { position: 'DL',   colorVar: 'idp',  isDefensive: true  },
  { position: 'DL',   colorVar: 'idp',  isDefensive: true  },
  { position: 'LB',   colorVar: 'idp',  isDefensive: true  },
  { position: 'LB',   colorVar: 'idp',  isDefensive: true  },
  { position: 'DB',   colorVar: 'idp',  isDefensive: true  },
  { position: 'DB',   colorVar: 'idp',  isDefensive: true  },
  { position: 'DFLX', colorVar: 'idp',  isDefensive: true  },
  { position: 'DFLX', colorVar: 'idp',  isDefensive: true  },
];

export const ROSTER_SLOTS_ONEVSALL: RosterSlot[] = [
  { position: 'QB',   colorVar: 'qb',   isDefensive: false },
  { position: 'RB',   colorVar: 'rb',   isDefensive: false },
  { position: 'RB',   colorVar: 'rb',   isDefensive: false },
  { position: 'WR',   colorVar: 'wr',   isDefensive: false },
  { position: 'WR',   colorVar: 'wr',   isDefensive: false },
  { position: 'WR',   colorVar: 'wr',   isDefensive: false },
  { position: 'TE',   colorVar: 'te',   isDefensive: false },
  { position: 'FLX',  colorVar: 'flex', isDefensive: false },
  { position: 'FLX',  colorVar: 'flex', isDefensive: false },
  { position: 'SFLX', colorVar: 'flex', isDefensive: false },
  { position: 'DL',   colorVar: 'idp',  isDefensive: true  },
  { position: 'LB',   colorVar: 'idp',  isDefensive: true  },
  { position: 'DB',   colorVar: 'idp',  isDefensive: true  },
  { position: 'DFLX', colorVar: 'idp',  isDefensive: true  },
];
