// ============================================================================
// The Group Chat Cup — static config (teams, ratings, bracket, players)
// ----------------------------------------------------------------------------
// Ratings are an Elo-style "neutral-site" strength index, hand-set by BLENDING
// the betting market (tournament + reach-round odds we tracked) with the Opta
// supercomputer's latest numbers, then nudged by football priors. They are the
// ONLY thing that drives the forecast; the daily routine never edits this file —
// it only edits results.json. See README.md for the blend methodology.
// ============================================================================

export const TEAMS = {
  // --- GROUP A draft pool (the 8 first-round picks) ---
  ARG: { name: 'Argentina',   flag: '🇦🇷', elo: 2045 }, // Opta ~16% win, easiest bracket
  FRA: { name: 'France',      flag: '🇫🇷', elo: 2075 }, // Opta 18.7% win, market fav
  ESP: { name: 'Spain',       flag: '🇪🇸', elo: 2055 }, // Opta 13.5%, only side >50% to QF
  ENG: { name: 'England',     flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', elo: 2005 }, // Opta 9.7%
  BRA: { name: 'Brazil',      flag: '🇧🇷', elo: 2000 }, // Opta 6.5%
  POR: { name: 'Portugal',    flag: '🇵🇹', elo: 1975 }, // market +1000, Opta ~7%
  NED: { name: 'Netherlands', flag: '🇳🇱', elo: 1960 }, // Opta 5.1%, both 1st-choice CBs out
  USA: { name: 'USA',         flag: '🇺🇸', elo: 1925 }, // Opta reach-QF 42.5% (host + soft draw)

  // --- GROUP B draft pool (the 8 second-round picks) ---
  GER: { name: 'Germany',     flag: '🇩🇪', elo: 1970 }, // strong tier-2 steal; market +1500 win
  BEL: { name: 'Belgium',     flag: '🇧🇪', elo: 1895 },
  COL: { name: 'Colombia',    flag: '🇨🇴', elo: 1875 },
  SEN: { name: 'Senegal',     flag: '🇸🇳', elo: 1865 },
  SUI: { name: 'Switzerland', flag: '🇨🇭', elo: 1850 },
  MEX: { name: 'Mexico',      flag: '🇲🇽', elo: 1895 }, // host bump baked in (Opta QF 28%)
  NOR: { name: 'Norway',      flag: '🇳🇴', elo: 1840 }, // Haaland, thinner squad
  CAN: { name: 'Canada',      flag: '🇨🇦', elo: 1795 }, // co-host; already through R32

  // --- non-drafted teams (affect the bracket, owned by nobody) ---
  MAR: { name: 'Morocco',     flag: '🇲🇦', elo: 1875 }, // 2022 SF pedigree, transitional
  JPN: { name: 'Japan',       flag: '🇯🇵', elo: 1860 },
  CRO: { name: 'Croatia',     flag: '🇭🇷', elo: 1855 },
  ECU: { name: 'Ecuador',     flag: '🇪🇨', elo: 1835 },
  EGY: { name: 'Egypt',       flag: '🇪🇬', elo: 1825 }, // Salah-dependent
  CIV: { name: 'Ivory Coast', flag: '🇨🇮', elo: 1815 },
  AUT: { name: 'Austria',     flag: '🇦🇹', elo: 1805 },
  SWE: { name: 'Sweden',      flag: '🇸🇪', elo: 1795 },
  ALG: { name: 'Algeria',     flag: '🇩🇿', elo: 1790 },
  GHA: { name: 'Ghana',       flag: '🇬🇭', elo: 1775 },
  PAR: { name: 'Paraguay',    flag: '🇵🇾', elo: 1770 },
  AUS: { name: 'Australia',   flag: '🇦🇺', elo: 1770 },
  BIH: { name: 'Bosnia',      flag: '🇧🇦', elo: 1765 },
  COD: { name: 'DR Congo',    flag: '🇨🇩', elo: 1750 },
  RSA: { name: 'South Africa',flag: '🇿🇦', elo: 1740 }, // eliminated by Canada
  CPV: { name: 'Cape Verde',  flag: '🇨🇻', elo: 1700 },
};

// Players and their two teams. groupA = first pick (tier 1), groupB = second pick.
export const PLAYERS = [
  { name: 'Dhody',   a: 'ARG', b: 'CAN' },
  { name: 'Shishu',  a: 'FRA', b: 'SUI' },
  { name: 'Misra',   a: 'ESP', b: 'SEN' },
  { name: 'Mad',     a: 'ENG', b: 'MEX' },
  { name: 'Kuks',    a: 'NED', b: 'NOR' },
  { name: 'Shri',    a: 'BRA', b: 'BEL' },
  { name: 'Anuj',    a: 'USA', b: 'GER' },
  { name: 'Dhirani', a: 'POR', b: 'COL' },
];

export const GROUP_A = ['ARG', 'FRA', 'ESP', 'ENG', 'NED', 'BRA', 'USA', 'POR'];
export const GROUP_B = ['CAN', 'SUI', 'SEN', 'MEX', 'NOR', 'BEL', 'GER', 'COL'];

// The real World Cup knockout bracket.
// R32 matches list their two teams. Later rounds list `feed` = [matchId, matchId];
// the winners of those two matches meet. `round` is the stage the match belongs to.
export const BRACKET = {
  // Round of 32
  m73: { round: 'R32', home: 'RSA', away: 'CAN' },
  m74: { round: 'R32', home: 'GER', away: 'PAR' },
  m75: { round: 'R32', home: 'NED', away: 'MAR' },
  m76: { round: 'R32', home: 'BRA', away: 'JPN' },
  m77: { round: 'R32', home: 'FRA', away: 'SWE' },
  m78: { round: 'R32', home: 'CIV', away: 'NOR' },
  m79: { round: 'R32', home: 'MEX', away: 'ECU' },
  m80: { round: 'R32', home: 'ENG', away: 'COD' },
  m81: { round: 'R32', home: 'USA', away: 'BIH' },
  m82: { round: 'R32', home: 'BEL', away: 'SEN' },
  m83: { round: 'R32', home: 'ESP', away: 'AUT' },
  m84: { round: 'R32', home: 'POR', away: 'CRO' },
  m85: { round: 'R32', home: 'SUI', away: 'ALG' },
  m86: { round: 'R32', home: 'ARG', away: 'CPV' },
  m87: { round: 'R32', home: 'COL', away: 'GHA' },
  m88: { round: 'R32', home: 'AUS', away: 'EGY' },
  // Round of 16
  m89: { round: 'R16', feed: ['m74', 'm77'] },
  m90: { round: 'R16', feed: ['m73', 'm75'] },
  m91: { round: 'R16', feed: ['m76', 'm78'] },
  m92: { round: 'R16', feed: ['m79', 'm80'] },
  m93: { round: 'R16', feed: ['m83', 'm84'] },
  m94: { round: 'R16', feed: ['m81', 'm82'] },
  m95: { round: 'R16', feed: ['m86', 'm88'] },
  m96: { round: 'R16', feed: ['m85', 'm87'] },
  // Quarter-finals
  m97:  { round: 'QF', feed: ['m89', 'm90'] },
  m98:  { round: 'QF', feed: ['m93', 'm94'] },
  m99:  { round: 'QF', feed: ['m91', 'm92'] },
  m100: { round: 'QF', feed: ['m95', 'm96'] },
  // Semi-finals  (SF1: regions A vs B, SF2: regions C vs D — standard layout)
  m101: { round: 'SF', feed: ['m97', 'm98'] },
  m102: { round: 'SF', feed: ['m99', 'm100'] },
  // Final
  m103: { round: 'F', feed: ['m101', 'm102'] },
};

// Order of rounds, and how "deep" each elimination is (higher = better finish).
export const ROUND_ORDER = ['R32', 'R16', 'QF', 'SF', 'F'];
export const DEPTH = { R32: 0, R16: 1, QF: 2, SF: 3, F: 4, CHAMP: 5 };

// Human-readable label for "knocked out in round X" (depth -> label)
export const DEPTH_LABEL = {
  0: 'out in R32',
  1: 'out in Round of 16',
  2: 'out in Quarter-final',
  3: 'out in Semi-final',
  4: 'Runner-up',
  5: 'CHAMPIONS 🏆',
};
