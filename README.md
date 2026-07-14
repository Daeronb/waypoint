# Waypoint

Personal 2027–2032 exit & finance planning PWA. Four layers, one causal chain:
**Engine** (what €350k yields, two dials: principal + acceptable 2032 floor) →
**Match** (which countries that budget funds; anchor shortlist for the crypto off-ramp) →
**Path** (the linear sequence, checkable, with plain-text dependencies) →
**Playbooks** (contingencies: pump, crash, forced return, stay, AOW, estate).

Live anchor: ECB deposit facility rate, fetched daily from the official ECB Data Portal API.
Everything else is stamped snapshots (14 Jul 2026) with a drift warning when the live rate
moves off them. The app never displays a number it can't vouch for.

## Folder layout on your computer

- `waypoint/app/` — everything in here goes to GitHub. Nothing else does.
- `waypoint/research/` — personal research docs. NEVER upload these: the repo is
  public and they are private financial research.

## Deploy (first time)

1. On github.com/daeronb: **New repository** → name it exactly `waypoint` → Public → Create.
2. Open the `app` folder on your computer, select ALL its contents (files + the
   `icons` folder), drag & drop onto the repo page → Commit. The files must land at
   the top level of the repo (index.html at root), not inside an `app` folder.
3. Repo **Settings → Pages** → Source: "Deploy from a branch" → Branch: `main`, folder `/ (root)` → Save.
4. After ~2 minutes: **https://daeronb.github.io/waypoint/** — open on your phone,
   Share → Add to Home Screen.

## Updates (every new version)

Replace the changed files on GitHub (upload again with the same names), wait ~1 min,
then open the app while online — or ☰ → Check for updates. APP_VERSION (app.js) and
CACHE (sw.js) are bumped together each release.

## Data notes

- Your dials, anchor pick and checked steps live in this browser only (localStorage).
- Re-stamp trigger: ECB decision 23 Jul 2026 — the in-app anchor line will flag the drift
  automatically; snapshots in data.js should be refreshed after.
- Adding a country = one entry in `COUNTRIES` (data.js). No code.

Not financial, tax, legal or immigration advice.
