# Syrka landing page

The syrka.co homepage: a single Next.js page (`app/page.tsx`) built from the components in `components/landing/`.
Campus and sign-in links point to https://syrka.co.

```bash
npm install
npm run dev     # http://localhost:3000
npm run build
```

Background videos live in `public/media/` (960×540 H.264, 10 s, no audio). Bump the `?v=` query on a video's URL in
`app/page.tsx` after re-encoding it in place, or browsers that cached the old file will stall.

## SYRKA Campus demo (`/demo`)

An interactive demo of SYRKA Campus for final-year students and employers. The demo persona's profile, projects and assessments are fictional and labelled as such; external modules show real, attributed data. **Rule:** external data describes the job market, open work or national context — it never becomes a student's skill, verification, project evidence, assessment result, capability score or activity.

### What is where
- **Routes:** `/demo` (choose a persona), `/demo/student/*` (dashboard, profile, skills, projects, opportunities, open-source missions, visibility, data sources), `/demo/employer/*`, `/demo/admin`.
- **Personal data:** `lib/campus/store.ts` keeps each visitor's copy in `localStorage` (profile edits, assessments, projects, saved and dismissed opportunities, saved missions, connected repositories, activity). Schema changes go through `lib/campus/migrations.ts`, which upgrades a visitor's saved state instead of discarding it. **Reset demo data** restores the seed. The demo student starts with no activity; every event is something the visitor did.
- **Matching:** `lib/campus/matching.ts`, one engine for both portals (formula documented in the file).
- **External sources:** registered in `lib/campus/sources.ts` (use, licence, attribution, refresh, limits) and listed at `/demo/student/data-sources`.

| Module | Source | Code | Refresh |
|---|---|---|---|
| Real job openings | Company careers pages (Greenhouse, Lever, Ashby feeds); Himalayas optional | `lib/campus/live-jobs.ts`, `live-jobs.server.ts` | Cached ≤12 h; Apply goes straight to the company's posting |
| Live market demand, Skills in demand now | Computed from live openings | `lib/campus/market-demand.ts` | With live openings; daily snapshot for 7-day change |
| Missing-skill relevance | O*NET 31.0 Software Skills (internal mapping only) | `lib/campus/onet-role-skills.ts` (generated) | Static; `npm run campus:onet` |
| Open-source missions, connected repositories | GitHub REST API (read-only) | `lib/campus/github.ts` | Missions cached 6 h with ETags; repositories on connect/refresh |
| Explore related open work | OpenAlex | `lib/campus/open-data.ts`, `app/api/campus/open-work` | Cached 24 h per query |
| India career landscape | World Bank WDI (incl. ILO modelled estimates) | `lib/campus/open-data.ts` | Cached 24 h; series older than 4 years hidden |

### Environment variables (all optional)
| Variable | Purpose |
|---|---|
| `CRON_SECRET` | Protects `/api/campus/refresh`. Vercel Cron sends it automatically. Without it the route refuses every call. |
| `CAMPUS_HIMALAYAS` | `on` adds remote roles from Himalayas (credited, applied through Himalayas). Off by default. |
| `HIMALAYAS_API_KEY` | Raises Himalayas rate limits when it is on (server-side only). |
| `CAMPUS_LIVE_JOBS` | `off` hides real openings and live demand (e.g. investor environment); illustrative roles are shown, clearly marked. |
| `CAMPUS_LIVE_MAX_AGE_HOURS` | Hide live data older than this (default 36). |
| `CAMPUS_COMPANY_BOARDS` | Companies whose careers pages are read, e.g. `greenhouse:groww:Groww,lever:meesho:Meesho`. Defaults to the 20 companies in `DEFAULT_COMPANY_BOARDS` (Razorpay, Paytm, Meesho, Groww, Stripe, MongoDB…). |
| `GITHUB_TOKEN` | A fine-grained token with **no permissions** (public read only). Raises GitHub's limit from 60 to 5,000 requests/hour. |
| `CAMPUS_GITHUB_REPOS` | Overrides the mission allow-list (below). |
| `OPENALEX_API_KEY` | Free key from openalex.org/settings/api. Without it, requests share a very small daily allowance per IP. |
| `KV_REST_API_URL` + `KV_REST_API_TOKEN` (or `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`) | Stores daily market-demand snapshots (aggregate counts only) for the 7-day change. Without it, production shows current demand only; local development writes to `.data/`. |

### Open-source mission allow-list
Missions are read only from repositories in the allow-list — never from search. The initial list (`DEFAULT_MISSION_REPOS` in `lib/campus/github.ts`, checked 2026-10-26 for open beginner issues):

`freeCodeCamp/freeCodeCamp` (first timers only, help wanted), `scikit-learn/scikit-learn`, `jupyterlab/jupyterlab`, `kubernetes/website`, `microsoft/vscode`, `vercel/next.js`, `oppia/oppia`, `excalidraw/excalidraw` (good first issue), `processing/p5.js` (Good First Issue), `python/mypy` (good-first-issue).

To change it, set `CAMPUS_GITHUB_REPOS` to comma-separated `owner/repo:label one|label two` entries (labels default to `good first issue`; each label is queried separately). Add only reputable public repositories. Pull requests, assigned and locked issues are excluded automatically.

### Scheduled refresh
`GET /api/campus/refresh` (requires `Authorization: Bearer $CRON_SECRET`) re-reads the live sources, stores today's demand snapshot and marks cached live jobs, missions and landscape data for background refresh. On Vercel, `vercel.json` schedules it daily at 01:30 UTC (the Hobby plan allows daily crons). Pages also refresh their caches on their own when visited; the cron makes sure a snapshot exists every day. Run it by hand with:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/campus/refresh
```

### Local development
```bash
npm install
npm run dev            # http://localhost:3000/demo
npm run test:campus    # matching, live sources, external modules, honesty rules
npm run campus:calibrate   # re-derive demo job requirements from live postings
npm run campus:onet -- <folder with O*NET software_skills.csv>   # rebuild the O*NET mapping
```
All external modules work without keys at low volume. Each shows an empty state, never sample data, when its source is unavailable.

### Calibration of illustrative roles
`npm run campus:calibrate` reads entry- and mid-level postings and regenerates `lib/campus/calibration.ts` (aggregate skill shares only). Demo job requirements are derived from it in `lib/campus/seed.ts` (≥50% of postings → required, ≥30% → preferred, at least 15 postings and 2 required skills, otherwise hand-written). Bump `SCHEMA_VERSION` and add a migration step after recalibrating.

### Attribution
Includes information from the O*NET 31.0 Database by the U.S. Department of Labor, Employment and Training Administration, used under CC BY 4.0. Syrka has modified and mapped portions of this data. USDOL/ETA has not approved, endorsed, or tested these modifications. O*NET® is a trademark of USDOL/ETA. Job openings come from company careers pages (and Himalayas when enabled); missions and repository metadata from GitHub; research metadata from OpenAlex (CC0); India indicators from the World Bank (CC BY 4.0).
