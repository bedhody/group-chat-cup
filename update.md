# Daily update routine — instructions for the scheduled agent

Run this every morning (India time), after the previous day's World Cup
knockout games have finished. Goal: add any newly-completed games and refresh
the odds. Keep it tight and deterministic.

## Steps

1. **Find new results.** Look up which World Cup 2026 knockout matches finished
   since the last update. For each, note the two teams, the score in
   **regulation + extra time**, and **who advanced** (after penalties if drawn).

2. **Map each game to its match ID.** The bracket lives in `teams.mjs` (`BRACKET`).
   Match IDs are `m73`–`m103`. Round of 32 = `m73`–`m88` (teams are listed
   directly). Later rounds resolve from earlier winners. Use the `home`/`away`
   order shown in `BRACKET` for that match ID.

3. **Edit `results.json` only.** For each newly-finished game add one entry under
   `"matches"`, keyed by match ID:
   ```json
   "m75": { "homeGoals": 1, "awayGoals": 2, "winner": "MAR" }
   ```
   - `homeGoals`/`awayGoals` = the regulation+ET score, in the BRACKET's
     home/away order. A penalty-shootout win keeps the drawn score (e.g. 1–1)
     and you just set `winner` to whoever advanced.
   - `winner` = the team code that advanced.
   - Also update `"lastUpdated"` to today's date (`YYYY-MM-DD`).
   - Do **not** edit `teams.mjs` (ratings stay fixed through the tournament).

4. **Regenerate.** Run `node simulate.mjs`. Confirm it prints
   `✓ … wrote data.json` and a sensible leaderboard. This also appends a
   snapshot to `history.json` (drives the "movers" on the site).

5. **Publish — always, no confirmation needed.** The update is not "done" until
   it is live. Every run must end with a push; a commit alone does nothing (the
   site only moves on push). Run `git add -A && git commit -m "results: <date>"
   && git push` and then verify the deployed `data.json` reflects the new
   `completed` count. For this project the owner has standing approval to push
   after each update — do **not** stop to ask.

## Guardrails

- If you're unsure a game truly finished or the score is ambiguous, **skip it**
  and leave it for the next run — never guess a scoreline.
- Add only games that are 100% final. Re-running with the same `results.json`
  is safe and idempotent.
- One line per finished match; never remove or rewrite past results.
