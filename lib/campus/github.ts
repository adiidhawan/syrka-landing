/**
 * Read-only GitHub REST access for Open-source missions and connected repositories.
 *
 * - Only repositories in the allow-list are queried for missions; nothing is searched or scraped.
 * - Only GET requests are made. Nothing is created, commented on, starred or forked, and no student data is sent.
 * - Pull requests (which the issues endpoint also returns) are excluded.
 * - Responses are revalidated with ETags (a 304 costs no rate limit), rate-limit headers are respected, and
 *   transient failures back off exponentially with a hard cap.
 *
 * No framework imports, so the parsing can be unit-tested with Node directly.
 */

export interface MissionRepo {
  repo: string
  /** Labels to query, each fetched separately (GitHub combines several labels with AND). */
  labels: string[]
}

/**
 * Initial allow-list: well-known public projects that label beginner-friendly issues. Checked on 2026-10-26 to have
 * open issues under these labels. Override with CAMPUS_GITHUB_REPOS.
 */
export const DEFAULT_MISSION_REPOS: MissionRepo[] = [
  { repo: 'freeCodeCamp/freeCodeCamp', labels: ['first timers only', 'help wanted'] },
  { repo: 'scikit-learn/scikit-learn', labels: ['good first issue'] },
  { repo: 'jupyterlab/jupyterlab', labels: ['good first issue'] },
  { repo: 'kubernetes/website', labels: ['good first issue'] },
  { repo: 'microsoft/vscode', labels: ['good first issue'] },
  { repo: 'vercel/next.js', labels: ['good first issue'] },
  { repo: 'processing/p5.js', labels: ['Good First Issue'] },
  { repo: 'oppia/oppia', labels: ['good first issue'] },
  { repo: 'excalidraw/excalidraw', labels: ['good first issue'] },
  { repo: 'python/mypy', labels: ['good-first-issue'] },
]

const REPO_NAME = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/

/** Parses CAMPUS_GITHUB_REPOS: `owner/repo:label one|label two,owner2/repo2` (labels default to "good first issue"). */
export function parseMissionRepos(value: string | undefined): MissionRepo[] {
  if (!value?.trim()) return DEFAULT_MISSION_REPOS
  return value.split(',').map(e => e.trim()).filter(Boolean).flatMap(entry => {
    const colon = entry.indexOf(':')
    const repo = colon < 0 ? entry : entry.slice(0, colon)
    const labelPart = colon < 0 ? '' : entry.slice(colon + 1)
    if (!REPO_NAME.test(repo)) return []
    const labels = labelPart.split('|').map(l => l.trim()).filter(Boolean)
    return [{ repo, labels: labels.length ? labels : ['good first issue'] }]
  })
}

/** Labels that mark an issue as approachable. Used to prioritise, never to fabricate a label. */
const BEGINNER = /good.?first|first.?timers?|beginner|starter|easy|help.?wanted|documentation|\bdocs?\b/i

export interface Mission {
  /** `owner/repo#number` */
  id: string
  repo: string
  number: number
  title: string
  url: string
  labels: string[]
  language: string | null
  updatedAt: string
  comments: number
}

type Json = Record<string, unknown>

/** Turns issues-endpoint items into missions, dropping pull requests, locked or assigned issues and unsafe URLs. */
export function issuesToMissions(repo: string, items: unknown, language: string | null): Mission[] {
  if (!Array.isArray(items)) return []
  return (items as Json[]).flatMap(i => {
    if ('pull_request' in i) return []
    if (i.state !== 'open' || i.locked === true) return []
    if (Array.isArray(i.assignees) && i.assignees.length > 0) return []
    const url = typeof i.html_url === 'string' ? i.html_url : ''
    if (!url.startsWith(`https://github.com/${repo}/issues/`)) return []
    const labels = Array.isArray(i.labels) ? (i.labels as Json[]).map(l => (typeof l === 'string' ? l : String(l?.name ?? ''))).filter(Boolean) : []
    return [{
      id: `${repo}#${i.number}`, repo, number: Number(i.number), title: String(i.title ?? '').trim(), url, labels,
      language, updatedAt: String(i.updated_at ?? ''), comments: Number(i.comments ?? 0),
    }]
  })
}

/** Beginner-labelled first, then most recently updated. */
export function rankMissions(missions: Mission[]): Mission[] {
  const seen = new Set<string>()
  return missions
    .filter(m => (seen.has(m.id) ? false : (seen.add(m.id), true)))
    .sort((a, b) => Number(b.labels.some(l => BEGINNER.test(l))) - Number(a.labels.some(l => BEGINNER.test(l))) || b.updatedAt.localeCompare(a.updatedAt))
}

// ── HTTP ─────────────────────────────────────────────────────────────────────────────────────────────────────────

const API = 'https://api.github.com'
// Per-instance ETag cache: a 304 reuses the stored body and does not count against the rate limit.
const etags = new Map<string, { etag: string; body: unknown }>()

export class RateLimitedError extends Error {
  resetAt: string | null
  constructor(resetAt: string | null) {
    super('GitHub rate limit reached')
    this.resetAt = resetAt
  }
}

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

/**
 * GET with conditional requests, rate-limit handling and exponential backoff (3 attempts: 0.5s, 1s, 2s; never waits
 * for a rate-limit reset, which can be up to an hour away — it reports it instead).
 */
export async function githubGet(path: string, opts: { token?: string; timeoutMs?: number; fetchImpl?: typeof fetch } = {}): Promise<{ status: number; body: unknown }> {
  const doFetch = opts.fetchImpl ?? fetch
  const cached = etags.get(path)
  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt) await sleep(500 * 2 ** (attempt - 1))
    let res: Response
    try {
      res = await doFetch(`${API}${path}`, {
        method: 'GET',
        signal: AbortSignal.timeout(opts.timeoutMs ?? 10_000),
        cache: 'no-store',
        headers: {
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
          'User-Agent': 'syrka-campus-demo',
          ...(opts.token ? { Authorization: `Bearer ${opts.token}` } : {}),
          ...(cached ? { 'If-None-Match': cached.etag } : {}),
        },
      })
    } catch {
      continue
    }
    if (res.status === 304 && cached) return { status: 200, body: cached.body }
    const remaining = res.headers.get('x-ratelimit-remaining')
    if ((res.status === 403 || res.status === 429) && (remaining === '0' || res.headers.get('retry-after'))) {
      const reset = Number(res.headers.get('x-ratelimit-reset'))
      throw new RateLimitedError(Number.isFinite(reset) && reset > 0 ? new Date(reset * 1000).toISOString() : null)
    }
    if (res.status >= 500) continue
    if (!res.ok) return { status: res.status, body: null }
    const body = await res.json()
    const etag = res.headers.get('etag')
    if (etag) etags.set(path, { etag, body })
    return { status: res.status, body }
  }
  throw new Error(`GitHub request failed: ${path}`)
}

export interface MissionsResult {
  missions: Mission[]
  fetchedAt: string
  repos: { repo: string; ok: boolean; count: number }[]
  rateLimitedUntil: string | null
}

export async function fetchMissions(repos: MissionRepo[], opts: { token?: string; perLabel?: number; fetchImpl?: typeof fetch } = {}): Promise<MissionsResult> {
  const all: Mission[] = []
  const status: MissionsResult['repos'] = []
  let rateLimitedUntil: string | null = null
  for (const { repo, labels } of repos) {
    if (rateLimitedUntil) { status.push({ repo, ok: false, count: 0 }); continue }
    try {
      const meta = await githubGet(`/repos/${repo}`, opts)
      const info = meta.body as Json | null
      // Only public, non-archived repositories qualify.
      if (meta.status !== 200 || !info || info.private === true || info.archived === true) { status.push({ repo, ok: false, count: 0 }); continue }
      const language = typeof info.language === 'string' ? info.language : null
      let count = 0
      for (const label of labels) {
        const res = await githubGet(`/repos/${repo}/issues?state=open&sort=updated&direction=desc&per_page=${opts.perLabel ?? 6}&labels=${encodeURIComponent(label)}`, opts)
        const missions = issuesToMissions(repo, res.body, language)
        count += missions.length
        all.push(...missions)
      }
      status.push({ repo, ok: true, count })
    } catch (e) {
      if (e instanceof RateLimitedError) rateLimitedUntil = e.resetAt ?? new Date(Date.now() + 3_600_000).toISOString()
      status.push({ repo, ok: false, count: 0 })
    }
  }
  return { missions: rankMissions(all), fetchedAt: new Date().toISOString(), repos: status, rateLimitedUntil }
}

// ── Connected repositories (student-supplied, public, read-only) ─────────────────────────────────────────────────

export interface RepoMetadata {
  fullName: string
  url: string
  description: string | null
  language: string | null
  languages: Record<string, number>
  pushedAt: string | null
  stars: number
  fetchedAt: string
}

/** Accepts "owner/repo" or a github.com URL; returns the canonical "owner/repo" or null. */
export function parseRepoRef(input: string): string | null {
  const t = input.trim().replace(/\.git$/, '').replace(/\/+$/, '')
  const m = t.match(/^(?:https?:\/\/(?:www\.)?github\.com\/)?([A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+)$/)
  return m && REPO_NAME.test(m[1]) ? m[1] : null
}

export async function fetchRepoMetadata(fullName: string, opts: { token?: string } = {}): Promise<RepoMetadata | null> {
  const meta = await githubGet(`/repos/${fullName}`, opts)
  const info = meta.body as Json | null
  if (meta.status !== 200 || !info || info.private === true) return null
  const langs = await githubGet(`/repos/${fullName}/languages`, opts)
  return {
    fullName: String(info.full_name ?? fullName),
    url: String(info.html_url ?? `https://github.com/${fullName}`),
    description: typeof info.description === 'string' ? info.description : null,
    language: typeof info.language === 'string' ? info.language : null,
    languages: langs.status === 200 && langs.body && typeof langs.body === 'object' ? (langs.body as Record<string, number>) : {},
    pushedAt: typeof info.pushed_at === 'string' ? info.pushed_at : null,
    stars: Number(info.stargazers_count ?? 0),
    fetchedAt: new Date().toISOString(),
  }
}
