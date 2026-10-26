import type { LiveJob, RoleFamily } from './live-jobs'

/**
 * Live market demand: how many current external openings mention each skill. Computed only from live job records;
 * it describes job postings, never a student's proficiency.
 *
 * "Stated" counts roles that list the skill under their own requirement headings; "extracted" counts roles that only
 * mention it elsewhere in the description. A role counts once per skill, in the stronger of the two.
 */

export interface SkillDemand {
  skillId: string
  stated: number
  extracted: number
  total: number
  /** Roles restricted to candidates in India (the rest are open worldwide, India included). */
  indiaOnly: number
  internship: number
  fullTime: number
  /** Most common role categories among those roles, largest first. */
  families: { family: RoleFamily; count: number }[]
  /** Up to three example roles, stated ones first. */
  examples: { id: string; title: string; company: string; stated: boolean }[]
}

export interface DemandSnapshot {
  /** UTC date the snapshot describes (YYYY-MM-DD). */
  date: string
  fetchedAt: string
  totalJobs: number
  skills: Record<string, { stated: number; extracted: number }>
}

export interface MarketDemand {
  totalJobs: number
  fetchedAt: string
  skills: Record<string, SkillDemand>
  /** Per role family: number of live roles and how many mention each skill. */
  families: Partial<Record<RoleFamily, { roles: number; skills: Record<string, number> }>>
}

const isInternship = (j: LiveJob) => j.employmentType === 'Intern' || /\bintern(ship)?\b/i.test(j.title)

export function computeDemand(jobs: LiveJob[], fetchedAt: string): MarketDemand {
  const skills: Record<string, SkillDemand> = {}
  const families: MarketDemand['families'] = {}
  const familyCounts: Record<string, Map<RoleFamily, number>> = {}

  for (const job of jobs) {
    const fam = (families[job.family] ??= { roles: 0, skills: {} })
    fam.roles++
    const stated = new Set([...job.required, ...job.preferred])
    const all = new Set([...stated, ...job.extracted])
    for (const id of all) {
      fam.skills[id] = (fam.skills[id] ?? 0) + 1
      const d = (skills[id] ??= { skillId: id, stated: 0, extracted: 0, total: 0, indiaOnly: 0, internship: 0, fullTime: 0, families: [], examples: [] })
      const isStated = stated.has(id)
      if (isStated) d.stated++
      else d.extracted++
      d.total++
      if (!job.openWorldwide) d.indiaOnly++
      if (isInternship(job)) d.internship++
      else if (job.employmentType === 'Full Time') d.fullTime++
      const fc = (familyCounts[id] ??= new Map())
      fc.set(job.family, (fc.get(job.family) ?? 0) + 1)
      d.examples.push({ id: job.id, title: job.title, company: job.company, stated: isStated })
    }
  }
  for (const d of Object.values(skills)) {
    d.families = [...familyCounts[d.skillId].entries()].map(([family, count]) => ({ family, count })).sort((a, b) => b.count - a.count || a.family.localeCompare(b.family)).slice(0, 3)
    d.examples = d.examples.sort((a, b) => Number(b.stated) - Number(a.stated)).slice(0, 3)
  }
  return { totalJobs: jobs.length, fetchedAt, skills, families }
}

export function toSnapshot(demand: MarketDemand): DemandSnapshot {
  return {
    date: demand.fetchedAt.slice(0, 10),
    fetchedAt: demand.fetchedAt,
    totalJobs: demand.totalJobs,
    skills: Object.fromEntries(Object.values(demand.skills).map(d => [d.skillId, { stated: d.stated, extracted: d.extracted }])),
  }
}

/**
 * The snapshot to compare against: the one taken 7 days before `date`, allowing a day either side for a missed
 * run. Returns null when no such snapshot exists, so no trend is ever shown without real history.
 */
export function priorWeekSnapshot(snapshots: DemandSnapshot[], date: string): DemandSnapshot | null {
  const target = Date.parse(`${date}T00:00:00Z`) - 7 * 86_400_000
  const candidates = snapshots
    .map(s => ({ s, diff: Math.abs(Date.parse(`${s.date}T00:00:00Z`) - target) }))
    .filter(c => Number.isFinite(c.diff) && c.diff <= 86_400_000)
    .sort((a, b) => a.diff - b.diff)
  return candidates[0]?.s ?? null
}

/** Change in the number of roles mentioning a skill versus the prior-week snapshot; null without history. */
export function weeklyChange(current: SkillDemand | undefined, prior: DemandSnapshot | null, skillId: string): number | null {
  if (!prior) return null
  const before = prior.skills[skillId]
  const now = current ? current.total : 0
  return now - (before ? before.stated + before.extracted : 0)
}
