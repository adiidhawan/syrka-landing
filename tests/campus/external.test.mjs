// External data modules: attribution, market demand, GitHub missions, open data, activity and honesty rules.
// Run with `npm run test:campus`.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { DATA_SOURCES, ONET_ATTRIBUTION } from '../../lib/campus/sources.ts'
import { computeDemand, priorWeekSnapshot, toSnapshot, weeklyChange } from '../../lib/campus/market-demand.ts'
import { fetchMissions, issuesToMissions, parseMissionRepos, parseRepoRef, DEFAULT_MISSION_REPOS } from '../../lib/campus/github.ts'
import { openAlexToWorks, worldBankLatest, LANDSCAPE_INDICATORS } from '../../lib/campus/open-data.ts'
import { migrateState } from '../../lib/campus/migrations.ts'
import { createSeedState, PRIMARY_STUDENT_ID, SCHEMA_VERSION } from '../../lib/campus/seed.ts'
import {
  readDemoState, recordApplicationOpened, recordLiveView, resetDemo, saveConnectedRepo, setOpportunityDismissed,
  toggleSavedMission, toggleSavedOpportunity,
} from '../../lib/campus/store.ts'

// ── Source attribution ─────────────────────────────────────────────────────────────────────────────────────────

test('every external source declares its use, licence, attribution, refresh and limits', () => {
  assert.equal(new Set(DATA_SOURCES.map(s => s.key)).size, DATA_SOURCES.length)
  for (const s of DATA_SOURCES) {
    for (const f of ['name', 'usedFor', 'licence', 'attribution', 'refresh', 'neverUsedFor']) assert.ok(s[f]?.trim(), `${s.key}.${f}`)
    assert.match(s.homepage, /^https:\/\//)
    assert.match(s.licenceUrl, /^https:\/\//)
  }
})

test('O*NET attribution carries the exact required wording', () => {
  assert.equal(ONET_ATTRIBUTION, 'Includes information from the O*NET 31.0 Database by the U.S. Department of Labor, Employment and Training Administration, used under CC BY 4.0. Syrka has modified and mapped portions of this data.')
  const onet = DATA_SOURCES.find(s => s.key === 'onet')
  assert.ok(onet.attribution.startsWith(ONET_ATTRIBUTION))
  assert.match(onet.neverUsedFor, /evidence/)
  assert.match(DATA_SOURCES.find(s => s.key === 'himalayas').attribution, /Himalayas/)
  assert.match(DATA_SOURCES.find(s => s.key === 'company_boards').attribution, /original posting/)
  assert.match(DATA_SOURCES.find(s => s.key === 'github').attribution, /Source: GitHub/)
  assert.match(DATA_SOURCES.find(s => s.key === 'openalex').attribution, /Source: OpenAlex/)
})

// ── Market demand ──────────────────────────────────────────────────────────────────────────────────────────────

const job = (id, over = {}) => ({
  id, source: 'himalayas', sourceLabel: 'Himalayas', sourceHome: 'https://himalayas.app', company: `Co ${id}`, title: `Role ${id}`,
  location: 'Remote · India', openWorldwide: false, applyUrl: `https://himalayas.app/x/${id}`, postedAt: null, expiresAt: null,
  family: 'frontend', seniority: ['Entry-level'], employmentType: 'Full Time', minYears: null, required: [], preferred: [], extracted: [], ...over,
})

test('demand counts each role once per skill, stated before extracted, with the requested breakdowns', () => {
  const jobs = [
    job('a', { required: ['react'], extracted: ['sql'] }),
    job('b', { preferred: ['react'], openWorldwide: true, employmentType: 'Intern', family: 'fullstack' }),
    job('c', { extracted: ['react', 'sql'], family: 'data_analyst' }),
  ]
  const d = computeDemand(jobs, '2026-10-26T06:00:00.000Z')
  assert.equal(d.totalJobs, 3)
  assert.deepEqual([d.skills.react.stated, d.skills.react.extracted, d.skills.react.total], [2, 1, 3])
  assert.equal(d.skills.react.indiaOnly, 2)
  assert.deepEqual([d.skills.react.internship, d.skills.react.fullTime], [1, 2])
  assert.equal(d.skills.react.families.length, 3)
  assert.deepEqual(d.skills.react.examples.map(e => e.stated), [true, true, false])
  assert.deepEqual([d.skills.sql.stated, d.skills.sql.extracted], [0, 2])
  assert.deepEqual(d.families.frontend, { roles: 1, skills: { react: 1, sql: 1 } })
})

test('no live jobs gives an empty demand, not invented figures', () => {
  const d = computeDemand([], '2026-10-26T06:00:00.000Z')
  assert.deepEqual([d.totalJobs, Object.keys(d.skills).length, Object.keys(d.families).length], [0, 0, 0])
})

test('a weekly change needs a real snapshot from about 7 days earlier; otherwise there is no trend', () => {
  const snap = (date, n) => ({ date, fetchedAt: `${date}T06:00:00.000Z`, totalJobs: n, skills: { react: { stated: n, extracted: 0 } } })
  const now = computeDemand([job('a', { required: ['react'] }), job('b', { required: ['react'] })], '2026-10-26T06:00:00.000Z')
  assert.equal(priorWeekSnapshot([], '2026-10-26'), null)
  assert.equal(priorWeekSnapshot([snap('2026-10-23', 9)], '2026-10-26'), null, '3 days is not a week')
  const prior = priorWeekSnapshot([snap('2026-10-23', 9), snap('2026-10-19', 5)], '2026-10-26')
  assert.equal(prior.date, '2026-10-19')
  assert.equal(weeklyChange(now.skills.react, prior, 'react'), -3)
  assert.equal(weeklyChange(now.skills.react, null, 'react'), null)
  assert.deepEqual(toSnapshot(now).skills.react, { stated: 2, extracted: 0 })
})

// ── GitHub missions ────────────────────────────────────────────────────────────────────────────────────────────

const issue = (n, over = {}) => ({ number: n, state: 'open', locked: false, assignees: [], title: `Issue ${n}`, html_url: `https://github.com/acme/tool/issues/${n}`, labels: [{ name: 'good first issue' }], updated_at: '2026-10-20T00:00:00Z', comments: 1, ...over })

test('pull requests, assigned, locked and off-repository items are never missions', () => {
  const items = [
    issue(1),
    issue(2, { pull_request: { url: 'x' }, html_url: 'https://github.com/acme/tool/pull/2' }),
    issue(3, { assignees: [{ login: 'someone' }] }),
    issue(4, { locked: true }),
    issue(5, { html_url: 'https://evil.example/acme/tool/issues/5' }),
  ]
  const missions = issuesToMissions('acme/tool', items, 'TypeScript')
  assert.deepEqual(missions.map(m => m.number), [1])
  assert.deepEqual(missions[0], { id: 'acme/tool#1', repo: 'acme/tool', number: 1, title: 'Issue 1', url: 'https://github.com/acme/tool/issues/1', labels: ['good first issue'], language: 'TypeScript', updatedAt: '2026-10-20T00:00:00Z', comments: 1 })
  assert.deepEqual(issuesToMissions('acme/tool', null, null), [])
})

test('the allow-list is explicit and malformed entries are ignored', () => {
  assert.equal(parseMissionRepos(undefined), DEFAULT_MISSION_REPOS)
  assert.deepEqual(parseMissionRepos('a/b:help wanted|docs, bad entry, c/d'), [
    { repo: 'a/b', labels: ['help wanted', 'docs'] },
    { repo: 'c/d', labels: ['good first issue'] },
  ])
  assert.equal(parseRepoRef('https://github.com/acme/tool.git'), 'acme/tool')
  assert.equal(parseRepoRef('https://gitlab.com/acme/tool'), null)
})

function fakeGitHub(routes) {
  const calls = []
  const fetchImpl = async (url, init) => {
    calls.push({ url, init })
    const path = url.replace('https://api.github.com', '')
    const route = routes(path, init)
    return new Response(route.body === undefined ? null : JSON.stringify(route.body), { status: route.status ?? 200, headers: route.headers ?? {} })
  }
  return { calls, fetchImpl }
}

test('missions are read-only, allow-listed, conditional and exclude pull requests', async () => {
  const { calls, fetchImpl } = fakeGitHub((path, init) => {
    if (path === '/repos/acme/one') return init.headers['If-None-Match'] ? { status: 304 } : { body: { language: 'Python', private: false, archived: false }, headers: { etag: '"r1"' } }
    if (path.startsWith('/repos/acme/one/issues')) return { body: [issue(7, { html_url: 'https://github.com/acme/one/issues/7' }), issue(8, { pull_request: {}, html_url: 'https://github.com/acme/one/pull/8' })] }
    return { status: 404 }
  })
  const repos = [{ repo: 'acme/one', labels: ['good first issue'] }]
  const first = await fetchMissions(repos, { fetchImpl })
  assert.deepEqual(first.missions.map(m => m.id), ['acme/one#7'])
  const second = await fetchMissions(repos, { fetchImpl })
  assert.equal(second.missions.length, 1)
  assert.ok(calls.every(c => c.init.method === 'GET'), 'only GET requests')
  assert.ok(calls.every(c => c.url.startsWith('https://api.github.com/repos/acme/one')), 'only the allow-listed repository')
  assert.ok(calls.some(c => c.init.headers['If-None-Match'] === '"r1"'), 'conditional request sent')
  assert.ok(calls.every(c => !('Authorization' in c.init.headers)), 'no credentials without a token')
})

test('a rate limit stops further requests and leaves an empty state, not stale invented data', async () => {
  const { calls, fetchImpl } = fakeGitHub(() => ({ status: 403, headers: { 'x-ratelimit-remaining': '0', 'x-ratelimit-reset': '1793010000' } }))
  const r = await fetchMissions([{ repo: 'rl/one', labels: ['good first issue'] }, { repo: 'rl/two', labels: ['good first issue'] }], { fetchImpl })
  assert.deepEqual(r.missions, [])
  assert.ok(r.rateLimitedUntil)
  assert.deepEqual(r.repos.map(x => x.ok), [false, false])
  assert.equal(calls.length, 1, 'stopped after the first rate-limited response')
})

// ── Open research and aggregate context ────────────────────────────────────────────────────────────────────────

test('OpenAlex works need a title and a link, and carry their open-access flag', () => {
  const works = openAlexToWorks({ results: [
    { id: 'W1', display_name: 'A study', publication_date: '2026-01-02', doi: 'https://doi.org/10.1/x', open_access: { is_oa: true, oa_status: 'gold' }, authorships: [{ author: { display_name: 'R. Rao' }, institutions: [{ display_name: 'IIT Demo' }] }] },
    { id: 'W2', display_name: 'No link', open_access: { is_oa: true } },
  ] })
  assert.equal(works.length, 1)
  assert.deepEqual([works[0].openAccess, works[0].authors, works[0].institutions], [true, ['R. Rao'], ['IIT Demo']])
  assert.deepEqual(openAlexToWorks({}), [])
})

test('World Bank series show the latest value with its date and are hidden when stale', () => {
  const meta = LANDSCAPE_INDICATORS[0]
  const body = [{ lastupdated: '2026-10-08' }, [{ date: '2025', value: 16.022 }, { date: '2024', value: 16.5 }]]
  assert.deepEqual(worldBankLatest(body, meta, new Date('2026-10-26')), { ...meta, value: 16, year: 2025, datasetUpdated: '2026-10-08' })
  assert.equal(worldBankLatest([{}, [{ date: '2019', value: 10 }]], meta, new Date('2026-10-26')), null)
  assert.equal(worldBankLatest([{}, []], meta), null)
})

// ── Activity and honesty ───────────────────────────────────────────────────────────────────────────────────────

test('the demo student starts with no activity and no illustrative history', () => {
  const s = createSeedState()
  assert.equal(s.activity.filter(a => a.actor === 'student').length, 0)
  assert.ok(!('skillHistory' in s))
  assert.deepEqual([s.savedOpportunities, s.dismissedOpportunities, s.savedMissions, s.connectedRepos], [[], [], [], []])
})

test('interactions are recorded as they happen, with real timestamps', () => {
  resetDemo()
  const live = job('x1', { title: 'Junior Frontend Developer', company: 'Acme' })
  const before = Date.now()
  recordLiveView(PRIMARY_STUDENT_ID, live)
  recordLiveView(PRIMARY_STUDENT_ID, live)
  toggleSavedOpportunity(PRIMARY_STUDENT_ID, live)
  recordApplicationOpened(PRIMARY_STUDENT_ID, live)
  setOpportunityDismissed(PRIMARY_STUDENT_ID, live, true)
  toggleSavedMission(PRIMARY_STUDENT_ID, { id: 'acme/tool#1', repo: 'acme/tool', title: 'Fix docs', url: 'https://github.com/acme/tool/issues/1' })
  const s = readDemoState()
  const mine = s.activity.filter(a => a.actor === 'student').map(a => a.kind)
  assert.deepEqual(mine, ['mission_saved', 'opportunity_dismissed', 'application_opened', 'opportunity_saved', 'live_job_viewed'])
  assert.ok(s.activity.filter(a => a.actor === 'student').every(a => Date.parse(a.createdAt) >= before - 1000))
  assert.deepEqual([s.savedOpportunities.map(o => o.jobId), s.dismissedOpportunities.map(o => o.jobId), s.savedMissions.map(m => m.id)], [['x1'], ['x1'], ['acme/tool#1']])
})

test('external data never changes skills, verification, projects or assessments', () => {
  resetDemo()
  const before = readDemoState()
  const snapshot = JSON.stringify([before.studentSkills, before.verifications, before.projects, before.attempts])
  saveConnectedRepo(PRIMARY_STUDENT_ID, 'p-aarav-collab', { fullName: 'acme/tool', url: 'https://github.com/acme/tool', description: null, language: 'TypeScript', languages: { TypeScript: 100 }, pushedAt: null, stars: 3, fetchedAt: new Date().toISOString() })
  toggleSavedOpportunity(PRIMARY_STUDENT_ID, job('y', { required: ['react', 'kubernetes'] }))
  const after = readDemoState()
  assert.equal(JSON.stringify([after.studentSkills, after.verifications, after.projects, after.attempts]), snapshot)
  assert.equal(after.connectedRepos.length, 1)
})

test('migration keeps the visitor’s own work and removes seeded student activity and history', () => {
  const v3 = { ...createSeedState(), schemaVersion: 3, skillHistory: [{ illustrative: true }] }
  delete v3.savedOpportunities; delete v3.dismissedOpportunities; delete v3.savedMissions; delete v3.connectedRepos
  v3.activity = [
    { id: 'act-00a', kind: 'project_added', actor: 'student', studentId: PRIMARY_STUDENT_ID, message: 'seeded', createdAt: '2026-08-30T15:00:00.000Z' },
    { id: 'act-mvmajib4met51', kind: 'skill_added', actor: 'student', studentId: PRIMARY_STUDENT_ID, message: 'mine', createdAt: '2026-10-26T10:00:00.000Z' },
    { id: 'act-00b', kind: 'candidate_reviewed', actor: 'employer', studentId: 's-dev', message: 'employer', createdAt: '2026-10-10T09:30:00.000Z' },
  ]
  v3.projects = [...v3.projects, { ...v3.projects[0], id: 'p-mine', name: 'My own project' }]
  const m = migrateState(v3)
  assert.equal(m.schemaVersion, SCHEMA_VERSION)
  assert.deepEqual(m.activity.map(a => a.message), ['mine', 'employer'])
  assert.ok(!('skillHistory' in m))
  assert.ok(m.projects.some(p => p.id === 'p-mine'))
  assert.deepEqual(m.savedOpportunities, [])
  assert.equal(migrateState({ schemaVersion: 1 }), null)
})
