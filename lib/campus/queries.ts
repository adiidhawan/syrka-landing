import { ASSESSMENTS } from './assessments'
import { calculateCandidateMatch, type CandidateInput, type JobRequirementsInput, type MatchResult } from './matching'
import type {
  Achievement, Company, DemoState, EducationRecord, EvidenceType, Job, Project, ProjectEvidence, Skill, Student,
  StudentSkill, University, VerificationRecord,
} from './types'

/**
 * Shared read layer over the demo state. Every page reads through these functions so the student portal, the
 * employer portal and the admin view see the same facts, and so employer access rules live in one place.
 */

const ASSESSABLE = ASSESSMENTS.map(a => a.skillId)

export const EVIDENCE_LABEL: Record<EvidenceType, string> = {
  self_reported: 'Self-reported',
  assessment_verified: 'Assessment-verified',
  project_demonstrated: 'Project-demonstrated',
  institution_verified: 'Institution-verified',
  employer_verified: 'Employer-verified',
}
export const EVIDENCE_ORDER: EvidenceType[] = ['employer_verified', 'institution_verified', 'assessment_verified', 'project_demonstrated', 'self_reported']

export const CATEGORY_LABEL: Record<Skill['category'], string> = {
  programming: 'Programming', frontend: 'Frontend development', backend: 'Backend development', data_ai: 'Data and AI',
  analytical: 'Analytical reasoning', communication: 'Communication', collaboration: 'Collaboration',
  leadership: 'Leadership', design: 'Design', domain: 'Domain knowledge',
}

export function skillById(state: DemoState, id: string): Skill | undefined {
  return state.skills.find(s => s.id === id)
}
export function skillName(state: DemoState, id: string): string {
  return skillById(state, id)?.name ?? id
}
export function university(state: DemoState, id: string): University | undefined {
  return state.universities.find(u => u.id === id)
}
export function company(state: DemoState, id: string): Company | undefined {
  return state.companies.find(c => c.id === id)
}
export function job(state: DemoState, id: string): Job | undefined {
  return state.jobs.find(j => j.id === id)
}

// ── Student-side reads (the student sees everything on their own profile) ────────────────────────────────────────

export interface ProjectView extends Project {
  skillIds: string[]
  evidence: ProjectEvidence[]
  review?: VerificationRecord
}

export function projectsFor(state: DemoState, studentId: string): ProjectView[] {
  return state.projects
    .filter(p => p.studentId === studentId)
    .map(p => ({
      ...p,
      skillIds: state.projectSkills.filter(ps => ps.projectId === p.id).map(ps => ps.skillId),
      evidence: state.projectEvidence.filter(e => e.projectId === p.id),
      review: p.verificationId ? state.verifications.find(v => v.id === p.verificationId) : undefined,
    }))
    .sort((a, b) => b.completedAt.localeCompare(a.completedAt))
}

export interface SkillView extends StudentSkill {
  skill: Skill
  verification?: VerificationRecord
  projects: { id: string; name: string }[]
}

export function skillsFor(state: DemoState, studentId: string): SkillView[] {
  const projects = state.projects.filter(p => p.studentId === studentId)
  return state.studentSkills
    .filter(s => s.studentId === studentId)
    .map(s => ({
      ...s,
      skill: skillById(state, s.skillId) ?? { id: s.skillId, name: s.skillId, category: 'domain' as const },
      verification: s.verificationId ? state.verifications.find(v => v.id === s.verificationId) : undefined,
      projects: projects.filter(p => state.projectSkills.some(ps => ps.projectId === p.id && ps.skillId === s.skillId)).map(p => ({ id: p.id, name: p.name })),
    }))
    .sort((a, b) => b.proficiency - a.proficiency)
}

export function candidateInputFrom(skills: Pick<StudentSkill, 'skillId' | 'proficiency' | 'evidenceType' | 'verificationStatus'>[], projects: Pick<ProjectView, 'id' | 'name' | 'verificationStatus' | 'skillIds'>[]): CandidateInput {
  return {
    skills: skills.map(s => ({ skillId: s.skillId, proficiency: s.proficiency, evidenceType: s.evidenceType, verificationStatus: s.verificationStatus })),
    projects: projects.map(p => ({ id: p.id, name: p.name, verificationStatus: p.verificationStatus, skillIds: p.skillIds })),
  }
}

export function jobRequirements(state: DemoState, jobId: string): JobRequirementsInput {
  const reqs = state.jobRequirements.filter(r => r.jobId === jobId)
  const toInput = (kind: 'required' | 'preferred') => reqs.filter(r => r.kind === kind).map(r => ({ skillId: r.skillId, name: skillName(state, r.skillId), minProficiency: r.minProficiency }))
  return { required: toInput('required'), preferred: toInput('preferred'), evidencePolicy: job(state, jobId)?.evidencePolicy }
}

/** The student's own view of a match: uses their full profile. */
export function studentMatch(state: DemoState, studentId: string, jobId: string): MatchResult {
  return calculateCandidateMatch(candidateInputFrom(skillsFor(state, studentId), projectsFor(state, studentId)), jobRequirements(state, jobId), { assessableSkillIds: ASSESSABLE })
}

export function studentJobMatches(state: DemoState, studentId: string) {
  return state.jobs
    .filter(j => j.status === 'open')
    .map(j => ({ job: j, company: company(state, j.companyId)!, match: studentMatch(state, studentId, j.id) }))
    .sort((a, b) => b.match.score - a.match.score)
}

// ── Profile completeness, computed from populated fields ─────────────────────────────────────────────────────────

export interface CompletenessItem { key: string; label: string; done: boolean; href: string }

export function profileCompleteness(state: DemoState, studentId: string): { percent: number; items: CompletenessItem[] } {
  const student = state.students.find(s => s.id === studentId)
  const skills = skillsFor(state, studentId)
  const projects = projectsFor(state, studentId)
  const base = '/demo/student'
  const items: CompletenessItem[] = [
    { key: 'bio', label: 'Write a short biography', done: !!student?.bio.trim(), href: `${base}/profile` },
    { key: 'role', label: 'Set a preferred role', done: !!student?.preferredRole.trim(), href: `${base}/profile` },
    { key: 'location', label: 'Add your location', done: !!student?.location.trim(), href: `${base}/profile` },
    { key: 'education', label: 'Add your education record', done: state.education.some(e => e.studentId === studentId), href: `${base}/profile` },
    { key: 'interests', label: 'List your career interests', done: (student?.careerInterests.length ?? 0) > 0, href: `${base}/profile` },
    { key: 'skills', label: 'Add at least 5 skills', done: skills.length >= 5, href: `${base}/skills` },
    { key: 'verified', label: 'Verify at least one skill', done: skills.some(s => s.verificationStatus === 'verified'), href: `${base}/skills` },
    { key: 'projects', label: 'Add at least 3 projects', done: projects.length >= 3, href: `${base}/projects` },
    { key: 'evidence', label: 'Add an evidence link to every project', done: projects.length > 0 && projects.every(p => p.evidence.length > 0), href: `${base}/projects` },
    { key: 'review', label: 'Submit every project for review', done: projects.length > 0 && projects.every(p => p.verificationStatus !== 'unverified'), href: `${base}/projects` },
    { key: 'achievement', label: 'Add an achievement', done: state.achievements.some(a => a.studentId === studentId), href: `${base}/profile` },
  ]
  return { percent: Math.round((items.filter(i => i.done).length / items.length) * 100), items }
}

// ── Employer-side reads. Visibility is enforced HERE, not in the UI. ─────────────────────────────────────────────

/**
 * What an employer is allowed to see of a student. Built only for students who have turned employer visibility on,
 * with each section removed unless the student shares it. No contact details or personal attributes are included.
 */
export interface EmployerCandidateView {
  id: string
  name: string
  degree: string
  graduationYear: number
  university: University | undefined
  location: string
  preferredRole: string
  bio: string
  careerInterests: string[]
  skills: SkillView[]
  projects: ProjectView[] | null
  education: EducationRecord | null
  achievements: Achievement[] | null
  attemptsShared: boolean
  sections: Student['visibility']['sections']
}

function toEmployerView(state: DemoState, s: Student): EmployerCandidateView {
  const { sections } = s.visibility
  const skills = skillsFor(state, s.id).map(k => sections.assessments || k.evidenceType !== 'assessment_verified' ? k : {
    // Assessment results hidden: the claim falls back to the student's self-rating, unverified.
    ...k, proficiency: k.selfRating ?? k.proficiency, evidenceType: 'self_reported' as const, verificationStatus: 'unverified' as const, verification: undefined, verificationId: undefined,
  })
  return {
    id: s.id, name: s.name, degree: s.degree, graduationYear: s.graduationYear, university: university(state, s.universityId),
    location: s.location, preferredRole: s.preferredRole, bio: s.bio, careerInterests: s.careerInterests,
    skills: sections.projects ? skills : skills.map(k => ({ ...k, projects: [] })),
    projects: sections.projects ? projectsFor(state, s.id) : null,
    education: sections.education ? state.education.find(e => e.studentId === s.id) ?? null : null,
    achievements: sections.achievements ? state.achievements.filter(a => a.studentId === s.id) : null,
    attemptsShared: sections.assessments,
    sections,
  }
}

/** Candidates an employer can discover: only students with employer visibility switched on. */
export function employerCandidates(state: DemoState): EmployerCandidateView[] {
  return state.students.filter(s => s.visibility.employerVisible).map(s => toEmployerView(state, s))
}

/** A single candidate for an employer, or null when the student is private (or does not exist). */
export function employerCandidate(state: DemoState, studentId: string): EmployerCandidateView | null {
  const s = state.students.find(x => x.id === studentId)
  return s && s.visibility.employerVisible ? toEmployerView(state, s) : null
}

/** Employer-side match: computed only from what the candidate shares. */
export function employerMatch(state: DemoState, candidate: EmployerCandidateView, jobId: string): MatchResult {
  return calculateCandidateMatch(candidateInputFrom(candidate.skills, candidate.projects ?? []), jobRequirements(state, jobId), { assessableSkillIds: ASSESSABLE })
}

export function companyJobs(state: DemoState, companyId: string): Job[] {
  return state.jobs.filter(j => j.companyId === companyId)
}

/** Recruitment metrics for one company, computed from records and filtered through employer visibility. */
export function employerStats(state: DemoState, companyId: string) {
  const visible = new Set(employerCandidates(state).map(c => c.id))
  const jobs = companyJobs(state, companyId)
  const shortlists = state.shortlists.filter(s => s.companyId === companyId && visible.has(s.studentId))
  const reviews = state.reviews.filter(r => r.companyId === companyId && visible.has(r.studentId))
  return {
    candidates: visible.size,
    privateProfiles: state.students.length - visible.size,
    openPositions: jobs.filter(j => j.status === 'open').length,
    reviewed: new Set(reviews.map(r => r.studentId)).size,
    shortlisted: new Set(shortlists.map(s => s.studentId)).size,
    shortlistEntries: shortlists.length,
    shortlistsByJob: jobs.map(j => ({ job: j, count: shortlists.filter(s => s.jobId === j.id).length })),
    hiddenShortlisted: state.shortlists.filter(s => s.companyId === companyId && !visible.has(s.studentId)).length,
  }
}

/** For each skill, how many discoverable candidates hold it at ≥ 70. */
export function skillDistribution(state: DemoState, studentIds: string[], minLevel = 70) {
  const ids = new Set(studentIds)
  const counts = new Map<string, { total: number; verified: number }>()
  for (const s of state.studentSkills) {
    if (!ids.has(s.studentId) || s.proficiency < minLevel) continue
    const c = counts.get(s.skillId) ?? { total: 0, verified: 0 }
    c.total++
    if (s.verificationStatus === 'verified') c.verified++
    counts.set(s.skillId, c)
  }
  return [...counts.entries()].map(([skillId, c]) => ({ skillId, name: skillName(state, skillId), ...c })).sort((a, b) => b.total - a.total)
}

export function evidenceBreakdown(state: DemoState) {
  return EVIDENCE_ORDER.map(ev => ({
    evidenceType: ev,
    label: EVIDENCE_LABEL[ev],
    count: state.studentSkills.filter(s => s.evidenceType === ev).length,
    verified: state.studentSkills.filter(s => s.evidenceType === ev && s.verificationStatus === 'verified').length,
  }))
}

export function initials(name: string): string {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]?.toUpperCase()).join('')
}
