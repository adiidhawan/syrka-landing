'use client'

import { useSyncExternalStore } from 'react'
import { applyAttemptToSkill, getAssessment, scoreAttempt, type AttemptResult } from './assessments'
import { normalizeSkillKey, resolveSkillId } from './matching'
import { createSeedState, SCHEMA_VERSION } from './seed'
import type { ActivityEvent, AssessmentAttempt, DemoState, Project, ProjectEvidence, Skill, Student } from './types'

/**
 * Demo persistence layer.
 *
 * The demo state lives in this browser's localStorage, so each visitor gets their own sandbox that survives
 * navigation and refreshes, needs no database or account, and can be reset to the seed at any time. All writes go
 * through the actions below; pages never mutate state directly.
 *
 * This is a demonstration store, not a security boundary: employer visibility is enforced in the shared read layer
 * (lib/campus/queries.ts), which in production would run on the server behind real authentication.
 */

const STORAGE_KEY = 'syrka-campus-demo'
const SEED = createSeedState()

let state: DemoState | null = null
const listeners = new Set<() => void>()

function load(): DemoState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as DemoState
      if (parsed?.schemaVersion === SCHEMA_VERSION && Array.isArray(parsed.students)) return parsed
    }
  } catch {
    // Unreadable or blocked storage: fall back to the seed for this session.
  }
  return createSeedState()
}

function getSnapshot(): DemoState {
  if (!state) state = load()
  return state
}

function getServerSnapshot(): DemoState {
  return SEED
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) {
      state = load()
      listener()
    }
  }
  window.addEventListener('storage', onStorage)
  return () => {
    listeners.delete(listener)
    window.removeEventListener('storage', onStorage)
  }
}

function commit(next: DemoState) {
  state = next
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    // Storage full or blocked: the change still applies for this session.
  }
  listeners.forEach(l => l())
}

/** Applies a change to a copy of the state and saves it. */
function update(fn: (draft: DemoState) => void) {
  const draft = structuredClone(getSnapshot())
  fn(draft)
  commit(draft)
}

export function useDemoState(): DemoState {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}

const noop = () => () => {}
/** False during server render and hydration, true afterwards. For values that depend on the visitor's clock. */
export function useHydrated(): boolean {
  return useSyncExternalStore(noop, () => true, () => false)
}

// ── Helpers ───────────────────────────────────────────────────────────────────────────────────────────────────────

const now = () => new Date().toISOString()
const newId = (prefix: string) => `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`

function log(draft: DemoState, event: Omit<ActivityEvent, 'id' | 'createdAt'>) {
  draft.activity.unshift({ ...event, id: newId('act'), createdAt: now() })
  draft.activity = draft.activity.slice(0, 200)
}

function studentName(draft: DemoState, id: string) {
  return draft.students.find(s => s.id === id)?.name ?? 'a candidate'
}

export class ValidationError extends Error {
  constructor(public fields: Record<string, string>) {
    super(Object.values(fields)[0] ?? 'Invalid input')
  }
}

// ── Demo ─────────────────────────────────────────────────────────────────────────────────────────────────────────

export function resetDemo() {
  const fresh = createSeedState()
  fresh.activity.unshift({ id: newId('act'), kind: 'demo_reset', actor: 'system', message: 'Demo data reset to the original seed', createdAt: now() })
  commit(fresh)
}

// ── Student profile ──────────────────────────────────────────────────────────────────────────────────────────────

export function setEmployerVisibility(studentId: string, employerVisible: boolean) {
  update(d => {
    const s = d.students.find(x => x.id === studentId)
    if (!s || s.visibility.employerVisible === employerVisible) return
    s.visibility.employerVisible = employerVisible
    s.updatedAt = now()
    log(d, { kind: 'visibility_changed', actor: 'student', studentId, message: employerVisible ? 'Made the profile visible to employers' : 'Made the profile private' })
  })
}

export function setSectionVisibility(studentId: string, section: keyof Student['visibility']['sections'], shared: boolean) {
  update(d => {
    const s = d.students.find(x => x.id === studentId)
    if (!s) return
    s.visibility.sections[section] = shared
    s.updatedAt = now()
  })
}

export interface ProfileInput {
  preferredRole: string
  location: string
  bio: string
  careerInterests: string[]
}

export function validateProfile(input: ProfileInput) {
  const errors: Record<string, string> = {}
  if (input.preferredRole.trim().length > 60) errors.preferredRole = 'Keep the role under 60 characters.'
  if (input.location.trim().length > 80) errors.location = 'Keep the location under 80 characters.'
  if (input.bio.trim().length > 600) errors.bio = 'Keep the biography under 600 characters.'
  if (input.careerInterests.length > 8) errors.careerInterests = 'List up to 8 interests.'
  return errors
}

export function updateProfile(studentId: string, input: ProfileInput) {
  const errors = validateProfile(input)
  if (Object.keys(errors).length) throw new ValidationError(errors)
  update(d => {
    const s = d.students.find(x => x.id === studentId)
    if (!s) return
    s.preferredRole = input.preferredRole.trim()
    s.location = input.location.trim()
    s.bio = input.bio.trim()
    s.careerInterests = input.careerInterests.map(i => i.trim()).filter(Boolean)
    s.updatedAt = now()
  })
}

// ── Skills ───────────────────────────────────────────────────────────────────────────────────────────────────────

export interface NewSkillInput {
  name: string
  proficiency: number
  category: Skill['category']
}

/** Adds a skill claim. New claims are always self-reported and unverified, whatever the proficiency entered. */
export function addSkill(studentId: string, input: NewSkillInput): string {
  const name = input.name.trim()
  const errors: Record<string, string> = {}
  if (name.length < 1) errors.name = 'Enter a skill name.'
  else if (name.length > 40) errors.name = 'Keep the name under 40 characters.'
  else if (!normalizeSkillKey(name)) errors.name = 'Use letters or numbers in the name.'
  if (!Number.isFinite(input.proficiency) || input.proficiency < 1 || input.proficiency > 100) errors.proficiency = 'Choose a rating between 1 and 100.'
  const current = getSnapshot()
  const existingId = resolveSkillId(name, current.skills)
  if (existingId && current.studentSkills.some(s => s.studentId === studentId && s.skillId === existingId)) {
    errors.name = 'This skill is already on your profile.'
  }
  if (Object.keys(errors).length) throw new ValidationError(errors)

  const skillId = existingId ?? `custom-${normalizeSkillKey(name)}`
  const ssId = newId('ss')
  update(d => {
    if (!d.skills.some(s => s.id === skillId)) d.skills.push({ id: skillId, name, category: input.category })
    const t = now()
    d.studentSkills.push({
      id: ssId, studentId, skillId, proficiency: Math.round(input.proficiency), selfRating: Math.round(input.proficiency),
      evidenceType: 'self_reported', verificationStatus: 'unverified', createdAt: t, updatedAt: t,
    })
    log(d, { kind: 'skill_added', actor: 'student', studentId, message: `Added ${d.skills.find(s => s.id === skillId)?.name} as a self-reported skill` })
  })
  return ssId
}

/** Changes a self-reported rating. Verified or project-backed claims keep their evidence-derived proficiency. */
export function updateSelfRating(studentSkillId: string, proficiency: number) {
  if (!Number.isFinite(proficiency) || proficiency < 1 || proficiency > 100) throw new ValidationError({ proficiency: 'Choose a rating between 1 and 100.' })
  update(d => {
    const s = d.studentSkills.find(x => x.id === studentSkillId)
    if (!s || s.evidenceType !== 'self_reported') return
    s.proficiency = Math.round(proficiency)
    s.selfRating = Math.round(proficiency)
    s.updatedAt = now()
    log(d, { kind: 'skill_updated', actor: 'student', studentId: s.studentId, message: `Updated the self-rating for ${d.skills.find(k => k.id === s.skillId)?.name}` })
  })
}

export function removeSelfReportedSkill(studentSkillId: string) {
  update(d => {
    const s = d.studentSkills.find(x => x.id === studentSkillId)
    if (!s || s.evidenceType !== 'self_reported') return
    d.studentSkills = d.studentSkills.filter(x => x.id !== studentSkillId)
    log(d, { kind: 'skill_updated', actor: 'student', studentId: s.studentId, message: `Removed ${d.skills.find(k => k.id === s.skillId)?.name}` })
  })
}

// ── Assessments ──────────────────────────────────────────────────────────────────────────────────────────────────

export function submitAssessment(studentId: string, assessmentId: string, answers: number[]): { attempt: AssessmentAttempt; result: AttemptResult } {
  const assessment = getAssessment(assessmentId)
  if (!assessment) throw new Error('Unknown assessment')
  if (answers.length !== assessment.questions.length || answers.some(a => a < 0)) throw new ValidationError({ answers: 'Answer every question before submitting.' })
  const result = scoreAttempt(assessment, answers)
  const attempt: AssessmentAttempt = {
    id: newId('att'), assessmentId, studentId, answers, correct: result.correct, total: result.total,
    score: result.score, passed: result.passed, completedAt: now(),
  }
  update(d => {
    d.attempts.push(attempt)
    let skill = d.studentSkills.find(s => s.studentId === studentId && s.skillId === assessment.skillId)
    if (!skill) {
      // Taking an assessment for a skill not yet on the profile adds it, starting from the attempt itself.
      skill = { id: newId('ss'), studentId, skillId: assessment.skillId, proficiency: 0, evidenceType: 'self_reported', verificationStatus: 'unverified', createdAt: attempt.completedAt, updatedAt: attempt.completedAt }
      d.studentSkills.push(skill)
    }
    let verificationId: string | undefined
    if (result.passed) {
      verificationId = newId('ver')
      d.verifications.push({
        id: verificationId, studentId, studentSkillId: skill.id, kind: 'assessment', verifierName: `${assessment.title} (sample assessment)`,
        verifiedAt: attempt.completedAt, note: `${result.correct} of ${result.total} correct`, attemptId: attempt.id,
      })
    }
    const updated = applyAttemptToSkill(skill, attempt, verificationId)
    d.studentSkills = d.studentSkills.map(s => (s.id === skill!.id ? updated : s))
    d.skillHistory.push({ studentId, skillId: assessment.skillId, date: attempt.completedAt.slice(0, 10), proficiency: updated.proficiency, illustrative: false })
    log(d, { kind: 'assessment_completed', actor: 'student', studentId, message: `Completed “${assessment.title}” — ${result.correct} of ${result.total} correct${result.passed ? '' : ' (below the pass mark)'}` })
  })
  return { attempt, result }
}

// ── Projects ─────────────────────────────────────────────────────────────────────────────────────────────────────

export interface ProjectInput {
  name: string
  summary: string
  problem: string
  implementation: string
  contribution: string
  role: Project['role']
  completedAt: string
  skillIds: string[]
  evidence: { label: string; url: string; kind: ProjectEvidence['kind'] }[]
}

export function validateProject(input: ProjectInput): Record<string, string> {
  const e: Record<string, string> = {}
  const name = input.name.trim()
  if (name.length < 3) e.name = 'Give the project a name of at least 3 characters.'
  else if (name.length > 80) e.name = 'Keep the name under 80 characters.'
  if (input.summary.trim().length < 10) e.summary = 'Write a one-sentence summary (at least 10 characters).'
  if (input.summary.trim().length > 300) e.summary = 'Keep the summary under 300 characters.'
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.completedAt) || Number.isNaN(Date.parse(input.completedAt))) e.completedAt = 'Enter a valid completion date.'
  else if (Date.parse(input.completedAt) > Date.now() + 86_400_000) e.completedAt = 'The completion date cannot be in the future.'
  if (!input.skillIds.length) e.skillIds = 'Link at least one skill the project demonstrates.'
  input.evidence.forEach((ev, i) => {
    if (!ev.label.trim()) e[`evidence.${i}`] = 'Give each evidence link a label.'
    else {
      try {
        const u = new URL(ev.url)
        if (u.protocol !== 'https:' && u.protocol !== 'http:') throw new Error()
      } catch {
        e[`evidence.${i}`] = 'Enter a full link starting with https://'
      }
    }
  })
  return e
}

function writeProjectRelations(d: DemoState, projectId: string, input: ProjectInput) {
  d.projectSkills = d.projectSkills.filter(ps => ps.projectId !== projectId)
  for (const skillId of new Set(input.skillIds)) d.projectSkills.push({ id: newId('ps'), projectId, skillId })
  d.projectEvidence = d.projectEvidence.filter(pe => pe.projectId !== projectId)
  for (const ev of input.evidence) d.projectEvidence.push({ id: newId('pe'), projectId, label: ev.label.trim(), url: ev.url.trim(), kind: ev.kind })
}

/**
 * Linking a project to a skill the student has no claim for adds that skill as project-demonstrated (unverified),
 * so the profile reflects the project. Existing claims keep their evidence type.
 */
function ensureDemonstratedSkills(d: DemoState, studentId: string, skillIds: string[]) {
  const t = now()
  for (const skillId of skillIds) {
    if (d.studentSkills.some(s => s.studentId === studentId && s.skillId === skillId)) continue
    d.studentSkills.push({ id: newId('ss'), studentId, skillId, proficiency: 60, evidenceType: 'project_demonstrated', verificationStatus: 'unverified', createdAt: t, updatedAt: t })
  }
}

function trimmed(input: ProjectInput) {
  return {
    name: input.name.trim(), summary: input.summary.trim(), problem: input.problem.trim(),
    implementation: input.implementation.trim(), contribution: input.contribution.trim(), role: input.role, completedAt: input.completedAt,
  }
}

export function addProject(studentId: string, input: ProjectInput): string {
  const errors = validateProject(input)
  if (Object.keys(errors).length) throw new ValidationError(errors)
  const id = newId('p')
  update(d => {
    const t = now()
    d.projects.push({ id, studentId, ...trimmed(input), verificationStatus: 'unverified', createdAt: t, updatedAt: t })
    writeProjectRelations(d, id, input)
    ensureDemonstratedSkills(d, studentId, input.skillIds)
    log(d, { kind: 'project_added', actor: 'student', studentId, message: `Added the project “${input.name.trim()}”` })
  })
  return id
}

/**
 * Editing a reviewed project withdraws its review: the reviewer saw a different version. Skills that relied on that
 * review drop back to unverified.
 */
export function updateProject(projectId: string, input: ProjectInput) {
  const errors = validateProject(input)
  if (Object.keys(errors).length) throw new ValidationError(errors)
  update(d => {
    const p = d.projects.find(x => x.id === projectId)
    if (!p) return
    const before = JSON.stringify({ ...trimmed(input), skills: [...new Set(input.skillIds)].sort(), evidence: input.evidence })
    const current = JSON.stringify({
      name: p.name, summary: p.summary, problem: p.problem, implementation: p.implementation, contribution: p.contribution, role: p.role, completedAt: p.completedAt,
      skills: d.projectSkills.filter(ps => ps.projectId === p.id).map(ps => ps.skillId).sort(),
      evidence: d.projectEvidence.filter(pe => pe.projectId === p.id).map(({ label, url, kind }) => ({ label, url, kind })),
    })
    if (before === current) return
    Object.assign(p, trimmed(input), { updatedAt: now() })
    if (p.verificationStatus === 'verified' && p.verificationId) withdrawReview(d, p)
    writeProjectRelations(d, projectId, input)
    ensureDemonstratedSkills(d, p.studentId, input.skillIds)
    log(d, { kind: 'project_updated', actor: 'student', studentId: p.studentId, message: `Updated the project “${p.name}”` })
  })
}

function withdrawReview(d: DemoState, p: Project) {
  const vid = p.verificationId
  p.verificationStatus = 'unverified'
  p.verificationId = undefined
  for (const s of d.studentSkills) {
    if (s.verificationId === vid) {
      s.verificationStatus = 'unverified'
      s.verificationId = undefined
    }
  }
}

export function deleteProject(projectId: string) {
  update(d => {
    const p = d.projects.find(x => x.id === projectId)
    if (!p) return
    if (p.verificationId) withdrawReview(d, p)
    d.verifications = d.verifications.filter(v => v.projectId !== projectId)
    d.projects = d.projects.filter(x => x.id !== projectId)
    d.projectSkills = d.projectSkills.filter(ps => ps.projectId !== projectId)
    d.projectEvidence = d.projectEvidence.filter(pe => pe.projectId !== projectId)
    log(d, { kind: 'project_deleted', actor: 'student', studentId: p.studentId, message: `Deleted the project “${p.name}”` })
  })
}

/** Marks a project as submitted for faculty review. Verification itself never happens automatically in the demo. */
export function requestProjectReview(projectId: string) {
  update(d => {
    const p = d.projects.find(x => x.id === projectId)
    if (!p || p.verificationStatus !== 'unverified') return
    p.verificationStatus = 'pending'
    p.updatedAt = now()
    log(d, { kind: 'project_updated', actor: 'student', studentId: p.studentId, message: `Submitted “${p.name}” for faculty review` })
  })
}

// ── Activity ─────────────────────────────────────────────────────────────────────────────────────────────────────

export function recordJobView(studentId: string, jobId: string) {
  const s = getSnapshot()
  const last = s.activity.find(a => a.studentId === studentId && a.kind === 'job_viewed')
  if (last?.jobId === jobId) return
  update(d => {
    const j = d.jobs.find(x => x.id === jobId)
    if (!j) return
    log(d, { kind: 'job_viewed', actor: 'student', studentId, jobId, message: `Viewed “${j.title}” at ${d.companies.find(c => c.id === j.companyId)?.name}` })
  })
}

// ── Employer ─────────────────────────────────────────────────────────────────────────────────────────────────────

/** Employers can only act on candidates who currently share their profile. */
function assertVisible(d: DemoState, studentId: string) {
  if (!d.students.find(s => s.id === studentId)?.visibility.employerVisible) throw new Error('This candidate is not sharing their profile with employers.')
}

export function toggleShortlist(companyId: string, jobId: string, studentId: string) {
  update(d => {
    assertVisible(d, studentId)
    const existing = d.shortlists.find(s => s.companyId === companyId && s.jobId === jobId && s.studentId === studentId)
    const jobTitle = d.jobs.find(j => j.id === jobId)?.title
    if (existing) {
      d.shortlists = d.shortlists.filter(s => s !== existing)
      log(d, { kind: 'candidate_unshortlisted', actor: 'employer', companyId, studentId, jobId, message: `Removed ${studentName(d, studentId)} from the ${jobTitle} shortlist` })
    } else {
      d.shortlists.push({ id: newId('sl'), companyId, jobId, studentId, createdAt: now() })
      log(d, { kind: 'candidate_shortlisted', actor: 'employer', companyId, studentId, jobId, message: `Shortlisted ${studentName(d, studentId)} for ${jobTitle}` })
    }
  })
}

export function markReviewed(companyId: string, studentId: string) {
  update(d => {
    assertVisible(d, studentId)
    if (d.reviews.some(r => r.companyId === companyId && r.studentId === studentId)) return
    d.reviews.push({ id: newId('rev'), companyId, studentId, reviewedAt: now() })
    log(d, { kind: 'candidate_reviewed', actor: 'employer', companyId, studentId, message: `Reviewed ${studentName(d, studentId)}` })
  })
}

export function addEmployerNote(companyId: string, studentId: string, body: string) {
  const text = body.trim()
  if (!text) throw new ValidationError({ body: 'Write a note before saving.' })
  if (text.length > 500) throw new ValidationError({ body: 'Keep notes under 500 characters.' })
  update(d => {
    assertVisible(d, studentId)
    d.notes.unshift({ id: newId('note'), companyId, studentId, body: text, createdAt: now() })
    log(d, { kind: 'note_added', actor: 'employer', companyId, studentId, message: `Added a note on ${studentName(d, studentId)}` })
  })
}

export function deleteEmployerNote(noteId: string) {
  update(d => {
    d.notes = d.notes.filter(n => n.id !== noteId)
  })
}
