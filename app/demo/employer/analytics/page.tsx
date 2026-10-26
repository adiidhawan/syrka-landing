'use client'

import { useState } from 'react'
import { BarList } from '@/components/campus/charts'
import JobSelect from '@/components/campus/JobSelect'
import { Card, PageHeader, Stat, Tag } from '@/components/campus/ui'
import { PRIMARY_COMPANY_ID } from '@/lib/campus/seed'
import { useDemoState } from '@/lib/campus/store'
import { companyJobs, EVIDENCE_LABEL, EVIDENCE_ORDER, employerCandidates, employerMatch, employerStats } from '@/lib/campus/queries'

const BUCKETS = [
  { key: 'b4', label: '75–100% aligned', min: 75, max: 100 },
  { key: 'b3', label: '50–74%', min: 50, max: 74 },
  { key: 'b2', label: '25–49%', min: 25, max: 49 },
  { key: 'b1', label: 'Below 25%', min: 0, max: 24 },
]

export default function EmployerAnalyticsPage() {
  const state = useDemoState()
  const [jobId, setJobId] = useState(() => companyJobs(state, PRIMARY_COMPANY_ID)[0]?.id ?? '')
  const stats = employerStats(state, PRIMARY_COMPANY_ID)
  const candidates = employerCandidates(state)
  const scores = candidates.map(c => employerMatch(state, c, jobId).score)
  const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0
  const skills = candidates.flatMap(c => c.skills)
  const verifiedShare = skills.length ? Math.round((skills.filter(s => s.verificationStatus === 'verified').length / skills.length) * 100) : 0

  return (
    <>
      <PageHeader eyebrow="Analytics" title="Recruitment analytics" description="Calculated live from the demo dataset and your shortlisting and review actions. Private profiles are excluded." actions={<Tag tone="warn">Demo analytics</Tag>} />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Discoverable" value={stats.candidates} />
        <Stat label="Reviewed" value={stats.reviewed} hint={`${stats.candidates ? Math.round((stats.reviewed / stats.candidates) * 100) : 0}% of pool`} />
        <Stat label="Shortlisted" value={stats.shortlisted} hint={`${stats.reviewed ? Math.round((stats.shortlisted / Math.max(1, stats.reviewed)) * 100) : 0}% of reviewed`} />
        <Stat label="Verified skill claims" value={`${verifiedShare}%`} hint="of claims in the pool" />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card title="Pipeline" description="Unique candidates at each stage.">
          <BarList caption="Recruitment pipeline" data={[
            { key: 'pool', label: 'Discoverable', value: stats.candidates },
            { key: 'reviewed', label: 'Reviewed', value: stats.reviewed },
            { key: 'shortlisted', label: 'Shortlisted', value: stats.shortlisted },
          ]} />
          {stats.hiddenShortlisted > 0 && <p className="mt-3 text-[12px] text-cx-dim">{stats.hiddenShortlisted} earlier shortlist entr{stats.hiddenShortlisted === 1 ? 'y belongs' : 'ies belong'} to candidates who have since made their profile private and are not counted.</p>}
        </Card>
        <Card title="Shortlists by role">
          <BarList caption="Shortlisted candidates per role" data={stats.shortlistsByJob.map(s => ({ key: s.job.id, label: s.job.title, value: s.count }))} max={Math.max(3, ...stats.shortlistsByJob.map(s => s.count))} />
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card title="Alignment distribution" description={`Average ${avg}% across ${scores.length} discoverable candidates.`} action={<JobSelect value={jobId} onChange={setJobId} label="Role" />}>
          <BarList caption="Candidates per alignment band" data={BUCKETS.map(b => ({ key: b.key, label: b.label, value: scores.filter(s => s >= b.min && s <= b.max).length }))} max={Math.max(1, scores.length)} />
        </Card>
        <Card title="Evidence in the candidate pool" description="Skill claims by evidence type; the darker portion is verified.">
          <BarList
            caption="Skill claims by evidence type"
            secondaryLabel="verified"
            data={EVIDENCE_ORDER.map(ev => ({ key: ev, label: EVIDENCE_LABEL[ev], value: skills.filter(s => s.evidenceType === ev).length, secondary: skills.filter(s => s.evidenceType === ev && s.verificationStatus === 'verified').length }))}
          />
        </Card>
      </div>
    </>
  )
}
