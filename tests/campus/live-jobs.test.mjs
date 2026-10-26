// Live-openings extraction and seed calibration tests. Run with `npm run test:campus`.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { htmlToText, inferSkills, parseMinYears, roleFamily, toLiveJob } from '../../lib/campus/live-jobs.ts'
import { createSeedState, deriveRequirements } from '../../lib/campus/seed.ts'

test('skills split into required and preferred by section, ignoring company blurbs', () => {
  const text = htmlToText(`
    <h3>About Us</h3><p>We use Kubernetes and machine learning everywhere.</p>
    <h3>Requirements</h3><ul><li>Strong Python and SQL</li><li>Good communication skills and React experience</li></ul>
    <h3>Nice to have</h3><ul><li>Experience with Docker</li><li>Good communication skills</li></ul>
    <h3>Benefits</h3><p>Free AWS credits</p>`)
  const { required, preferred } = inferSkills(text)
  assert.deepEqual(required.sort(), ['communication', 'python', 'react', 'sql'])
  assert.deepEqual(preferred, ['docker'])
})

test('patterns avoid common false positives', () => {
  const none = inferSkills('You will react quickly to incidents and excel in a fast-paced team. Go-to-market experience.')
  assert.deepEqual([...none.required, ...none.preferred], [])
  const some = inferSkills('Languages: Java, Go, C++ and JavaScript. Advanced Excel.')
  assert.deepEqual(some.required.sort(), ['cpp', 'excel', 'golang', 'java', 'javascript'])
})

test('minimum experience is read from the posting, and internships count as zero', () => {
  assert.equal(parseMinYears('Software Engineer', 'You have 3-5 years of experience building services, 8+ years preferred'), 3)
  assert.equal(parseMinYears('Backend Engineer', 'We were founded 10 years ago.'), null)
  assert.equal(parseMinYears('SDE Intern', 'Requires 5 years experience'), 0)
  assert.equal(parseMinYears('Data Analyst', '2+ years of experience in analytics. 1 year experience with Tableau.'), 2)
  assert.equal(parseMinYears('Senior Data Analyst', '1+ years experience with Tableau; 5+ years of analytics experience'), 5)
})

test('role families keep technical roles and drop managers and sales', () => {
  assert.equal(roleFamily('Senior Frontend Engineer'), 'frontend')
  assert.equal(roleFamily('Product Analyst II'), 'data_analyst')
  assert.equal(roleFamily('Applied Scientist III'), 'ml')
  assert.equal(roleFamily('Engineering Manager'), null)
  assert.equal(roleFamily('Account Executive'), null)
})

test('only Indian roles with inferable skills become live jobs', () => {
  const board = { source: 'greenhouse', board: 'acme', company: 'Acme' }
  const base = { id: '1', title: 'Backend Engineer', url: 'https://example.com/1', postedAt: null, text: 'Requirements\nPython, SQL and Docker' }
  assert.equal(toLiveJob(board, { ...base, location: 'Berlin, Germany' }), null)
  assert.equal(toLiveJob(board, { ...base, location: 'Bengaluru', text: 'No skills here' }), null)
  const job = toLiveJob(board, { ...base, location: 'Bengaluru, India' })
  assert.deepEqual([job.family, job.required.sort()], ['backend', ['docker', 'python', 'sql']])
  assert.equal(toLiveJob(board, { ...base, location: 'Pune, India', text: 'Python and SQL' }), null, 'fewer than three skills')
})

test('calibration applies its thresholds and refuses thin samples', () => {
  assert.equal(deriveRequirements(['data_engineer']), null)
  const d = deriveRequirements(['ml'])
  assert.ok(d.postings >= 8)
  assert.ok(d.required.length >= 1 && d.required.length <= 3 && d.required.every(r => r.share >= 0.5))
  assert.ok(d.preferred.length <= 3 && d.preferred.every(r => r.share >= 0.3 && r.share <= d.required.at(-1).share))
})

test('every seeded job requirement refers to a skill in the catalogue', () => {
  const state = createSeedState()
  const ids = new Set(state.skills.map(s => s.id))
  for (const r of state.jobRequirements) assert.ok(ids.has(r.skillId), `${r.jobId} → ${r.skillId}`)
  assert.ok(state.jobs.filter(j => j.calibration).length >= 8)
})
