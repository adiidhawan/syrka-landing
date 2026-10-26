/**
 * Registry of every external data source SYRKA Campus uses: what it is used for, its licence, the attribution it
 * requires, how often it is refreshed, and the configuration it reads. The Data sources page renders this list, and
 * tests check every entry is complete.
 *
 * Rule for all sources: external data describes the market, open work or aggregate context. It never becomes a
 * student's skill, verification, project evidence, assessment result or capability score.
 */

export type SourceKey = 'himalayas' | 'partner_boards' | 'github' | 'openalex' | 'onet' | 'worldbank'

export interface DataSource {
  key: SourceKey
  name: string
  homepage: string
  usedFor: string
  licence: string
  licenceUrl: string
  /** Text shown wherever the data appears or on the Data sources page. */
  attribution: string
  refresh: string
  /** Environment variables the adapter reads; all optional unless stated. */
  env: { name: string; purpose: string }[]
  /** What the data must never be used for, stated explicitly. */
  neverUsedFor: string
}

export const ONET_ATTRIBUTION =
  'Includes information from the O*NET 31.0 Database by the U.S. Department of Labor, Employment and Training Administration, used under CC BY 4.0. Syrka has modified and mapped portions of this data.'

export const DATA_SOURCES: DataSource[] = [
  {
    key: 'himalayas',
    name: 'Himalayas',
    homepage: 'https://himalayas.app',
    usedFor: 'Live external openings: remote, entry-level roles open to candidates in India, and the live market-demand figures computed from them.',
    licence: 'Himalayas API terms (display in own app permitted, including commercial use)',
    licenceUrl: 'https://himalayas.app/terms',
    attribution: 'Jobs sourced from Himalayas (himalayas.app). Applications go through Himalayas.',
    refresh: 'Listing data cached for up to 12 hours; each listing re-checked before it is opened or applied to; demand snapshot taken daily by the scheduled refresh.',
    env: [
      { name: 'HIMALAYAS_API_KEY', purpose: 'Raises rate limits. Server-side only.' },
      { name: 'CAMPUS_LIVE_JOBS', purpose: 'Set to "off" to hide live openings (e.g. an investor environment).' },
      { name: 'CAMPUS_LIVE_MAX_AGE_HOURS', purpose: 'Hide live data older than this (default 36).' },
    ],
    neverUsedFor: 'Re-publication to other boards, aggregators, Google Jobs or LinkedIn; any personal metric.',
  },
  {
    key: 'partner_boards',
    name: 'Partner employer job boards',
    homepage: 'https://docs.greenhouse.io/job-board.html',
    usedFor: 'Openings from employers who have agreed in writing to be listed. Off unless configured.',
    licence: 'Written agreement with each employer',
    licenceUrl: 'https://docs.greenhouse.io/job-board.html',
    attribution: '"<Company> careers (partner)" on each listing.',
    refresh: 'With live openings (up to 12 hours).',
    env: [{ name: 'CAMPUS_PARTNER_BOARDS', purpose: 'Allow-list, e.g. "greenhouse:groww:Groww". Empty by default.' }],
    neverUsedFor: 'Any employer that has not agreed in writing.',
  },
  {
    key: 'github',
    name: 'GitHub',
    homepage: 'https://github.com',
    usedFor: 'Open-source missions (open issues from allow-listed public repositories) and read-only metadata for public repositories a student connects to a project.',
    licence: 'GitHub REST API, read-only, under the GitHub Terms of Service',
    licenceUrl: 'https://docs.github.com/en/site-policy/github-terms/github-terms-of-service',
    attribution: 'Source: GitHub. Issue and repository content belongs to the respective repository owners.',
    refresh: 'Missions cached for 6 hours with conditional requests; repository metadata fetched when a student connects or refreshes it.',
    env: [
      { name: 'GITHUB_TOKEN', purpose: 'A token with no scopes (public read only) to raise the rate limit from 60 to 5,000 requests an hour.' },
      { name: 'CAMPUS_GITHUB_REPOS', purpose: 'Override the mission allow-list, e.g. "owner/repo:good first issue|help wanted,owner2/repo2".' },
    ],
    neverUsedFor: 'Jobs, internships, verified projects or employer opportunities; any write action (issues, comments, stars, pull requests); sending student data to GitHub.',
  },
  {
    key: 'openalex',
    name: 'OpenAlex',
    homepage: 'https://openalex.org',
    usedFor: 'Explore related open work: recent open-access research metadata for a chosen skill or target role.',
    licence: 'CC0 (metadata)',
    licenceUrl: 'https://help.openalex.org/hc/en-us/articles/24397285563671-About-OpenAlex',
    attribution: 'Source: OpenAlex. Metadata is CC0; each work keeps its own licence.',
    refresh: 'Cached for 24 hours per query.',
    env: [{ name: 'OPENALEX_API_KEY', purpose: 'Free key. Without it, requests share a very small daily budget per IP address.' }],
    neverUsedFor: 'Course completion, reading records or any claim about what a student has studied.',
  },
  {
    key: 'onet',
    name: 'O*NET 31.0 Database',
    homepage: 'https://www.onetcenter.org/database.html',
    usedFor: 'Internal role-to-skill mapping: deciding which in-demand skills are relevant to a student’s target role.',
    licence: 'CC BY 4.0',
    licenceUrl: 'https://creativecommons.org/licenses/by/4.0/',
    attribution: `${ONET_ATTRIBUTION} USDOL/ETA has not approved, endorsed, or tested these modifications. O*NET® is a trademark of USDOL/ETA.`,
    refresh: 'Static; regenerated with `npm run campus:onet` when a new O*NET release is adopted.',
    env: [],
    neverUsedFor: 'Scores or evidence about a student.',
  },
  {
    key: 'worldbank',
    name: 'World Bank, World Development Indicators',
    homepage: 'https://data.worldbank.org',
    usedFor: 'India career landscape: aggregate labour-market and education context. Includes ILO modelled estimates published through WDI.',
    licence: 'CC BY 4.0',
    licenceUrl: 'https://datacatalog.worldbank.org/public-licenses#cc-by',
    attribution: 'Source: World Bank, World Development Indicators (CC BY 4.0); unemployment series are ILO modelled estimates (ILOSTAT).',
    refresh: 'Cached for 24 hours; a series is hidden when its latest value is more than 4 years old.',
    env: [],
    neverUsedFor: 'Ranking students, calculating alignment or inferring anyone’s employability.',
  },
]

export function dataSource(key: SourceKey): DataSource {
  const s = DATA_SOURCES.find(d => d.key === key)
  if (!s) throw new Error(`Unknown source ${key}`)
  return s
}
