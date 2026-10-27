// Live-openings mapping, source handling and seed calibration tests. Run with `npm run test:campus`.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  himalayasIdFromGuid, himalayasPathFromId, himalayasToLiveJob, htmlToText, mapSkills, parseMinYears, parseCompanyBoards,
  companyToLiveJob, roleFamily, DEFAULT_COMPANY_BOARDS,
} from '../../lib/campus/live-jobs.ts'
import { calculateCandidateMatch } from '../../lib/campus/matching.ts'
import { createSeedState, deriveRequirements } from '../../lib/campus/seed.ts'

test('skills are split by provenance: stated required, stated preferred, extracted from prose', () => {
  const text = htmlToText(`
    <p>You will build dashboards in React for our ops team.</p>
    <h3>About Us</h3><p>We use Kubernetes and machine learning everywhere.</p>
    <h3>Requirements</h3><ul><li>Strong Python and SQL</li><li>Good communication skills</li></ul>
    <h3>Nice to have</h3><ul><li>Experience with Docker</li><li>Good communication skills</li></ul>
    <h3>Responsibilities</h3><ul><li>Maintain Node.js services</li></ul>
    <h3>Benefits</h3><p>Free AWS credits</p>`)
  const { required, preferred, extracted } = mapSkills(text)
  assert.deepEqual(required.sort(), ['communication', 'python', 'sql'])
  assert.deepEqual(preferred, ['docker'])
  assert.deepEqual(extracted.sort(), ['nodejs', 'react'])
})

test('patterns avoid common false positives', () => {
  const none = mapSkills('You will react quickly to incidents and excel in a fast-paced team. Go-to-market experience.')
  assert.deepEqual([...none.required, ...none.preferred, ...none.extracted], [])
  const some = mapSkills('Skills\nLanguages: Java, Go, C++ and JavaScript. Advanced Excel.')
  assert.deepEqual(some.required.sort(), ['cpp', 'excel', 'golang', 'java', 'javascript'])
})

test('experience is read from the posting; senior titles take the highest figure', () => {
  assert.equal(parseMinYears('Software Engineer', 'You have 3-5 years of experience building services, 8+ years preferred'), 3)
  assert.equal(parseMinYears('Backend Engineer', 'We were founded 10 years ago.'), null)
  assert.equal(parseMinYears('SDE Intern', 'Requires 5 years experience'), 0)
  assert.equal(parseMinYears('Senior Data Analyst', '1+ years experience with Tableau; 5+ years of analytics experience'), 5)
})

test('role families keep technical roles and drop managers and sales', () => {
  assert.equal(roleFamily('Junior Frontend Web Developer'), 'frontend')
  assert.equal(roleFamily('Product Analyst II'), 'data_analyst')
  assert.equal(roleFamily('Engineering Manager'), null)
  assert.equal(roleFamily('Fighter Pilot'), null)
})

const himalayasJob = {
  guid: 'https://himalayas.app/companies/acme-labs/jobs/junior-frontend-developer',
  title: 'Junior Frontend Developer', companyName: 'Acme Labs', employmentType: 'Full Time', seniority: ['Entry-level'],
  locationRestrictions: ['India'], pubDate: 1791829544, expiryDate: 1797013542,
  applicationLink: 'https://himalayas.app/companies/acme-labs/jobs/junior-frontend-developer?utm_source=api',
  description: '<h3>Requirements</h3><ul><li>React, JavaScript and CSS</li></ul>',
}

test('Himalayas jobs keep the mandated apply link, credit and ids that round-trip', () => {
  const job = himalayasToLiveJob(himalayasJob)
  assert.equal(job.applyUrl, himalayasJob.applicationLink)
  assert.equal(job.sourceLabel, 'Himalayas')
  assert.equal(job.id, 'hm--acme-labs--junior-frontend-developer')
  assert.equal(himalayasPathFromId(job.id), 'companies/acme-labs/jobs/junior-frontend-developer')
  assert.equal(himalayasIdFromGuid(himalayasJob.guid), job.id)
  assert.deepEqual(job.required.sort(), ['html-css', 'javascript', 'react'])
  assert.equal(job.location, 'Remote · India')
})

test('Himalayas jobs that are not openings, not technical or not open to India are dropped', () => {
  assert.equal(himalayasToLiveJob({ ...himalayasJob, title: 'Frontend Developer - Future Position' }), null)
  assert.equal(himalayasToLiveJob({ ...himalayasJob, title: 'Fighter Pilot' }), null)
  assert.equal(himalayasToLiveJob({ ...himalayasJob, locationRestrictions: ['Mexico'] }), null)
  assert.equal(himalayasToLiveJob({ ...himalayasJob, locationRestrictions: [] }).location, 'Remote · open worldwide')
})

test('company careers pages are read by default, the list can be overridden, and malformed entries are ignored', () => {
  assert.equal(parseCompanyBoards(undefined), DEFAULT_COMPANY_BOARDS)
  assert.ok(DEFAULT_COMPANY_BOARDS.some(b => b.company === 'Razorpay'))
  assert.deepEqual(parseCompanyBoards('greenhouse:groww:Groww, lever:meesho, workday:x:Y, ashby:bad slug:Z'), [
    { source: 'greenhouse', board: 'groww', company: 'Groww' },
    { source: 'lever', board: 'meesho', company: 'meesho' },
  ])
  const job = companyToLiveJob({ source: 'greenhouse', board: 'acme', company: 'Acme' },
    { id: '1', title: 'Backend Engineer', location: 'Bengaluru, India', url: 'https://example.com/1', postedAt: null, text: 'Requirements\nPython, SQL and Docker' })
  assert.equal(job.sourceLabel, 'Acme careers')
  assert.equal(job.applyUrl, 'https://example.com/1', 'apply goes straight to the company posting')
  assert.equal(companyToLiveJob({ source: 'greenhouse', board: 'acme', company: 'Acme' }, { id: '2', title: 'Backend Engineer', location: 'Berlin', url: 'https://example.com/2', postedAt: null, text: 'Python' }), null)
})

test('too few stated requirements gives limited source detail, not a score', () => {
  const candidate = { skills: [{ skillId: 'react', proficiency: 95, evidenceType: 'assessment_verified', verificationStatus: 'verified' }], projects: [] }
  const req = id => ({ skillId: id, name: id, minProficiency: 70 })
  const thin = calculateCandidateMatch(candidate, { required: [req('react'), req('css')], preferred: [] }, { minRequirements: 3 })
  assert.equal(thin.status, 'limited_detail')
  assert.equal(thin.score, 0)
  const enough = calculateCandidateMatch(candidate, { required: [req('react'), req('css'), req('javascript')], preferred: [] }, { minRequirements: 3 })
  assert.equal(enough.status, 'ok')
})

test('requirements mapped from text cap confidence at medium', () => {
  const v = id => ({ skillId: id, proficiency: 90, evidenceType: 'assessment_verified', verificationStatus: 'verified' })
  const candidate = { skills: ['react', 'css', 'javascript'].map(v), projects: [] }
  const job = { required: ['react', 'css', 'javascript'].map(id => ({ skillId: id, name: id, minProficiency: 70 })), preferred: [] }
  assert.equal(calculateCandidateMatch(candidate, job).confidence, 'high')
  const fromText = calculateCandidateMatch(candidate, job, { requirementsFromText: true })
  assert.equal(fromText.confidence, 'medium')
  assert.match(fromText.confidenceNote, /mapped from the posting text/)
})

test('calibration applies its thresholds and refuses thin samples', () => {
  assert.equal(deriveRequirements([]), null)
  const d = deriveRequirements(['ml'])
  assert.ok(d.postings >= 15)
  assert.ok(d.required.length >= 2 && d.required.length <= 3 && d.required.every(r => r.share >= 0.5))
  assert.ok(d.preferred.length <= 3 && d.preferred.every(r => r.share >= 0.3 && r.share <= d.required.at(-1).share))
})

test('every seeded job requirement refers to a skill in the catalogue', () => {
  const state = createSeedState()
  const ids = new Set(state.skills.map(s => s.id))
  for (const r of state.jobRequirements) assert.ok(ids.has(r.skillId), `${r.jobId} → ${r.skillId}`)
  assert.ok(state.jobs.filter(j => j.calibration).length >= 6)
})
