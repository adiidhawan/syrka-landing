/**
 * Live external openings for the student portal.
 *
 * Sources, and the terms each is used under:
 * - Himalayas (https://himalayas.app/docs/remote-jobs-api): remote roles open to candidates in India. Its terms
 *   allow display in our own app, commercial use included, provided every listing shows a visible Himalayas credit
 *   with a link, every Apply action uses the API's `applicationLink`, closed jobs (HTTP 410) are removed, and jobs
 *   are never passed on to other boards, aggregators, Google Jobs or LinkedIn (so no JobPosting structured data).
 * - Partner employer boards (Greenhouse, Lever, Ashby): read only for employers listed in CAMPUS_PARTNER_BOARDS,
 *   which must only name employers that have agreed in writing. Their public endpoints exist for the employer's own
 *   careers site, so technical access is not treated as permission. Off by default.
 *
 * Skills are mapped to the SYRKA catalogue by deterministic keyword patterns (no AI) and kept apart by provenance:
 * "stated" skills sit under the posting's own requirements or nice-to-have headings; "extracted" skills only appear
 * elsewhere in the prose. Only stated skills are scored. No description text is stored or shown.
 *
 * This file has no framework imports so it can be unit-tested with Node directly.
 */

export type LiveSource = 'himalayas' | 'greenhouse' | 'lever' | 'ashby'

export interface PartnerBoard {
  source: 'greenhouse' | 'lever' | 'ashby'
  board: string
  company: string
}

export interface LiveJob {
  /** Stable id: `hm--{companySlug}--{jobSlug}` for Himalayas, `{source}--{board}--{id}` for partner boards. */
  id: string
  source: LiveSource
  /** Shown on every card, e.g. "Himalayas" or "Groww careers (partner)". */
  sourceLabel: string
  sourceHome: string
  company: string
  title: string
  location: string
  /** True when the role is open to candidates anywhere; false when restricted to India (or India-based). */
  openWorldwide: boolean
  /** The only link an Apply action may use (Himalayas' applicationLink, or the partner's posting URL). */
  applyUrl: string
  postedAt: string | null
  expiresAt: string | null
  family: RoleFamily
  seniority: string[]
  employmentType: string | null
  /** Years of experience stated in the text; null when none is stated. */
  minYears: number | null
  required: string[]
  preferred: string[]
  extracted: string[]
}

export interface SourceStatus { key: string; label: string; ok: boolean; count: number; error?: string }

export interface LiveJobsResult {
  jobs: LiveJob[]
  fetchedAt: string
  sources: SourceStatus[]
}

export const HIMALAYAS_HOME = 'https://himalayas.app'

/**
 * Partner boards come only from the CAMPUS_PARTNER_BOARDS environment variable, written as
 * `source:board:Company Name` entries separated by commas, e.g. `greenhouse:groww:Groww,lever:meesho:Meesho`.
 * List an employer only after it has agreed in writing to SYRKA showing its openings.
 */
export function parsePartnerBoards(value: string | undefined): PartnerBoard[] {
  return (value ?? '').split(',').map(e => e.trim()).filter(Boolean).flatMap(entry => {
    const [source, board, ...name] = entry.split(':')
    if (source !== 'greenhouse' && source !== 'lever' && source !== 'ashby') return []
    if (!board || !/^[a-z0-9-]+$/i.test(board)) return []
    return [{ source, board, company: name.join(':').trim() || board }]
  })
}

// ── Skill mapping ────────────────────────────────────────────────────────────────────────────────────────────────

/**
 * Patterns are tuned to avoid common false positives: "React" must be capitalised (not the verb "react"), "Excel"
 * not followed by "in"/"at" (the verb), "Go" only as "Golang" or in a list. Ids match the demo skill catalogue where
 * the skill exists there, so a student's profile can be compared directly.
 */
export const SKILL_PATTERNS: { id: string; name: string; re: RegExp }[] = [
  { id: 'python', name: 'Python', re: /\bpython\b/i },
  { id: 'java', name: 'Java', re: /\bjava\b(?!\s*script)/i },
  { id: 'javascript', name: 'JavaScript', re: /javascript|ecmascript|(?<![.\w])JS\b/i },
  { id: 'typescript', name: 'TypeScript', re: /typescript/i },
  { id: 'golang', name: 'Go', re: /\bgolang\b|\bGo(?=\s*(?:,|\/|\)|\band\b|\bor\b))/ },
  { id: 'cpp', name: 'C++', re: /c\+\+/i },
  { id: 'kotlin', name: 'Kotlin', re: /\bkotlin\b/i },
  { id: 'react', name: 'React', re: /\bReact(?:\.js|JS| Native)?\b/ },
  { id: 'nextjs', name: 'Next.js', re: /next\.?js\b/i },
  { id: 'html-css', name: 'HTML & CSS', re: /\bhtml5?\b|\bcss3?\b/i },
  { id: 'frontend-testing', name: 'Frontend testing', re: /\bjest\b|testing library|cypress|playwright/i },
  { id: 'nodejs', name: 'Node.js', re: /node\.?js/i },
  { id: 'api-development', name: 'API development', re: /\brest(?:ful)?\b(?:\s+api)?|\bgrpc\b|\bgraphql\b|api (?:design|development)|build(?:ing)? apis/i },
  { id: 'system-design', name: 'System design', re: /system design|distributed systems|scalable (?:systems|services|architecture)|high[- ]scale/i },
  { id: 'docker', name: 'Docker', re: /\bdocker\b|containeri[sz]/i },
  { id: 'kubernetes', name: 'Kubernetes', re: /kubernetes|\bk8s\b/i },
  { id: 'cloud-platforms', name: 'Cloud platforms', re: /\baws\b|amazon web services|\bgcp\b|google cloud|\bazure\b/i },
  { id: 'software-testing', name: 'Software testing', re: /unit test|test automation|automated test|selenium|testing frameworks?/i },
  { id: 'sql', name: 'SQL', re: /\bsql\b|postgres|mysql/i },
  { id: 'spark', name: 'Spark', re: /\b(?:py)?spark\b/i },
  { id: 'kafka', name: 'Kafka', re: /\bkafka\b/i },
  { id: 'pandas', name: 'pandas', re: /\bpandas\b/i },
  { id: 'data-visualization', name: 'Data visualization', re: /data visuali[sz]ation|tableau|power ?bi|looker|dashboarding/i },
  { id: 'excel', name: 'Excel', re: /(?<!\bto )\bexcel\b(?!\s+(?:in|at|as)\b)/i },
  { id: 'statistics', name: 'Statistics', re: /\bstatistic(?:s|al)\b/i },
  { id: 'machine-learning', name: 'Machine learning', re: /machine learning|deep learning|\bML\b/ },
  { id: 'model-evaluation', name: 'Model evaluation', re: /model evaluation|evaluat(?:e|ing) models|offline evaluation|evals?\b(?= )/i },
  { id: 'nlp', name: 'NLP', re: /\bnlp\b|natural language processing|\bLLMs?\b|large language models?/i },
  { id: 'figma', name: 'Figma', re: /\bfigma\b/i },
  { id: 'interaction-design', name: 'Interaction design', re: /interaction design|ux design|user experience design/i },
  { id: 'user-research', name: 'User research', re: /user research|usability test/i },
  { id: 'prototyping', name: 'Prototyping', re: /prototyp/i },
  { id: 'problem-solving', name: 'Problem solving', re: /problem[- ]solving/i },
  { id: 'communication', name: 'Communication', re: /communication skills|written and verbal|verbal and written|communicate (?:clearly|effectively)/i },
  { id: 'git', name: 'Git', re: /\bgit\b|github|version control/i },
]

export const LIVE_SKILL_NAMES: Record<string, string> = Object.fromEntries(SKILL_PATTERNS.map(s => [s.id, s.name]))

/** Postings rarely state proficiency levels, so stated skills are scored at these assumed demo levels. */
export const ASSUMED_LEVELS = { required: 70, preferred: 60 } as const
/** Fewer stated skills than this and a posting is shown with "limited source detail" instead of a score. */
export const MIN_STATED_SKILLS = 3

// Headings are matched at the start of a short line, so a bullet such as "Good communication skills" is never
// mistaken for a section change.
const PREFERRED_HEADING = /^(?:nice to have|good to have|preferred|bonus|plus|it would be (?:great|nice)|great if|desirable|what (?:would|will) make you stand out|extra credit)/i
const REQUIRED_HEADING = /^(?:key |basic |minimum |required |technical |core )?(?:requirements|qualifications|what you(?:'|’)ll need|what you(?:'|’)ll bring|what we(?:'|’)re looking for|what you bring|must[- ]haves?|about you|who you are|you have|skills|tech(?:nical)? stack|tools)/i
const PROSE_HEADING = /^(?:responsibilities|key responsibilities|what you(?:'|’)ll do|the role|your role|about the role|role overview|job brief|job description|overview|day to day|in this role)/i
const IGNORED_HEADING = /^(?:about (?!you|the role|the team|this role)|benefits|perks|what we offer|why join|equal (?:employment )?opportunit|our (?:culture|values|commitment)|life at|compensation|privacy|who we are|how we work)/i

export function htmlToText(html: string): string {
  return decodeEntities(html)
    .replace(/<\s*(?:br|\/p|\/li|\/h\d|\/div|li|h\d)[^>]*>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[ \t ]+/g, ' ')
    .replace(/\n\s*/g, '\n')
    .trim()
}

function decodeEntities(s: string): string {
  return s
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'")
    .replace(/&nbsp;/g, ' ').replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&amp;/g, '&')
}

/**
 * Maps skill mentions to the catalogue and records where each came from:
 * - under a requirements / qualifications / skills heading → stated required;
 * - under a nice-to-have / preferred heading → stated preferred;
 * - anywhere else in the posting (role overview, responsibilities, untitled prose) → extracted;
 * - under company, benefits or legal headings → ignored.
 * A skill keeps its strongest provenance: stated required, then stated preferred, then extracted.
 */
export function mapSkills(text: string): { required: string[]; preferred: string[]; extracted: string[] } {
  const required = new Set<string>()
  const preferred = new Set<string>()
  const extracted = new Set<string>()
  let mode: 'required' | 'preferred' | 'prose' | 'ignored' = 'prose'
  for (const raw of text.split('\n')) {
    const line = raw.trim()
    if (!line) continue
    if (line.length <= 60) {
      if (PREFERRED_HEADING.test(line)) mode = 'preferred'
      else if (IGNORED_HEADING.test(line)) mode = 'ignored'
      else if (REQUIRED_HEADING.test(line)) mode = 'required'
      else if (PROSE_HEADING.test(line)) mode = 'prose'
    }
    if (mode === 'ignored') continue
    for (const s of SKILL_PATTERNS) if (s.re.test(line)) (mode === 'required' ? required : mode === 'preferred' ? preferred : extracted).add(s.id)
  }
  return {
    required: [...required],
    preferred: [...preferred].filter(id => !required.has(id)),
    extracted: [...extracted].filter(id => !required.has(id) && !preferred.has(id)),
  }
}

/** Titles that signal a senior role whatever the stated experience. */
export function isSeniorTitle(title: string): boolean {
  return /senior|\bsr\.?\b|staff|lead|principal|architect|\b(?:iii|iv)\b|\b[3-5]\b/i.test(title)
}

/**
 * Years of experience the posting asks for: the first "N years … experience" figure, which is usually the headline
 * requirement (later figures tend to be tool-specific, e.g. "2+ years with Tableau"). For senior titles the highest
 * stated figure is used instead, so a tool-specific line cannot make a senior role look junior. Internships and
 * fresher roles are 0; null when no figure is stated.
 */
export function parseMinYears(title: string, text: string): number | null {
  if (/\bintern(ship)?\b|fresher|new grad|graduate (?:engineer|program)|campus hire/i.test(title)) return 0
  const figures: number[] = []
  const re = /(\d{1,2})\s*\+?\s*(?:(?:-|–|to)\s*\d{1,2}\s*\+?\s*)?(?:years?|yrs?)\b/gi
  for (const m of text.matchAll(re)) {
    const ctx = text.slice(Math.max(0, (m.index ?? 0) - 40), (m.index ?? 0) + m[0].length + 60)
    const n = Number(m[1])
    if (n <= 30 && /experience|exp\b|background/i.test(ctx)) figures.push(n)
  }
  if (!figures.length) return null
  return isSeniorTitle(title) ? Math.max(...figures) : figures[0]
}

export type RoleFamily = 'frontend' | 'backend' | 'fullstack' | 'mobile' | 'data_analyst' | 'data_engineer' | 'ml' | 'design' | 'platform' | 'qa' | 'other_eng'

export const FAMILY_LABEL: Record<RoleFamily, string> = {
  frontend: 'Frontend', backend: 'Backend', fullstack: 'Full-stack', mobile: 'Mobile', data_analyst: 'Data and analytics',
  data_engineer: 'Data engineering', ml: 'AI and ML', design: 'Design', platform: 'Platform and DevOps', qa: 'Quality engineering', other_eng: 'Software engineering',
}

/** Classifies a job title into a role family, or null when it is not a technical, data or design role. */
export function roleFamily(title: string): RoleFamily | null {
  const t = title.toLowerCase()
  if (/director|vice president|\bvp\b|head of|\bmanager\b|account executive|sales|recruit|counsel|marketing|finance|legal|partner|learning (?:&|and) development|consultant/.test(t)) return null
  if (/designer|\bux\b|\bui\/ux\b/.test(t)) return 'design'
  if (/machine learning|\bml\b|\bai\b|data scientist|applied scientist|research (?:engineer|scientist)|\bnlp\b|llm/.test(t)) return 'ml'
  if (/data engineer|analytics engineer|big data/.test(t)) return 'data_engineer'
  if (/analyst|business intelligence|\bbi\b/.test(t)) return 'data_analyst'
  if (/front[- ]?end|\bui engineer|react/.test(t)) return 'frontend'
  if (/full[- ]?stack/.test(t)) return 'fullstack'
  if (/android|\bios\b|mobile/.test(t)) return 'mobile'
  if (/back[- ]?end|server|java developer|golang|python developer/.test(t)) return 'backend'
  if (/devops|\bsre\b|site reliability|platform|infrastructure|cloud engineer|security engineer/.test(t)) return 'platform'
  if (/\bqa\b|\bsdet\b|quality|test engineer|automation engineer/.test(t)) return 'qa'
  if (/engineer|developer|\bsde\b/.test(t)) return 'other_eng'
  return null
}

// ── Readers ──────────────────────────────────────────────────────────────────────────────────────────────────────

type Json = Record<string, unknown>
const str = (v: unknown) => (typeof v === 'string' ? v : '')
const strs = (v: unknown) => (Array.isArray(v) ? v.map(x => (typeof x === 'string' ? x : str((x as Json)?.name))).filter(Boolean) : [])
const fromUnix = (v: unknown) => (typeof v === 'number' && v > 0 ? new Date(v * 1000).toISOString() : null)

async function getJson(url: string, timeoutMs: number, headers: Record<string, string> = {}): Promise<unknown> {
  const res = await fetch(url, { signal: AbortSignal.timeout(timeoutMs), headers: { Accept: 'application/json', ...headers }, cache: 'no-store' })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

/** Searches run for each query against India-eligible, entry-level roles; a few pages each. */
export const HIMALAYAS_QUERIES = [
  'software engineer', 'developer', 'frontend', 'backend', 'full stack', 'mobile', 'data analyst', 'data scientist',
  'machine learning', 'data engineer', 'designer', 'devops', 'qa', 'intern',
]
const HIMALAYAS_MAX_PAGES = 5
const HIMALAYAS_CONCURRENCY = 4

// Talent-pool and evergreen posts are not openings.
const NOT_AN_OPENING = /future (?:position|opening|opportunit)|talent (?:pool|community|network)|general application|expression of interest/i

export function himalayasIdFromGuid(guid: string): string | null {
  const m = guid.match(/companies\/([a-z0-9-]+)\/jobs\/([a-z0-9-]+)/i)
  return m ? `hm--${m[1]}--${m[2]}` : null
}

export function himalayasPathFromId(id: string): string | null {
  const m = id.match(/^hm--([a-z0-9-]+?)--([a-z0-9-]+)$/i)
  return m ? `companies/${m[1]}/jobs/${m[2]}` : null
}

/** Normalises one Himalayas job, or null when it is not a technical, data or design opening open to India. */
export function himalayasToLiveJob(j: Json): LiveJob | null {
  const guid = str(j.guid)
  const id = himalayasIdFromGuid(guid)
  const title = str(j.title).trim()
  const applyUrl = str(j.applicationLink)
  if (!id || !title || !applyUrl || NOT_AN_OPENING.test(title)) return null
  const family = roleFamily(title)
  const employmentType = str(j.employmentType) || null
  if (!family || employmentType === 'Volunteer' || employmentType === 'Other') return null
  const countries = strs(j.locationRestrictions)
  if (countries.length && !countries.some(c => /india/i.test(c))) return null
  const text = htmlToText(str(j.description))
  const skills = mapSkills(text)
  if (skills.required.length + skills.preferred.length + skills.extracted.length === 0) return null
  return {
    id, source: 'himalayas', sourceLabel: 'Himalayas', sourceHome: HIMALAYAS_HOME,
    company: str(j.companyName) || 'Company not named', title,
    location: countries.length ? `Remote · ${countries.join(', ')}` : 'Remote · open worldwide', openWorldwide: countries.length === 0,
    applyUrl, postedAt: fromUnix(j.pubDate), expiresAt: fromUnix(j.expiryDate), family,
    seniority: strs(j.seniority), employmentType, minYears: parseMinYears(title, text), ...skills,
  }
}

async function readHimalayas(timeoutMs: number, apiKey: string | undefined, seniority: string[], maxPages: number): Promise<LiveJob[]> {
  const headers: Record<string, string> = apiKey ? { Authorization: `Bearer ${apiKey}` } : {}
  const queue = [...HIMALAYAS_QUERIES]
  const pages: Json[][] = []
  let failures = 0
  // A few queries at a time; each query pages until it runs out of results or reaches the page cap.
  const worker = async () => {
    for (let q = queue.shift(); q !== undefined; q = queue.shift()) {
      for (let page = 1; page <= maxPages; page++) {
        try {
          const d = await getJson(`${HIMALAYAS_HOME}/jobs/api/search?q=${encodeURIComponent(q)}&country=IN${seniority.map(v => `&seniority=${encodeURIComponent(v)}`).join('')}&page=${page}`, timeoutMs, headers) as { jobs?: Json[] }
          pages.push(d.jobs ?? [])
          if ((d.jobs ?? []).length < 20) break
        } catch {
          failures++
          break
        }
      }
    }
  }
  await Promise.all(Array.from({ length: HIMALAYAS_CONCURRENCY }, worker))
  if (!pages.length) throw new Error(`Himalayas unreachable (${failures} failed requests)`)
  const now = Date.now()
  const out: LiveJob[] = []
  for (const jobs of pages) {
    for (const j of jobs) {
      const job = himalayasToLiveJob(j)
      if (job && (!job.expiresAt || Date.parse(job.expiresAt) > now)) out.push(job)
    }
  }
  return out
}

interface RawPosting { id: string; title: string; location: string; url: string; postedAt: string | null; text: string }

async function readBoard(b: PartnerBoard, timeoutMs: number): Promise<RawPosting[]> {
  if (b.source === 'greenhouse') {
    const d = await getJson(`https://boards-api.greenhouse.io/v1/boards/${b.board}/jobs?content=true`, timeoutMs) as { jobs?: Json[] }
    return (d.jobs ?? []).map(j => ({
      id: String(j.id), title: str(j.title).trim(), location: str((j.location as Json | undefined)?.name),
      url: str(j.absolute_url), postedAt: str(j.updated_at) || null, text: htmlToText(str(j.content)),
    }))
  }
  if (b.source === 'lever') {
    const d = await getJson(`https://api.lever.co/v0/postings/${b.board}?mode=json`, timeoutMs) as Json[]
    return (Array.isArray(d) ? d : []).map(j => {
      const lists = (j.lists as Json[] | undefined) ?? []
      const text = [str(j.descriptionPlain), ...lists.map(l => `${str(l.text)}\n${htmlToText(str(l.content))}`), str(j.additionalPlain)].join('\n')
      return {
        id: str(j.id), title: str(j.text).trim(), location: str((j.categories as Json | undefined)?.location),
        url: str(j.hostedUrl), postedAt: typeof j.createdAt === 'number' ? new Date(j.createdAt).toISOString() : null, text,
      }
    })
  }
  const d = await getJson(`https://api.ashbyhq.com/posting-api/job-board/${b.board}`, timeoutMs) as { jobs?: Json[] }
  return (d.jobs ?? []).filter(j => j.isListed !== false).map(j => ({
    id: str(j.id), title: str(j.title).trim(), location: [str(j.location), ...(((j.secondaryLocations as Json[] | undefined) ?? []).map(l => str(l.location)))].join(', '),
    url: str(j.jobUrl), postedAt: str(j.publishedAt) || null, text: htmlToText(str(j.descriptionHtml)) || str(j.descriptionPlain),
  }))
}

export const INDIA = /india|bengaluru|bangalore|mumbai|pune|hyderabad|gurgaon|gurugram|delhi|noida|chennai|chandigarh|kolkata|ahmedabad|jaipur/i

/** Normalises a partner posting, or null when it is not an Indian technical, data or design role. */
export function partnerToLiveJob(b: PartnerBoard, p: RawPosting): LiveJob | null {
  if (!INDIA.test(p.location)) return null
  const family = roleFamily(p.title)
  if (!family || !p.url) return null
  const skills = mapSkills(p.text)
  if (skills.required.length + skills.preferred.length + skills.extracted.length === 0) return null
  return {
    id: `${b.source}--${b.board}--${p.id}`.replace(/[^a-zA-Z0-9-]/g, ''),
    source: b.source, sourceLabel: `${b.company} careers (partner)`, sourceHome: p.url,
    company: b.company, title: p.title, location: p.location.replace(/\s+/g, ' ').trim(), openWorldwide: false,
    applyUrl: p.url, postedAt: p.postedAt, expiresAt: null, family, seniority: [], employmentType: null,
    minYears: parseMinYears(p.title, p.text), ...skills,
  }
}

/**
 * Reads Himalayas and any allow-listed partner boards in parallel. A failing source is reported in `sources`; the
 * call only throws when every source fails, so a cache keeps serving the last good result instead.
 */
export async function fetchLiveJobs(opts: {
  partners?: PartnerBoard[]
  himalayasKey?: string
  timeoutMs?: number
  /** Himalayas seniority levels to read. The student list uses entry level; calibration also reads mid level. */
  seniority?: string[]
  maxPages?: number
} = {}): Promise<LiveJobsResult> {
  const { partners = [], himalayasKey, timeoutMs = 12_000, seniority = ['Entry-level'], maxPages = HIMALAYAS_MAX_PAGES } = opts
  const tasks: { key: string; label: string; run: () => Promise<LiveJob[]> }[] = [
    { key: 'himalayas', label: 'Himalayas', run: () => readHimalayas(timeoutMs, himalayasKey, seniority, maxPages) },
    ...partners.map(b => ({
      key: `${b.source}:${b.board}`, label: `${b.company} (partner)`,
      run: async () => (await readBoard(b, timeoutMs)).map(p => partnerToLiveJob(b, p)).filter((j): j is LiveJob => j !== null),
    })),
  ]
  const results = await Promise.allSettled(tasks.map(t => t.run()))
  if (results.every(r => r.status === 'rejected')) throw new Error('No live job source responded')
  const jobs: LiveJob[] = []
  const seenId = new Set<string>()
  const seenRole = new Set<string>()
  const sources = tasks.map((t, i) => {
    const r = results[i]
    if (r.status === 'rejected') return { key: t.key, label: t.label, ok: false, count: 0, error: String(r.reason?.message ?? r.reason) }
    let count = 0
    for (const job of r.value) {
      // Exact duplicates share an id; the same role posted twice shares company and title (ignoring punctuation).
      const role = `${job.company}|${job.title}`.toLowerCase().replace(/[^a-z0-9|]/g, '')
      if (seenId.has(job.id) || seenRole.has(role)) continue
      seenId.add(job.id); seenRole.add(role); jobs.push(job); count++
    }
    return { key: t.key, label: t.label, ok: true, count }
  })
  return { jobs, fetchedAt: new Date().toISOString(), sources }
}

export type ClosureCheck = { status: 'open'; job: LiveJob | null; checkedAt: string } | { status: 'closed' | 'missing' | 'unknown'; checkedAt: string }

/**
 * Asks Himalayas whether one job is still open (200 open, 410 closed, 404 missing). Partner jobs and network
 * errors return 'unknown', which callers treat as "show the last seen data with its age".
 */
export async function checkLiveJob(id: string, opts: { himalayasKey?: string; timeoutMs?: number } = {}): Promise<ClosureCheck> {
  const checkedAt = new Date().toISOString()
  const path = himalayasPathFromId(id)
  if (!path) return { status: 'unknown', checkedAt }
  try {
    const res = await fetch(`${HIMALAYAS_HOME}/jobs/api/${path}`, {
      signal: AbortSignal.timeout(opts.timeoutMs ?? 8_000),
      headers: { Accept: 'application/json', ...(opts.himalayasKey ? { Authorization: `Bearer ${opts.himalayasKey}` } : {}) },
      next: { revalidate: 600 },
    } as RequestInit)
    if (res.status === 410) return { status: 'closed', checkedAt }
    if (res.status === 404) return { status: 'missing', checkedAt }
    if (!res.ok) return { status: 'unknown', checkedAt }
    const body = await res.json() as { job?: Json }
    return { status: 'open', job: body.job ? himalayasToLiveJob(body.job) : null, checkedAt }
  } catch {
    return { status: 'unknown', checkedAt }
  }
}
