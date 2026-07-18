// ============================================================================
// The Group Chat Cup — Monte Carlo engine
// ----------------------------------------------------------------------------
// Plays out the rest of the real World Cup knockout bracket N times, maps each
// run onto the two draft groups, applies the league scoring (round knocked out
// -> goal difference -> goals scored -> coin toss; lower combined position wins;
// plus the merit-beats-coin-toss rule for league ties), and writes data.json.
//
//   node simulate.mjs            # run full sim, write data.json
//   node simulate.mjs --calibrate# print match + reach-round calibration only
// ============================================================================

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  TEAMS, PLAYERS, GROUP_A, GROUP_B, BRACKET, DEPTH,
} from './teams.mjs';

const __dir = dirname(fileURLToPath(import.meta.url));
const N = Number(process.env.SIMS || 50000);

// --- match model (calibrated; see --calibrate) ------------------------------
const BASE = 1.30;       // avg goals per team when evenly matched
const SUPR_DIV = 195;    // Elo points per 1.0 goal of expected supremacy
const PENS_DIV = 600;    // Elo divisor for shoot-outs (more random than open play)

const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
function poisson(lambda) {
  const L = Math.exp(-lambda);
  let k = 0, p = 1;
  do { k++; p *= Math.random(); } while (p > L);
  return k - 1;
}

// Simulate one match -> { hg, ag, winner }. hg/ag are the regulation+ET score
// (a shoot-out win keeps the drawn score; winner is whoever advanced).
function simMatch(home, away) {
  const d = TEAMS[home].elo - TEAMS[away].elo;
  const supr = d / SUPR_DIV;
  const lh = clamp(BASE + supr / 2, 0.12, 6);
  const la = clamp(BASE - supr / 2, 0.12, 6);
  const hg = poisson(lh), ag = poisson(la);
  let winner;
  if (hg > ag) winner = home;
  else if (ag > hg) winner = away;
  else {
    const pHome = 1 / (1 + Math.pow(10, -d / PENS_DIV));
    winner = Math.random() < pHome ? home : away;
  }
  return { hg, ag, winner };
}

// --- load completed results -------------------------------------------------
const results = JSON.parse(readFileSync(join(__dir, 'results.json'), 'utf8'));
const DONE = results.matches || {};
// Real-world coin tosses that have been settled: pin one team above another so
// the engine stops re-flipping that within-group tie. See results.json.
const TIEBREAKS = results.tiebreaks || [];
function pinOrder(x, y) {                          // -1: x ranks higher, +1: y higher, 0: undecided
  for (const t of TIEBREAKS) {
    if (t.over === x && t.under === y) return -1;
    if (t.over === y && t.under === x) return 1;
  }
  return 0;
}

const matchIds = Object.keys(BRACKET);
function participants(mId) {
  const m = BRACKET[mId];
  if (m.home) return [m.home, m.away];           // R32
  const [f1, f2] = m.feed;
  if (DONE[f1] && DONE[f2]) return [DONE[f1].winner, DONE[f2].winner];
  return null;                                    // not yet determined
}
// matches whose two teams are known AND not played yet -> eligible "watch" games
const WATCH = matchIds.filter(m => !DONE[m] && participants(m));

// --- one tournament ---------------------------------------------------------
// returns { res: {code -> {depth,gd,goals}}, win: {matchId -> winnerCode} }
function simTournament() {
  const win = {};
  const res = {};
  const setElim = (loser, winnerCode, lg, wg, round) => {
    res[loser] = { depth: DEPTH[round], gd: lg - wg, goals: lg };
  };
  for (const mId of matchIds) {
    const m = BRACKET[mId];
    let home, away;
    if (m.home) { home = m.home; away = m.away; }
    else { home = win[m.feed[0]]; away = win[m.feed[1]]; }

    if (DONE[mId]) {
      const r = DONE[mId];
      win[mId] = r.winner;
      const loser = r.winner === home ? away : home;
      const lg = r.winner === home ? r.awayGoals : r.homeGoals;
      const wg = r.winner === home ? r.homeGoals : r.awayGoals;
      setElim(loser, r.winner, lg, wg, m.round);
    } else {
      const { hg, ag, winner } = simMatch(home, away);
      win[mId] = winner;
      const loser = winner === home ? away : home;
      const lg = winner === home ? ag : hg;
      const wg = winner === home ? hg : ag;
      setElim(loser, winner, lg, wg, m.round);
    }
  }
  // champion never loses
  const champ = win.m103;
  res[champ] = { depth: DEPTH.CHAMP, gd: 99, goals: 99 };
  return { res, win };
}

// rank a draft group -> { pos: {code->1..8}, coin: {code->bool} }
function rankGroup(codes, res) {
  const arr = codes.map(c => ({ c, ...res[c] }));
  arr.sort((x, y) => y.depth - x.depth || y.gd - x.gd || y.goals - x.goals);
  const pos = {}, coin = {};
  let i = 0;
  while (i < arr.length) {
    let j = i + 1;
    while (j < arr.length &&
      arr[j].depth === arr[i].depth && arr[j].gd === arr[i].gd && arr[j].goals === arr[i].goals) j++;
    const cluster = arr.slice(i, j);
    if (cluster.length > 1) {                       // genuine coin-toss cluster
      for (let k = cluster.length - 1; k > 0; k--) { // shuffle
        const r = Math.floor(Math.random() * (k + 1));
        [cluster[k], cluster[r]] = [cluster[r], cluster[k]];
      }
      // apply any settled real-world coin tosses; the stable sort keeps the
      // random order for pairs that have no recorded result yet.
      if (TIEBREAKS.length) cluster.sort((a, b) => pinOrder(a.c, b.c));
    }
    // "loser tosses again": only the team(s) that WON the toss (any slot above
    // the cluster's worst) stay coin-dependent and can be beaten by a merit
    // player in a league tie. The bottom team is the toss-loser and is treated
    // as merit — it gets a fresh coin toss in a league tie instead of an auto-loss.
    cluster.forEach((t, k) => { pos[t.c] = i + k + 1; coin[t.c] = cluster.length > 1 && k < cluster.length - 1; });
    i = j;
  }
  return { pos, coin };
}

// --- aggregation containers -------------------------------------------------
const P = PLAYERS.length;
const rankCnt = PLAYERS.map(() => new Array(9).fill(0)); // league rank 1..8
const scoreSum = new Array(P).fill(0);
const rankSum = new Array(P).fill(0);
const teamPos = {}, teamDepth = {};
[...GROUP_A, ...GROUP_B].forEach(c => { teamPos[c] = new Array(9).fill(0); teamDepth[c] = new Array(6).fill(0); });
// conditional: cond[mId][outcome] = { cnt, rankSum[P], winSum[P] }
const cond = {};
WATCH.forEach(m => { cond[m] = {}; participants(m).forEach(o => { cond[m][o] = { cnt: 0, rankSum: new Array(P).fill(0), winSum: new Array(P).fill(0) }; }); });

function runFull() {
  for (let s = 0; s < N; s++) {
    const { res, win } = simTournament();
    const A = rankGroup(GROUP_A, res);
    const B = rankGroup(GROUP_B, res);
    GROUP_A.forEach(c => { teamPos[c][A.pos[c]]++; teamDepth[c][res[c].depth]++; });
    GROUP_B.forEach(c => { teamPos[c][B.pos[c]]++; teamDepth[c][res[c].depth]++; });

    // player scores + coin-toss flags
    const tbl = PLAYERS.map((pl, idx) => {
      const posA = A.pos[pl.a], posB = B.pos[pl.b];
      const coin = A.coin[pl.a] || B.coin[pl.b];
      return { idx, score: posA + posB, coin, rnd: Math.random() };
    });
    // league rank: lower score wins; merit (no coin) beats coin on ties; else random
    tbl.sort((x, y) => x.score - y.score || (x.coin - y.coin) || (x.rnd - y.rnd));
    tbl.forEach((row, k) => {
      const rank = k + 1;
      rankCnt[row.idx][rank]++;
      rankSum[row.idx] += rank;
      scoreSum[row.idx] += row.score;
    });
    const leagueRankByPlayer = new Array(P);
    tbl.forEach((row, k) => { leagueRankByPlayer[row.idx] = k + 1; });

    // conditional buckets
    for (const m of WATCH) {
      const o = win[m];
      const b = cond[m][o];
      if (!b) continue;
      b.cnt++;
      for (let p = 0; p < P; p++) {
        b.rankSum[p] += leagueRankByPlayer[p];
        if (leagueRankByPlayer[p] === 1) b.winSum[p]++;
      }
    }
  }
}

// --- build the per-team status from results (alive / out) -------------------
function teamStatus(code) {
  // a team is OUT if it is the loser of any completed match
  for (const [mId, r] of Object.entries(DONE)) {
    const [h, a] = participants(mId) || [BRACKET[mId].home, BRACKET[mId].away];
    const loser = r.winner === h ? a : h;
    if (loser === code) return { alive: false, round: BRACKET[mId].round };
  }
  return { alive: true };
}

// --- main -------------------------------------------------------------------
function pct(x) { return Math.round(x * 1000) / 10; }

if (process.argv.includes('--calibrate')) {
  // 1) match-level advance probability vs Elo-logistic target
  console.log('MATCH CALIBRATION (sim advance% vs Elo-logistic target)');
  for (const d of [0, 50, 100, 150, 200, 300, 385]) {
    let w = 0, n = 200000;
    for (let i = 0; i < n; i++) {
      const supr = d / SUPR_DIV;
      const hg = poisson(clamp(BASE + supr / 2, .12, 6));
      const ag = poisson(clamp(BASE - supr / 2, .12, 6));
      if (hg > ag) w++;
      else if (hg === ag && Math.random() < 1 / (1 + Math.pow(10, -d / PENS_DIV))) w++;
    }
    const target = 1 / (1 + Math.pow(10, -d / 400));
    console.log(`  d=${String(d).padStart(3)}  sim=${pct(w / n)}%  target=${pct(target)}%`);
  }
  // 2) team reach-round probabilities (eyeball vs blended market+Opta)
  runFull();
  console.log('\nREACH-ROUND % (sim)  [reachR16 / QF / SF / Final / Win]');
  for (const c of [...GROUP_A, ...GROUP_B]) {
    const d = teamDepth[c];
    const ge = k => d.slice(k).reduce((a, b) => a + b, 0) / N; // P(depth>=k)
    console.log(`  ${c} ${TEAMS[c].name.padEnd(12)} ${pct(ge(1))}  ${pct(ge(2))}  ${pct(ge(3))}  ${pct(ge(4))}  ${pct(ge(5))}`);
  }
  process.exit(0);
}

runFull();

// assemble players
const players = PLAYERS.map((pl, idx) => {
  const probs = rankCnt[idx].slice(1).map(c => c / N); // index 0 = rank1
  const watch = WATCH.map(m => {
    const [h, a] = participants(m);
    // skip the player's OWN teams' games — "root for your own team" is obvious.
    // the watch list is for the non-obvious indirect swings (rivals out, easier draws).
    if (h === pl.a || h === pl.b || a === pl.a || a === pl.b) return null;
    const bh = cond[m][h], ba = cond[m][a];
    if (!bh.cnt || !ba.cnt) return null;
    const rH = bh.rankSum[idx] / bh.cnt, rA = ba.rankSum[idx] / ba.cnt;
    const wH = bh.winSum[idx] / bh.cnt, wA = ba.winSum[idx] / ba.cnt;
    const root = rH < rA ? h : a;       // team to cheer (gives you the lower avg finish)
    const vs = root === h ? a : h;
    return {
      matchId: m, root, vs,
      swing: Math.abs(rH - rA),         // places of average-finish swing
      winSwing: Math.abs(wH - wA),      // title-odds swing
      rootImprovesRankBy: Math.abs(rH - rA),
      rootRaisesWinBy: (root === h ? wH - wA : wA - wH),
    };
  }).filter(Boolean).sort((x, y) => y.swing - x.swing);

  return {
    name: pl.name, a: pl.a, b: pl.b,
    aTeam: { code: pl.a, ...TEAMS[pl.a] },
    bTeam: { code: pl.b, ...TEAMS[pl.b] },
    rankProbs: probs,
    pWin: probs[0],
    pTop3: probs[0] + probs[1] + probs[2],
    pBottom3: probs[5] + probs[6] + probs[7],
    expRank: rankSum[idx] / N,
    expScore: scoreSum[idx] / N,
    watch: watch.slice(0, 4),
  };
});

// groups (team-level)
function teamCard(code) {
  const d = teamDepth[code];
  const ge = k => d.slice(k).reduce((a, b) => a + b, 0) / N;
  return {
    code, name: TEAMS[code].name, flag: TEAMS[code].flag,
    posProbs: teamPos[code].slice(1).map(c => c / N),
    reach: { R16: ge(1), QF: ge(2), SF: ge(3), F: ge(4), win: ge(5) },
    status: teamStatus(code),
  };
}

const data = {
  generatedAt: results.lastUpdated || null,
  nSims: N,
  completed: Object.keys(DONE).length,
  players,
  groups: { A: GROUP_A.map(teamCard), B: GROUP_B.map(teamCard) },
  watchMeta: WATCH.map(m => {
    const [h, a] = participants(m);
    return { matchId: m, round: BRACKET[m].round, home: { code: h, ...TEAMS[h] }, away: { code: a, ...TEAMS[a] } };
  }),
};

// keep a history of each player's title odds + expected rank, so the site can
// show movement game-by-game. Appends one snapshot per run.
let history = [];
try { history = JSON.parse(readFileSync(join(__dir, 'history.json'), 'utf8')); } catch {}
history.push({
  at: results.lastUpdated || null,
  completed: data.completed,
  pWin: Object.fromEntries(players.map(p => [p.name, Math.round(p.pWin * 1000) / 10])),
  expRank: Object.fromEntries(players.map(p => [p.name, Math.round(p.expRank * 100) / 100])),
});
writeFileSync(join(__dir, 'history.json'), JSON.stringify(history, null, 2));
data.history = history;

writeFileSync(join(__dir, 'data.json'), JSON.stringify(data, null, 2));
console.log(`✓ ${N} sims · ${data.completed} game(s) played · wrote data.json`);
console.log('Leaderboard (by expected finish):');
[...players].sort((x, y) => x.expRank - y.expRank).forEach((p, i) => {
  console.log(`  ${i + 1}. ${p.name.padEnd(8)} ${p.aTeam.flag}${p.bTeam.flag}  win ${pct(p.pWin)}%  exp ${p.expRank.toFixed(2)}`);
});
