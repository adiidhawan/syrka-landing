// Matching-engine, assessment and seed tests. Run with `npm run test:campus` (Node's built-in runner; Node ≥ 22.18
// or 23.6 strips the TypeScript types natively, so no extra tooling is needed).
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { calculateCandidateMatch, normalizeSkillKey, resolveSkillId, BASE_WEIGHTS } from '../../lib/campus/matching.ts'
import { ASSESSMENTS, scoreAttempt, applyAttemptToSkill } from '../../lib/campus/assessments.ts'
import { createSeedState, PRIMARY_STUDENT_ID } from '../../lib/campus/seed.ts'

const skill = (skillId, proficiency, evidenceType = 'self_reported', verificationStatus = 'unverified') => ({ skillId, proficiency, evidenceType, verificationStatus })
const req = (skillId, minProficiency = 70) => ({ skillId, name: skillId, minProficiency })
const FRONTEND = { required: [req('react'), req('typescript'), req('nextjs')], preferred: [req('html-css', 60)] }

test('skill keys normalise across spellings and aliases', () => {
  assert.equal(normalizeSkillKey('Next.js'), normalizeSkillKey('nextjs'))
  assert.equal(normalizeSkillKey(' NEXT JS '), 'nextjs')
  const catalogue = [{ id: 'sql', name: 'SQL', aliases: ['postgres'] }, { id: 'nextjs', name: 'Next.js' }]
  assert.equal(resolveSkillId('Postgres', catalogue), 'sql')
  assert.equal(resolveSkillId('next js', catalogue), 'nextjs')
  assert.equal(resolveSkillId('   ', catalogue), undefined)
})

test('a candidate meeting every requirement with full evidence scores 100', () => {
  const candidate = {
    skills: ['react', 'typescript', 'nextjs', 'html-css'].map(s => skill(s, 90, 'assessment_verified', 'verified')),
    projects: [{ id: 'p1', name: 'P', verificationStatus: 'verified', skillIds: ['react', 'typescript', 'nextjs'] }],
  }
  const m = calculateCandidateMatch(candidate, FRONTEND)
  assert.equal(m.score, 100)
  assert.equal(m.summary.requiredMet, 3)
  assert.equal(m.confidence, 'high')
})

test('partial credit is proportional to proficiency ÷ required level', () => {
  const m = calculateCandidateMatch({ skills: [skill('react', 35)], projects: [] }, { required: [req('react', 70)], preferred: [] })
  const r = m.required[0]
  assert.equal(r.status, 'partial')
  assert.equal(r.credit, 0.5)
  // required (60) is the only coverage component with credit; normalised weight 60/80 → 0.75 × 0.5 = 37.5 → 38
  assert.equal(m.score, 38)
})

test('missing required skills are listed and reduce the score', () => {
  const m = calculateCandidateMatch({ skills: [skill('react', 90)], projects: [] }, FRONTEND)
  assert.deepEqual(m.required.filter(r => r.status === 'missing').map(r => r.skillId), ['typescript', 'nextjs'])
  assert.ok(m.score < 40)
  const missing = m.improvements.filter(i => i.reason === 'missing').map(i => i.skillId)
  assert.ok(missing.includes('typescript') && missing.includes('nextjs'))
  assert.match(m.confidenceNote, /not on the profile/)
})

test('weights re-normalise when a job has no preferred skills', () => {
  const job = { required: [req('python')], preferred: [] }
  const m = calculateCandidateMatch({ skills: [skill('python', 90, 'assessment_verified', 'verified')], projects: [{ id: 'p', name: 'P', verificationStatus: 'verified', skillIds: ['python'] }] }, job)
  const applied = m.components.filter(c => c.applies)
  assert.equal(applied.length, 3)
  assert.ok(Math.abs(applied.reduce((a, c) => a + c.weight, 0) - 1) < 1e-9)
  assert.ok(Math.abs(m.components.find(c => c.key === 'required').weight - BASE_WEIGHTS.required / 0.8) < 1e-9)
  assert.equal(m.score, 100)
})

test('an evidence policy without projects drops that component and re-normalises', () => {
  const job = { required: [req('sql')], preferred: [], evidencePolicy: { projects: false, assessments: true } }
  const m = calculateCandidateMatch({ skills: [skill('sql', 80, 'assessment_verified', 'verified')], projects: [] }, job)
  assert.equal(m.components.find(c => c.key === 'projects').applies, false)
  assert.equal(m.score, 100)
})

test('empty requirements and empty profiles are handled safely', () => {
  const none = calculateCandidateMatch({ skills: [], projects: [] }, { required: [], preferred: [] })
  assert.equal(none.status, 'no_requirements')
  assert.equal(none.score, 0)
  const empty = calculateCandidateMatch({ skills: undefined, projects: undefined }, FRONTEND)
  assert.equal(empty.status, 'ok')
  assert.equal(empty.score, 0)
  assert.equal(empty.confidence, 'low')
  assert.ok(Number.isFinite(empty.score))
})

test('adding unrelated skills or duplicate projects never raises the score', () => {
  const base = { skills: [skill('react', 80), skill('typescript', 80)], projects: [{ id: 'p1', name: 'A', verificationStatus: 'unverified', skillIds: ['react'] }] }
  const padded = {
    skills: [...base.skills, ...['java', 'figma', 'sql', 'docker'].map(s => skill(s, 95, 'employer_verified', 'verified'))],
    projects: [...base.projects, ...[2, 3, 4].map(i => ({ id: `p${i}`, name: `Copy ${i}`, verificationStatus: 'unverified', skillIds: ['react'] }))],
  }
  assert.equal(calculateCandidateMatch(padded, FRONTEND).score, calculateCandidateMatch(base, FRONTEND).score)
})

test('a faculty-reviewed project counts as project evidence only, not assessment evidence', () => {
  const m = calculateCandidateMatch(
    { skills: [skill('react', 90, 'project_demonstrated', 'verified')], projects: [{ id: 'p', name: 'P', verificationStatus: 'verified', skillIds: ['react'] }] },
    { required: [req('react')], preferred: [] },
  )
  assert.equal(m.components.find(c => c.key === 'projects').coverage, 1)
  assert.equal(m.components.find(c => c.key === 'assessments').coverage, 0)
  assert.equal(m.assessmentEvidence.length, 0)
})

test('verified evidence outranks the same self-reported proficiency, with equal skill coverage', () => {
  const job = { required: [req('sql')], preferred: [] }
  const selfOnly = calculateCandidateMatch({ skills: [skill('sql', 80)], projects: [] }, job)
  const verified = calculateCandidateMatch({ skills: [skill('sql', 80, 'assessment_verified', 'verified')], projects: [] }, job)
  assert.equal(selfOnly.components[0].coverage, verified.components[0].coverage)
  assert.ok(verified.score > selfOnly.score)
  assert.equal(selfOnly.confidence, 'low')
  // An assessment_verified label without a verified status is not treated as verified.
  const mislabeled = calculateCandidateMatch({ skills: [skill('sql', 80, 'assessment_verified', 'unverified')], projects: [] }, job)
  assert.equal(mislabeled.score, selfOnly.score)
})

test('attributes outside skills and projects cannot influence the result', () => {
  const candidate = { skills: [skill('react', 80)], projects: [] }
  const withAttributes = { ...candidate, university: 'Top Ranked University', cgpa: 10, gender: 'x', religion: 'y', caste: 'z' }
  assert.deepEqual(calculateCandidateMatch(withAttributes, FRONTEND), calculateCandidateMatch(candidate, FRONTEND))
})

test('duplicate requirements and duplicate skill claims are not double counted', () => {
  const job = { required: [req('react'), req('React')], preferred: [req('react', 50)] }
  const m = calculateCandidateMatch({ skills: [skill('react', 40), skill('React', 90)], projects: [] }, job)
  assert.equal(m.required.length, 1)
  assert.equal(m.preferred.length, 0)
  assert.equal(m.required[0].proficiency, 90)
})

test('improvements point to the sample assessment when one exists', () => {
  const m = calculateCandidateMatch({ skills: [skill('sql', 76)], projects: [] }, { required: [req('sql', 75)], preferred: [] }, { assessableSkillIds: ['sql'] })
  const tip = m.improvements.find(i => i.skillId === 'sql')
  assert.equal(tip.reason, 'unverified')
  assert.deepEqual(tip.action, { type: 'assessment', skillId: 'sql' })
  assert.match(tip.advice, /no verified sql assessment/i)
})

// ── Assessments ────────────────────────────────────────────────────────────────────────────────────────────────

test('assessment scoring is computed from the answers', () => {
  const a = ASSESSMENTS.find(x => x.id === 'a-javascript')
  const perfect = scoreAttempt(a, a.questions.map(q => q.correctIndex))
  assert.deepEqual([perfect.correct, perfect.score, perfect.passed], [5, 100, true])
  const two = scoreAttempt(a, a.questions.map((q, i) => (i < 2 ? q.correctIndex : (q.correctIndex + 1) % q.options.length)))
  assert.deepEqual([two.correct, two.score, two.passed], [2, 40, false])
  assert.equal(scoreAttempt(a, []).correct, 0)
})

test('the assessment mapping verifies only on a pass and never overrides external verification', () => {
  const s = { id: 'x', studentId: 's', skillId: 'sql', proficiency: 76, evidenceType: 'self_reported', verificationStatus: 'unverified', createdAt: '', updatedAt: '' }
  const pass = applyAttemptToSkill(s, { score: 80, passed: true, completedAt: 't' }, 'ver-1')
  assert.deepEqual([pass.proficiency, pass.evidenceType, pass.verificationStatus, pass.selfRating], [80, 'assessment_verified', 'verified', 76])
  const fail = applyAttemptToSkill(s, { score: 40, passed: false, completedAt: 't' }, undefined)
  assert.deepEqual([fail.proficiency, fail.evidenceType, fail.verificationStatus], [40, 'self_reported', 'unverified'])
  const inst = { ...s, evidenceType: 'institution_verified', verificationStatus: 'verified', verificationId: 'v' }
  assert.equal(applyAttemptToSkill(inst, { score: 20, passed: false, completedAt: 't' }, undefined).proficiency, 76)
})

// ── Seed data ──────────────────────────────────────────────────────────────────────────────────────────────────

const state = createSeedState()
const inputFor = studentId => ({
  skills: state.studentSkills.filter(s => s.studentId === studentId),
  projects: state.projects.filter(p => p.studentId === studentId).map(p => ({ ...p, skillIds: state.projectSkills.filter(ps => ps.projectId === p.id).map(ps => ps.skillId) })),
})
const jobInput = jobId => {
  const rs = state.jobRequirements.filter(r => r.jobId === jobId)
  const map = kind => rs.filter(r => r.kind === kind).map(r => ({ skillId: r.skillId, name: r.skillId, minProficiency: r.minProficiency }))
  return { required: map('required'), preferred: map('preferred'), evidencePolicy: state.jobs.find(j => j.id === jobId).evidencePolicy }
}
const scoreOf = (studentId, jobId) => calculateCandidateMatch(inputFor(studentId), jobInput(jobId)).score

test('seeding is deterministic and meets the dataset minimums', () => {
  assert.deepEqual(createSeedState(), createSeedState())
  assert.ok(state.students.length >= 12)
  assert.ok(state.companies.length >= 5)
  assert.ok(state.jobs.length >= 8)
  assert.ok(state.projects.filter(p => p.studentId === PRIMARY_STUDENT_ID).length >= 3)
  const ids = Object.values(state).filter(Array.isArray).flat().map(r => r.id).filter(Boolean)
  assert.equal(new Set(ids).size, ids.length, 'ids are unique')
})

test('every verified claim in the seed has an explicit verification record', () => {
  for (const s of [...state.studentSkills, ...state.projects]) {
    if (s.verificationStatus === 'verified') assert.ok(state.verifications.some(v => v.id === s.verificationId), `${s.id} has a record`)
  }
})

test('seeded matches are coherent: frontend profiles beat data profiles for frontend roles', () => {
  assert.ok(scoreOf('s-aarav', 'j-ns-frontend') > scoreOf('s-priya', 'j-ns-frontend'))
  assert.ok(scoreOf('s-priya', 'j-ns-data') > scoreOf('s-aarav', 'j-ns-data'))
  assert.ok(scoreOf('s-meera', 'j-ns-design') > scoreOf('s-aarav', 'j-ns-design'))
  assert.ok(scoreOf('s-kabir', 'j-ns-ml') > scoreOf('s-rohan', 'j-ns-ml'))
  const frontend = state.students.map(s => scoreOf(s.id, 'j-ns-frontend'))
  assert.ok(new Set(frontend).size >= 6, 'scores vary across candidates')
})
