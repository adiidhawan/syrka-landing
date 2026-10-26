import type { EvidenceType, VerificationStatus } from './types'

/**
 * SYRKA explainable matching engine — shared by the student portal (job recommendations) and the employer portal
 * (candidate ranking). Deterministic and pure: the same inputs always give the same result.
 *
 * ── Scoring formula ────────────────────────────────────────────────────────────────────────────────────────────
 *
 *   score = Σ weightᵢ × coverageᵢ × 100, over the components that apply to the job
 *
 *   Component                  Base weight   Coverage (0–1)
 *   Required skill coverage        60%       mean requirement credit over required skills
 *   Preferred skill coverage       20%       mean requirement credit over preferred skills
 *   Project evidence               10%       mean, over the evidence skills, of: 1 if a faculty-reviewed project
 *                                            demonstrates the skill, 0.6 if only an unreviewed project does, else 0
 *   Verified assessment evidence   10%       share of the evidence skills whose claim is verified by an assessment,
 *                                            the institution or an employer
 *
 *   Requirement credit = 1 when proficiency ≥ the required level, otherwise proficiency ÷ required level
 *   (partial credit), and 0 when the skill is absent.
 *
 *   "Evidence skills" are the job's required skills, or its preferred skills when it has no required ones.
 *
 *   Weights are re-normalised over the components that apply: a job with no preferred skills, or one whose
 *   evidence policy excludes projects or assessments, spreads that weight proportionally over the rest.
 *
 * ── Rules ──────────────────────────────────────────────────────────────────────────────────────────────────────
 *
 * - Skills are compared by normalised identifier, so "Next.js", "nextjs" and "NEXTJS" are the same skill.
 * - Self-reported and verified claims earn the same requirement credit for the proficiency they state; the
 *   difference is carried by the two evidence components and by the confidence rating. Penalising self-reports in
 *   the coverage components as well would count the same missing evidence twice.
 * - Each piece of evidence counts in one place only: a faculty project review counts as project evidence, never as
 *   assessment evidence. Evidence components are shares of the job's skills, so more profile entries or more
 *   projects never add points by themselves.
 * - A missing skill or missing evidence lowers the score and the confidence; it is reported as "not shown", never
 *   as proof that the candidate cannot do it.
 * - The engine sees only skills, proficiency, evidence and projects. University, CGPA, name, location and any
 *   personal or sensitive attribute are not inputs, so they cannot affect the result.
 *
 * The weights are initial demo assumptions, not validated hiring criteria. The score measures how well a profile
 * aligns with a job's stated requirements; it is not a probability of success in the role.
 */

export const BASE_WEIGHTS = { required: 0.6, preferred: 0.2, projects: 0.1, assessments: 0.1 } as const
/** Credit for a skill demonstrated only in a project nobody has reviewed yet. */
export const UNREVIEWED_PROJECT_CREDIT = 0.6

export type ComponentKey = keyof typeof BASE_WEIGHTS

const VERIFIED_EXTERNALLY: EvidenceType[] = ['assessment_verified', 'institution_verified', 'employer_verified']

export interface CandidateSkillInput {
  skillId: string
  proficiency: number
  evidenceType: EvidenceType
  verificationStatus: VerificationStatus
}

export interface CandidateProjectInput {
  id: string
  name: string
  verificationStatus: VerificationStatus
  skillIds: string[]
}

export interface CandidateInput {
  skills: CandidateSkillInput[]
  projects: CandidateProjectInput[]
}

export interface RequirementInput {
  skillId: string
  name: string
  minProficiency: number
}

export interface JobRequirementsInput {
  required: RequirementInput[]
  preferred: RequirementInput[]
  evidencePolicy?: { projects: boolean; assessments: boolean }
}

export interface MatchOptions {
  /** Skill ids that have an in-app sample assessment, so improvements can point to it. */
  assessableSkillIds?: string[]
}

export type RequirementStatus = 'met' | 'partial' | 'missing'

export interface RequirementResult {
  skillId: string
  name: string
  kind: 'required' | 'preferred'
  minProficiency: number
  proficiency: number | null
  evidenceType: EvidenceType | null
  /** Verified by an assessment, the institution or an employer. */
  externallyVerified: boolean
  credit: number
  status: RequirementStatus
  projects: { id: string; name: string; reviewed: boolean }[]
}

export interface ComponentResult {
  key: ComponentKey
  label: string
  baseWeight: number
  /** Weight after re-normalisation; 0 when the component does not apply to this job. */
  weight: number
  applies: boolean
  coverage: number
  points: number
  detail: string
}

export interface Improvement {
  skillId: string
  name: string
  kind: 'required' | 'preferred'
  reason: 'missing' | 'below_level' | 'unverified' | 'no_project'
  /** Neutral description of the gap, suitable for an employer. */
  gap: string
  /** Advice addressed to the candidate. */
  advice: string
  action?: { type: 'assessment'; skillId: string } | { type: 'project'; skillId: string } | { type: 'add_skill'; skillId: string }
}

export interface MatchResult {
  status: 'ok' | 'no_requirements'
  score: number
  components: ComponentResult[]
  required: RequirementResult[]
  preferred: RequirementResult[]
  summary: {
    requiredMet: number
    requiredPartial: number
    requiredMissing: number
    requiredTotal: number
    preferredMet: number
    preferredTotal: number
  }
  projectEvidence: { id: string; name: string; reviewed: boolean; skills: string[] }[]
  assessmentEvidence: { skillId: string; name: string; evidenceType: EvidenceType }[]
  confidence: 'high' | 'medium' | 'low'
  confidenceNote: string
  improvements: Improvement[]
  explanation: string[]
  limitations: string[]
}

export const MATCH_LIMITATIONS = [
  'The score measures alignment with this job’s stated requirements. It is not a prediction of job performance or the probability of being hired.',
  'Weights (60 / 20 / 10 / 10) are initial demo assumptions and have not been validated as hiring criteria.',
  'Sample assessments are five questions long and only show what was answered on one occasion.',
  'Skills a candidate has not added are treated as not shown, not as skills they lack.',
  'University, CGPA and personal characteristics are not used in the calculation.',
]

/** Lower-cases and strips punctuation/spacing so different spellings of one skill compare equal. */
export function normalizeSkillKey(value: string): string {
  return value.toLowerCase().normalize('NFKD').replace(/[^a-z0-9+#]/g, '')
}

/** Resolves free text ("Next js", "postgres") to a catalogue skill id via its id, name or aliases. */
export function resolveSkillId(text: string, catalogue: { id: string; name: string; aliases?: string[] }[]): string | undefined {
  const key = normalizeSkillKey(text)
  if (!key) return undefined
  return catalogue.find(s => [s.id, s.name, ...(s.aliases ?? [])].some(v => normalizeSkillKey(v) === key))?.id
}

const clamp01 = (n: number) => (Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : 0)
const pct = (n: number) => `${Math.round(n * 100)}%`
const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0)

function requirementCredit(proficiency: number | null, min: number): number {
  if (proficiency === null || proficiency <= 0) return 0
  if (min <= 0) return 1
  return clamp01(proficiency / min)
}

export function calculateCandidateMatch(candidate: CandidateInput, job: JobRequirementsInput, options: MatchOptions = {}): MatchResult {
  const assessable = new Set((options.assessableSkillIds ?? []).map(normalizeSkillKey))
  const policy = job.evidencePolicy ?? { projects: true, assessments: true }

  // Index candidate data by normalised skill key. If a skill appears twice, keep the stronger claim.
  const skills = new Map<string, CandidateSkillInput>()
  for (const s of candidate.skills ?? []) {
    const key = normalizeSkillKey(s.skillId)
    const prev = skills.get(key)
    if (!prev || s.proficiency > prev.proficiency) skills.set(key, s)
  }
  const projectsBySkill = new Map<string, CandidateProjectInput[]>()
  for (const p of candidate.projects ?? []) {
    for (const sid of new Set(p.skillIds.map(normalizeSkillKey))) {
      projectsBySkill.set(sid, [...(projectsBySkill.get(sid) ?? []), p])
    }
  }

  const evaluate = (r: RequirementInput, kind: 'required' | 'preferred'): RequirementResult => {
    const key = normalizeSkillKey(r.skillId)
    const s = skills.get(key)
    const proficiency = s ? Math.max(0, Math.min(100, s.proficiency)) : null
    const credit = requirementCredit(proficiency, r.minProficiency)
    return {
      skillId: r.skillId, name: r.name, kind, minProficiency: r.minProficiency,
      proficiency, evidenceType: s?.evidenceType ?? null,
      externallyVerified: !!s && s.verificationStatus === 'verified' && VERIFIED_EXTERNALLY.includes(s.evidenceType),
      credit,
      status: proficiency === null || credit === 0 ? 'missing' : credit >= 1 ? 'met' : 'partial',
      projects: (projectsBySkill.get(key) ?? []).map(p => ({ id: p.id, name: p.name, reviewed: p.verificationStatus === 'verified' })),
    }
  }

  // De-duplicate requirements by normalised skill; a skill listed as required is not also scored as preferred.
  const seen = new Set<string>()
  const dedupe = (list: RequirementInput[]) => (list ?? []).filter(r => {
    const k = normalizeSkillKey(r.skillId)
    if (!k || seen.has(k)) return false
    seen.add(k)
    return true
  })
  const required = dedupe(job.required).map(r => evaluate(r, 'required'))
  const preferred = dedupe(job.preferred).map(r => evaluate(r, 'preferred'))
  const evidenceBase = required.length ? required : preferred

  const projectCredit = (r: RequirementResult) => (r.projects.some(p => p.reviewed) ? 1 : r.projects.length ? UNREVIEWED_PROJECT_CREDIT : 0)

  const raw: Omit<ComponentResult, 'weight' | 'points'>[] = [
    {
      key: 'required', label: 'Required skills', baseWeight: BASE_WEIGHTS.required, applies: required.length > 0,
      coverage: mean(required.map(r => r.credit)),
      detail: `${required.filter(r => r.status === 'met').length} of ${required.length} met in full, ${required.filter(r => r.status === 'partial').length} partly`,
    },
    {
      key: 'preferred', label: 'Preferred skills', baseWeight: BASE_WEIGHTS.preferred, applies: preferred.length > 0,
      coverage: mean(preferred.map(r => r.credit)),
      detail: `${preferred.filter(r => r.status === 'met').length} of ${preferred.length} met in full, ${preferred.filter(r => r.status === 'partial').length} partly`,
    },
    {
      key: 'projects', label: 'Project evidence', baseWeight: BASE_WEIGHTS.projects, applies: policy.projects && evidenceBase.length > 0,
      coverage: mean(evidenceBase.map(projectCredit)),
      detail: `${evidenceBase.filter(r => r.projects.some(p => p.reviewed)).length} of ${evidenceBase.length} shown in a reviewed project, ${evidenceBase.filter(r => r.projects.length && !r.projects.some(p => p.reviewed)).length} in an unreviewed one`,
    },
    {
      key: 'assessments', label: 'Verified assessment evidence', baseWeight: BASE_WEIGHTS.assessments, applies: policy.assessments && evidenceBase.length > 0,
      coverage: mean(evidenceBase.map(r => (r.externallyVerified ? 1 : 0))),
      detail: `${evidenceBase.filter(r => r.externallyVerified).length} of ${evidenceBase.length} verified by an assessment, institution or employer`,
    },
  ]

  const activeWeight = raw.filter(c => c.applies).reduce((a, c) => a + c.baseWeight, 0)
  const components: ComponentResult[] = raw.map(c => {
    const weight = c.applies && activeWeight > 0 ? c.baseWeight / activeWeight : 0
    const coverage = c.applies ? clamp01(c.coverage) : 0
    return { ...c, coverage, weight, points: weight * coverage * 100 }
  })

  const summary = {
    requiredMet: required.filter(r => r.status === 'met').length,
    requiredPartial: required.filter(r => r.status === 'partial').length,
    requiredMissing: required.filter(r => r.status === 'missing').length,
    requiredTotal: required.length,
    preferredMet: preferred.filter(r => r.status === 'met').length,
    preferredTotal: preferred.length,
  }

  if (!required.length && !preferred.length) {
    return {
      status: 'no_requirements', score: 0, components, required, preferred, summary,
      projectEvidence: [], assessmentEvidence: [], confidence: 'low',
      confidenceNote: 'This job lists no skill requirements, so there is nothing to compare the profile against.',
      improvements: [],
      explanation: ['No required or preferred skills are listed for this job, so no alignment score was calculated.'],
      limitations: MATCH_LIMITATIONS,
    }
  }

  const score = Math.round(components.reduce((a, c) => a + c.points, 0))

  // Evidence actually used, listed once each.
  const all = [...required, ...preferred]
  const projectMap = new Map<string, { id: string; name: string; reviewed: boolean; skills: string[] }>()
  for (const r of all) for (const p of r.projects) {
    const entry = projectMap.get(p.id) ?? { ...p, skills: [] }
    entry.skills.push(r.name)
    projectMap.set(p.id, entry)
  }
  const projectEvidence = [...projectMap.values()].sort((a, b) => Number(b.reviewed) - Number(a.reviewed) || b.skills.length - a.skills.length)
  const assessmentEvidence = all.filter(r => r.externallyVerified && r.evidenceType).map(r => ({ skillId: r.skillId, name: r.name, evidenceType: r.evidenceType as EvidenceType }))

  // Confidence: how much of the evidence base rests on more than a self-rating.
  const evidenced = evidenceBase.filter(r => r.proficiency !== null && (r.externallyVerified || r.projects.length > 0))
  const absent = evidenceBase.filter(r => r.proficiency === null)
  const share = evidenceBase.length ? evidenced.length / evidenceBase.length : 0
  const confidence = share >= 0.67 ? 'high' : share >= 0.34 ? 'medium' : 'low'
  const notes = [`${evidenced.length} of ${evidenceBase.length} ${required.length ? 'required' : 'listed'} skills are backed by a project or a verification, not only a self-rating.`]
  const selfOnly = evidenceBase.filter(r => r.proficiency !== null && !r.externallyVerified && !r.projects.length)
  if (selfOnly.length) notes.push(`${selfOnly.map(r => r.name).join(', ')} ${selfOnly.length === 1 ? 'rests' : 'rest'} on self-reported ratings, which makes the score less certain.`)
  if (absent.length) notes.push(`${absent.map(r => r.name).join(', ')} ${absent.length === 1 ? 'is' : 'are'} not on the profile. That is missing information, not evidence the skill is absent.`)

  const improvements: Improvement[] = []
  for (const r of all) {
    const assessmentHint = assessable.has(normalizeSkillKey(r.skillId))
    const levelText = `${r.kind === 'required' ? 'requires' : 'prefers'} ${r.name} at ${r.minProficiency}`
    if (r.status === 'missing') {
      improvements.push({
        skillId: r.skillId, name: r.name, kind: r.kind, reason: 'missing',
        gap: `${r.name} is not on the profile.`,
        advice: `This role ${levelText}. ${r.name} is not on your profile yet. If you have used it, add it as a skill${assessmentHint ? ' and take the sample assessment' : ' and link a project that shows it'}; otherwise it is a skill to develop.`,
        action: assessmentHint ? { type: 'assessment', skillId: r.skillId } : { type: 'add_skill', skillId: r.skillId },
      })
    } else if (r.status === 'partial') {
      improvements.push({
        skillId: r.skillId, name: r.name, kind: r.kind, reason: 'below_level',
        gap: `${r.name} is at ${r.proficiency}, below the ${r.minProficiency} this role asks for.`,
        advice: `This role ${levelText}; your profile shows ${r.proficiency}. ${assessmentHint ? `Taking the ${r.name} sample assessment would replace the current rating with a measured one, and a` : 'A'} project that uses ${r.name} in depth would add evidence.`,
        action: assessmentHint ? { type: 'assessment', skillId: r.skillId } : { type: 'project', skillId: r.skillId },
      })
    } else if (r.kind === 'required' && !r.externallyVerified && policy.assessments) {
      improvements.push({
        skillId: r.skillId, name: r.name, kind: r.kind, reason: 'unverified',
        gap: r.projects.some(p => p.reviewed)
          ? `${r.name} is shown in a reviewed project but has no assessment, institution or employer verification.`
          : `${r.name} has no assessment, institution or employer verification.`,
        advice: `This role ${levelText}. Your profile contains no verified ${r.name} assessment. ${assessmentHint ? `Complete the sample ${r.name} assessment` : `Ask your institution to verify ${r.name}`}${policy.projects && !r.projects.length ? ` or add a project demonstrating ${r.name}` : ''}.`,
        action: assessmentHint ? { type: 'assessment', skillId: r.skillId } : r.projects.length ? undefined : { type: 'project', skillId: r.skillId },
      })
    } else if (r.kind === 'required' && policy.projects && !r.projects.some(p => p.reviewed)) {
      improvements.push({
        skillId: r.skillId, name: r.name, kind: r.kind, reason: 'no_project',
        gap: r.projects.length ? `${r.name} appears only in unreviewed projects.` : `No project on the profile demonstrates ${r.name}.`,
        advice: r.projects.length
          ? `${r.name} appears in “${r.projects[0].name}”, which has not been reviewed. Requesting a faculty review would strengthen this evidence.`
          : `Add a project that demonstrates ${r.name}, with an evidence link.`,
        action: { type: 'project', skillId: r.skillId },
      })
    }
  }
  const order = { missing: 0, below_level: 1, unverified: 2, no_project: 3 }
  improvements.sort((a, b) => Number(a.kind === 'preferred') - Number(b.kind === 'preferred') || order[a.reason] - order[b.reason])

  const explanation = components.filter(c => c.applies).map(c =>
    `${c.label} — weight ${pct(c.weight)}, coverage ${pct(c.coverage)} (${c.detail}) → ${c.points.toFixed(1)} points.`,
  )
  const skipped = components.filter(c => !c.applies)
  if (skipped.length) {
    explanation.push(`${skipped.map(c => c.label).join(' and ')} ${skipped.length === 1 ? 'does' : 'do'} not apply to this job, so the remaining weights were scaled up proportionally to total 100%.`)
  }
  explanation.push(`Total: ${score}% requirement alignment.`)

  return {
    status: 'ok', score, components, required, preferred, summary, projectEvidence, assessmentEvidence,
    confidence, confidenceNote: notes.join(' '), improvements, explanation, limitations: MATCH_LIMITATIONS,
  }
}
