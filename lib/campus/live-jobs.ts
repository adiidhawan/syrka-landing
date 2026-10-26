/**
 * Live openings: real, current job postings read from the public job-board feeds that companies publish through
 * their applicant-tracking systems (Greenhouse, Lever, Ashby). These are the same feeds that power each company's
 * own careers page; they need no API key.
 *
 * Postings do not come with structured skill requirements, so skills are inferred here with deterministic keyword
 * patterns (no AI). The result is labelled "inferred" everywhere it is shown. Only structured fields are kept — no
 * description text is copied; every opening links back to the company's own posting.
 *
 * This file has no framework imports so the extraction can be unit-tested with Node directly.
 */

export type LiveSource = 'greenhouse' | 'lever' | 'ashby'

export interface LiveBoard {
  source: LiveSource
  board: string
  company: string
}

export interface LiveJob {
  id: string
  source: LiveSource
  company: string
  title: string
  location: string
  url: string
  postedAt: string | null
  family: RoleFamily
  /** Smallest number of years of experience the posting asks for; null when it states none. */
  minYears: number | null
  required: string[]
  preferred: string[]
}

export interface LiveJobsResult {
  jobs: LiveJob[]
  fetchedAt: string
  boards: { company: string; source: LiveSource; ok: boolean; count: number }[]
  /** 'live' when read from the feeds, 'snapshot' when every feed failed and the bundled snapshot is shown. */
  origin: 'live' | 'snapshot'
}

export const LIVE_BOARDS: LiveBoard[] = [
  { source: 'greenhouse', board: 'razorpaysoftwareprivatelimited', company: 'Razorpay' },
  { source: 'greenhouse', board: 'groww', company: 'Groww' },
  { source: 'greenhouse', board: 'inmobi', company: 'InMobi' },
  { source: 'greenhouse', board: 'sigmoid', company: 'Sigmoid' },
  { source: 'greenhouse', board: 'druva', company: 'Druva' },
  { source: 'greenhouse', board: 'observeai', company: 'Observe.AI' },
  { source: 'greenhouse', board: 'stripe', company: 'Stripe' },
  { source: 'greenhouse', board: 'mongodb', company: 'MongoDB' },
  { source: 'greenhouse', board: 'databricks', company: 'Databricks' },
  { source: 'greenhouse', board: 'gitlab', company: 'GitLab' },
  { source: 'greenhouse', board: 'okta', company: 'Okta' },
  { source: 'greenhouse', board: 'zscaler', company: 'Zscaler' },
  { source: 'greenhouse', board: 'toast', company: 'Toast' },
  { source: 'greenhouse', board: 'twilio', company: 'Twilio' },
  { source: 'lever', board: 'paytm', company: 'Paytm' },
  { source: 'lever', board: 'meesho', company: 'Meesho' },
  { source: 'lever', board: 'zeta', company: 'Zeta' },
  { source: 'lever', board: 'mindtickle', company: 'Mindtickle' },
  { source: 'lever', board: 'cred', company: 'CRED' },
  { source: 'ashby', board: 'sarvam', company: 'Sarvam AI' },
]

// ── Skill inference ──────────────────────────────────────────────────────────────────────────────────────────────

/**
 * Patterns are tuned to avoid common false positives: "React" must be capitalised (not the verb "react"), "Excel"
 * not followed by "in"/"at" (the verb), "Go" only as "Golang" or in a list. Ids match the demo skill catalogue where
 * the skill exists there, so a student's profile can be compared directly.
 */
export const SKILL_PATTERNS: { id: string; name: string; re: RegExp }[] = [
  { id: 'python', name: 'Python', re: /\bpython\b/i },
  { id: 'java', name: 'Java', re: /\bjava\b(?!\s*script)/i },
  { id: 'javascript', name: 'JavaScript', re: /javascript|ecmascript|\bJS\b/i },
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
  { id: 'data-visualization', name: 'Data visualization', re: /data visuali[sz]ation|tableau|power ?bi|looker|dashboards?\b/i },
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

/** Required level assumed for inferred skills: postings almost never state a level, so these are demo defaults. */
export const INFERRED_LEVELS = { required: 70, preferred: 60 } as const
/** Postings with fewer inferred skills than this are not listed. */
export const MIN_INFERRED_SKILLS = 3

// Headings are matched at the start of a short line, so a bullet such as "Good communication skills" is never
// mistaken for a section change.
const PREFERRED_HEADING = /^(?:nice to have|good to have|preferred|bonus|plus|it would be (?:great|nice)|great if|desirable|what (?:would|will) make you stand out|extra credit)/i
const REQUIRED_HEADING = /^(?:key |basic |minimum |required |technical )?(?:requirements|qualifications|what you(?:'|’)ll (?:need|bring|do)|what we(?:'|’)re looking for|what you bring|must[- ]haves?|about you|who you are|you (?:have|will|are)|responsibilities|the role|your role|skills)/i
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
 * Splits a posting into sections by its headings and assigns each skill mention:
 * mentions under a "nice to have / preferred" heading → preferred; under company, benefits or legal headings →
 * ignored; anywhere else → required. A skill mentioned in both places counts as required.
 */
export function inferSkills(text: string): { required: string[]; preferred: string[] } {
  const required = new Set<string>()
  const preferred = new Set<string>()
  let mode: 'required' | 'preferred' | 'ignored' = 'required'
  for (const raw of text.split('\n')) {
    const line = raw.trim()
    if (!line) continue
    if (line.length <= 60) {
      if (PREFERRED_HEADING.test(line)) mode = 'preferred'
      else if (IGNORED_HEADING.test(line)) mode = 'ignored'
      else if (REQUIRED_HEADING.test(line)) mode = 'required'
    }
    if (mode === 'ignored') continue
    for (const s of SKILL_PATTERNS) if (s.re.test(line)) (mode === 'preferred' ? preferred : required).add(s.id)
  }
  return { required: [...required], preferred: [...preferred].filter(id => !required.has(id)) }
}

/**
 * Years of experience the posting asks for: the first "N years … experience" figure, which is usually the headline
 * requirement (later figures tend to be tool-specific, e.g. "2+ years with Tableau"). For senior titles the highest
 * stated figure is used instead, so a tool-specific line cannot make a senior role look junior. Internships and
 * fresher roles are 0; null when no figure is stated.
 */
/** Titles that signal a senior role whatever the stated experience. */
export function isSeniorTitle(title: string): boolean {
  return /senior|\bsr\.?\b|staff|lead|principal|architect|\b(?:iii|iv)\b|\b[3-5]\b/i.test(title)
}

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

export const INDIA = /india|bengaluru|bangalore|mumbai|pune|hyderabad|gurgaon|gurugram|delhi|noida|chennai|chandigarh|kolkata|ahmedabad|jaipur/i

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

// ── Feed readers ─────────────────────────────────────────────────────────────────────────────────────────────────

interface RawPosting { id: string; title: string; location: string; url: string; postedAt: string | null; text: string }

async function getJson(url: string, timeoutMs: number): Promise<unknown> {
  const res = await fetch(url, { signal: AbortSignal.timeout(timeoutMs), headers: { Accept: 'application/json' }, cache: 'no-store' })
  if (!res.ok) throw new Error(`${res.status} from ${url}`)
  return res.json()
}

type Json = Record<string, unknown>
const str = (v: unknown) => (typeof v === 'string' ? v : '')

async function readBoard(b: LiveBoard, timeoutMs: number): Promise<RawPosting[]> {
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

/** Turns a raw posting into a LiveJob, or null when it is not an Indian technical, data or design role. */
export function toLiveJob(b: LiveBoard, p: RawPosting): LiveJob | null {
  if (!INDIA.test(p.location)) return null
  const family = roleFamily(p.title)
  if (!family || !p.url) return null
  const { required, preferred } = inferSkills(p.text)
  // With fewer than three skills there is too little to compare, and a near-perfect score would mislead.
  if (required.length + preferred.length < MIN_INFERRED_SKILLS) return null
  return {
    id: `${b.source.slice(0, 2)}-${b.board}-${p.id}`.replace(/[^a-zA-Z0-9-]/g, ''),
    source: b.source, company: b.company, title: p.title, location: p.location.replace(/\s+/g, ' ').trim(),
    url: p.url, postedAt: p.postedAt, family, minYears: parseMinYears(p.title, p.text), required, preferred,
  }
}

/** Reads every board in parallel. A board that fails or times out is reported, never fatal. */
export async function fetchLiveJobs(boards: LiveBoard[] = LIVE_BOARDS, timeoutMs = 12_000): Promise<LiveJobsResult> {
  const results = await Promise.allSettled(boards.map(b => readBoard(b, timeoutMs)))
  const jobs: LiveJob[] = []
  const seen = new Set<string>()
  const status = boards.map((b, i) => {
    const r = results[i]
    if (r.status === 'rejected') return { company: b.company, source: b.source, ok: false, count: 0 }
    let count = 0
    for (const p of r.value) {
      const job = toLiveJob(b, p)
      // Companies often post the same role in several cities; keep one per company and title.
      const key = job && `${job.company}|${job.title.toLowerCase()}`
      if (job && key && !seen.has(key)) { seen.add(key); jobs.push(job); count++ }
    }
    return { company: b.company, source: b.source, ok: true, count }
  })
  return { jobs, fetchedAt: new Date().toISOString(), boards: status, origin: 'live' }
}
