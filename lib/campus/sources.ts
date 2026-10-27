/**
 * Registry of every external data source SYRKA Campus uses: what it is used for, its licence, the attribution it
 * requires, how often it is refreshed, and the configuration it reads. The Data sources page renders this list, and
 * tests check every entry is complete.
 *
 * Rule for all sources: external data describes the market, open work or aggregate context. It never becomes a
 * student's skill, verification, project evidence, assessment result or capability score.
 */

export type SourceKey = 'company_boards' | 'himalayas' | 'github' | 'openalex' | 'onet' | 'worldbank'

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
    key: 'company_boards',
    name: 'Company careers pages',
    homepage: 'https://docs.greenhouse.io/job-board.html',
    usedFor: 'Real job openings in India and the market-demand figures computed from them, read from the public job-board feeds (Greenhouse, Lever, Ashby) behind each company’s careers page.',
    licence: 'Public job-board APIs published by each company’s applicant-tracking system',
    licenceUrl: 'https://docs.greenhouse.io/job-board.html',
    attribution: 'Each opening names its company and links to the original posting; students apply on the company’s own site.',
    refresh: 'Cached for up to 12 hours; daily demand snapshot taken by the scheduled refresh.',
    env: [
      { name: 'CAMPUS_COMPANY_BOARDS', purpose: 'Override the company list, e.g. "greenhouse:groww:Groww,lever:meesho:Meesho". Defaults to the list in lib/campus/live-jobs.ts.' },
      { name: 'CAMPUS_LIVE_JOBS', purpose: 'Set to "off" to hide real openings (illustrative roles are shown instead).' },
      { name: 'CAMPUS_LIVE_MAX_AGE_HOURS', purpose: 'Hide openings data older than this (default 36).' },
    ],
    neverUsedFor: 'Copying job descriptions, or any personal metric about a student.',
  },
  {
    key: 'himalayas',
    name: 'Himalayas (optional)',
    homepage: 'https://himalayas.app',
    usedFor: 'Optional extra source of remote roles open to candidates in India. Off unless CAMPUS_HIMALAYAS=on.',
    licence: 'Himalayas API terms (display in own app permitted, including commercial use)',
    licenceUrl: 'https://himalayas.app/terms',
    attribution: 'Jobs sourced from Himalayas (himalayas.app). Applications go through Himalayas.',
    refresh: 'With real openings; each Himalayas listing re-checked before it is opened or applied to.',
    env: [
      { name: 'CAMPUS_HIMALAYAS', purpose: 'Set to "on" to include Himalayas.' },
      { name: 'HIMALAYAS_API_KEY', purpose: 'Raises rate limits. Server-side only.' },
    ],
    neverUsedFor: 'Re-publication to other boards, aggregators, Google Jobs or LinkedIn; any personal metric.',
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
