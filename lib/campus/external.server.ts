import { unstable_cache } from 'next/cache'
import { fetchMissions, parseMissionRepos, type MissionsResult } from './github'
import { getLiveState } from './live-jobs.server'
import { computeDemand, priorWeekSnapshot, weeklyChange, type MarketDemand } from './market-demand'
import { fetchLandscape, fetchOpenWorks, type LandscapeIndicator, type OpenWork } from './open-data'
import { readSnapshots, snapshotStoreKind, type SnapshotStoreKind } from './snapshot-store'

/**
 * Server-side, cached loaders for the external modules. Each returns a status the UI can turn into an honest empty
 * state; none of them throws to the page.
 */

export const MISSIONS_TAG = 'campus-missions'
export const LANDSCAPE_TAG = 'campus-landscape'
export const OPENALEX_TAG = 'campus-openalex'

// ── Market demand ────────────────────────────────────────────────────────────────────────────────────────────────

export type MarketDemandState =
  | {
      status: 'live'
      demand: MarketDemand
      /** Date of the snapshot the weekly change compares against, or null when there is no 7-day history yet. */
      priorDate: string | null
      weekly: Record<string, number>
      history: SnapshotStoreKind
    }
  | { status: 'unavailable'; reason: 'disabled' | 'stale' | 'unavailable' }

export async function getMarketDemand(): Promise<MarketDemandState> {
  const live = await getLiveState()
  if (live.status !== 'live') return { status: 'unavailable', reason: live.status }
  const demand = computeDemand(live.data.jobs, live.data.fetchedAt)
  const prior = priorWeekSnapshot(await readSnapshots(), demand.fetchedAt.slice(0, 10))
  const weekly: Record<string, number> = {}
  if (prior) {
    for (const id of new Set([...Object.keys(demand.skills), ...Object.keys(prior.skills)])) weekly[id] = weeklyChange(demand.skills[id], prior, id) ?? 0
  }
  return { status: 'live', demand, priorDate: prior?.date ?? null, weekly, history: snapshotStoreKind() }
}

// ── Open-source missions ─────────────────────────────────────────────────────────────────────────────────────────

const cachedMissions = unstable_cache(
  async () => {
    const result = await fetchMissions(parseMissionRepos(process.env.CAMPUS_GITHUB_REPOS), { token: process.env.GITHUB_TOKEN || undefined })
    // Do not cache a run where nothing worked (e.g. rate limited), so the next request can try again.
    if (!result.repos.some(r => r.ok)) throw Object.assign(new Error('No repository responded'), { result })
    return result
  },
  ['campus-missions-v1'],
  { revalidate: 21600, tags: [MISSIONS_TAG] },
)

export type MissionsState = { status: 'live'; data: MissionsResult } | { status: 'unavailable'; rateLimitedUntil: string | null }

export async function getMissions(): Promise<MissionsState> {
  try {
    return { status: 'live', data: await cachedMissions() }
  } catch (e) {
    const result = (e as { result?: MissionsResult }).result
    return { status: 'unavailable', rateLimitedUntil: result?.rateLimitedUntil ?? null }
  }
}

// ── OpenAlex ─────────────────────────────────────────────────────────────────────────────────────────────────────

const cachedWorks = unstable_cache(
  async (query: string) => ({ works: await fetchOpenWorks(query, { apiKey: process.env.OPENALEX_API_KEY || undefined }), fetchedAt: new Date().toISOString() }),
  ['campus-openalex-v1'],
  { revalidate: 86400, tags: [OPENALEX_TAG] },
)

export type OpenWorksState = { status: 'live'; works: OpenWork[]; fetchedAt: string } | { status: 'unavailable' }

export async function getOpenWorks(query: string): Promise<OpenWorksState> {
  try {
    return { status: 'live', ...(await cachedWorks(query.toLowerCase())) }
  } catch {
    return { status: 'unavailable' }
  }
}

// ── India career landscape ───────────────────────────────────────────────────────────────────────────────────────

const cachedLandscape = unstable_cache(fetchLandscape, ['campus-landscape-v1'], { revalidate: 86400, tags: [LANDSCAPE_TAG] })

export type LandscapeState = { status: 'live'; indicators: LandscapeIndicator[]; fetchedAt: string } | { status: 'unavailable' }

export async function getLandscape(): Promise<LandscapeState> {
  try {
    const data = await cachedLandscape()
    return data.indicators.length ? { status: 'live', ...data } : { status: 'unavailable' }
  } catch {
    return { status: 'unavailable' }
  }
}
