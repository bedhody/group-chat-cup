# The Group Chat Cup 🏆

A live-odds website for our 8-player World Cup 2026 draft league. Every player
backs two teams (one first-round pick, one second-round pick). Open the site,
tap your name, and see your odds of every finishing position — plus exactly
which upcoming results you should be cheering (and cheering *against*).

## The league

| Player | 1st pick (Group A) | 2nd pick (Group B) |
|---|---|---|
| Dhody | 🇦🇷 Argentina | 🇨🇦 Canada |
| Shishu | 🇫🇷 France | 🇨🇭 Switzerland |
| Misra | 🇪🇸 Spain | 🇸🇳 Senegal |
| Mad | 🏴 England | 🇲🇽 Mexico |
| Kuks | 🇳🇱 Netherlands | 🇳🇴 Norway |
| Shri | 🇧🇷 Brazil | 🇧🇪 Belgium |
| Anuj | 🇺🇸 USA | 🇩🇪 Germany |
| Dhirani | 🇵🇹 Portugal | 🇨🇴 Colombia |

## Scoring (how the league works)

- Your two teams each finish **1st–8th within their own group**, ranked by how
  far they go: **round knocked out → goal difference (in the game they went out)
  → goals scored → coin toss**.
- **Your score = the two finishing positions added together. Lowest wins.**
  (e.g. 2nd + 5th = 7).
- League ties are broken by coin toss — *except* when one player earned their
  spot on pure merit and the other needed a within-group coin toss; the merit
  player wins. (The engine models this.)

## How the forecast works

`simulate.mjs` plays out the **entire rest of the real World Cup bracket
50,000 times** (Poisson scorelines, so goal-difference/goals tiebreakers are
realistic), drops each outcome into the two draft groups, applies the scoring
above, and writes everyone's odds to `data.json`.

Team strength (`teams.mjs`, the `elo` field) is a **blend of the betting market
and the Opta supercomputer**, nudged by football priors and calibrated so the
simulated reach-round probabilities match that consensus (run
`node simulate.mjs --calibrate` to see the calibration).

## Files

| File | What it is |
|---|---|
| `index.html` | The website (self-contained — HTML/CSS/JS, no build step). |
| `teams.mjs` | Static config: team ratings, the bracket, players, scoring. **Rarely edited.** |
| `results.json` | Completed knockout games. **This is the only file the daily update touches.** |
| `simulate.mjs` | The Monte Carlo engine → writes `data.json` + appends `history.json`. |
| `data.json` | Generated output the website reads. |
| `history.json` | One snapshot per update, so the site can show movement over time. |

## Run it locally

Browsers block `fetch()` over `file://`, so serve the folder over HTTP:

```bash
cd world-cup-draft
node simulate.mjs        # (re)generate data.json
python3 -m http.server 8000
# open http://localhost:8000
```

## Daily auto-update (the routine)

The site is meant to refresh itself every morning (India time) after the day's
games finish — no admin needed. The scheduled routine follows `update.md`:

1. Look up the previous day's knockout results.
2. Add each finished game to `results.json` (see that file's format).
3. Run `node simulate.mjs`.
4. Publish (commit/push to the host).

> **Setup status:** the site + engine are done and verified. Hosting (so the
> gang can open a URL) and the morning routine are the next step — they need
> account access, so we'll wire those up together. Recommended host: GitHub
> Pages (the routine just `git push`es and it redeploys for free).

## Tuning a team's strength

Edit its `elo` in `teams.mjs` (higher = stronger; ~100 Elo ≈ a 64/36 game),
then `node simulate.mjs --calibrate` to re-check against the market/Opta blend.
