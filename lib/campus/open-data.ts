/**
 * OpenAlex (open research metadata) and World Bank (aggregate India context) adapters. Read-only, server-side,
 * no student data sent. No framework imports, so parsing can be unit-tested with Node directly.
 */

type Json = Record<string, unknown>

// ── OpenAlex ─────────────────────────────────────────────────────────────────────────────────────────────────────

export interface OpenWork {
  id: string
  title: string
  authors: string[]
  institutions: string[]
  publishedOn: string | null
  url: string
  openAccess: boolean
  oaStatus: string | null
  venue: string | null
}

export function openAlexToWorks(body: unknown): OpenWork[] {
  const results = (body as { results?: Json[] } | null)?.results
  if (!Array.isArray(results)) return []
  return results.flatMap(w => {
    const title = typeof w.display_name === 'string' ? w.display_name.trim() : ''
    const loc = (w.primary_location ?? {}) as Json
    const oa = (w.open_access ?? {}) as Json
    const url = [w.doi, loc.landing_page_url, oa.oa_url].find((u): u is string => typeof u === 'string' && /^https?:\/\//.test(u))
    if (!title || !url) return []
    const authorships = Array.isArray(w.authorships) ? (w.authorships as Json[]) : []
    return [{
      id: String(w.id ?? url),
      title,
      authors: authorships.slice(0, 3).map(a => String((a.author as Json | undefined)?.display_name ?? '')).filter(Boolean),
      institutions: [...new Set(authorships.flatMap(a => (Array.isArray(a.institutions) ? (a.institutions as Json[]) : []).map(i => String(i.display_name ?? ''))).filter(Boolean))].slice(0, 2),
      publishedOn: typeof w.publication_date === 'string' ? w.publication_date : null,
      url,
      openAccess: oa.is_oa === true,
      oaStatus: typeof oa.oa_status === 'string' ? oa.oa_status : null,
      venue: typeof (loc.source as Json | undefined)?.display_name === 'string' ? String((loc.source as Json).display_name) : null,
    }]
  })
}

/** Recent (last two years), open-access works for a query, most relevant first. */
export async function fetchOpenWorks(query: string, opts: { apiKey?: string; now?: Date } = {}): Promise<OpenWork[]> {
  const since = new Date((opts.now ?? new Date()).getTime() - 730 * 86_400_000).toISOString().slice(0, 10)
  const params = new URLSearchParams({
    search: query,
    filter: `is_oa:true,from_publication_date:${since}`,
    per_page: '6',
    select: 'id,display_name,publication_date,authorships,primary_location,open_access,doi',
  })
  if (opts.apiKey) params.set('api_key', opts.apiKey)
  const res = await fetch(`https://api.openalex.org/works?${params}`, { signal: AbortSignal.timeout(10_000), cache: 'no-store' })
  if (!res.ok) throw new Error(`OpenAlex HTTP ${res.status}`)
  return openAlexToWorks(await res.json())
}

// ── World Bank ───────────────────────────────────────────────────────────────────────────────────────────────────

export const LANDSCAPE_INDICATORS = [
  { id: 'SL.UEM.1524.ZS', label: 'Youth unemployment (ages 15–24)', unit: '% of youth labour force', note: 'ILO modelled estimate' },
  { id: 'SL.UEM.ADVN.ZS', label: 'Unemployment with advanced education', unit: '% of labour force with advanced education', note: 'ILO modelled estimate' },
  { id: 'SE.TER.ENRR', label: 'Tertiary enrolment', unit: '% gross', note: 'UNESCO Institute for Statistics' },
] as const

/** Series whose latest observation is older than this many years are hidden as stale. */
export const LANDSCAPE_MAX_AGE_YEARS = 4

export interface LandscapeIndicator {
  id: string
  label: string
  unit: string
  note: string
  value: number
  year: number
  datasetUpdated: string | null
}

/** Picks the latest non-null observation from a World Bank indicator response; null when none or too old. */
export function worldBankLatest(body: unknown, meta: (typeof LANDSCAPE_INDICATORS)[number], now = new Date()): LandscapeIndicator | null {
  if (!Array.isArray(body) || body.length < 2 || !Array.isArray(body[1])) return null
  const header = body[0] as Json
  const rows = (body[1] as Json[]).filter(r => typeof r.value === 'number' && /^\d{4}$/.test(String(r.date)))
    .sort((a, b) => Number(b.date) - Number(a.date))
  const latest = rows[0]
  if (!latest) return null
  const year = Number(latest.date)
  if (now.getUTCFullYear() - year > LANDSCAPE_MAX_AGE_YEARS) return null
  return {
    id: meta.id, label: meta.label, unit: meta.unit, note: meta.note,
    value: Math.round(Number(latest.value) * 10) / 10, year,
    datasetUpdated: typeof header.lastupdated === 'string' ? header.lastupdated : null,
  }
}

export async function fetchLandscape(): Promise<{ indicators: LandscapeIndicator[]; fetchedAt: string }> {
  const results = await Promise.allSettled(LANDSCAPE_INDICATORS.map(async meta => {
    const res = await fetch(`https://api.worldbank.org/v2/country/IND/indicator/${meta.id}?format=json&mrv=6`, { signal: AbortSignal.timeout(10_000), cache: 'no-store' })
    if (!res.ok) throw new Error(`World Bank HTTP ${res.status}`)
    return worldBankLatest(await res.json(), meta)
  }))
  const indicators = results.flatMap(r => (r.status === 'fulfilled' && r.value ? [r.value] : []))
  if (!indicators.length && results.every(r => r.status === 'rejected')) throw new Error('World Bank unreachable')
  return { indicators, fetchedAt: new Date().toISOString() }
}
