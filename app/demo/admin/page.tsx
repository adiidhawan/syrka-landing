'use client'

import { BarList } from '@/components/campus/charts'
import ResetDemoButton from '@/components/campus/ResetDemoButton'
import { Card, PageHeader, Stat, Tag, Time } from '@/components/campus/ui'
import { useDemoState } from '@/lib/campus/store'
import { evidenceBreakdown, skillDistribution } from '@/lib/campus/queries'

export default function AdminPage() {
  const state = useDemoState()
  const visible = state.students.filter(s => s.visibility.employerVisible).length
  const evidence = evidenceBreakdown(state)
  const verifiedClaims = state.studentSkills.filter(s => s.verificationStatus === 'verified').length
  const skills = skillDistribution(state, state.students.map(s => s.id), 0).slice(0, 10)
  const count = (kind: string) => state.activity.filter(a => a.kind === kind).length
  const shortlistsByCompany = state.companies.map(c => ({ key: c.id, label: c.name, value: state.shortlists.filter(s => s.companyId === c.id).length })).filter(d => d.value > 0)
  const recent = state.activity.slice(0, 8)

  return (
    <>
      <PageHeader
        eyebrow="Demo administration"
        title="Ecosystem overview"
        description="Totals across the whole fictional dataset, calculated from the records in this browser."
        actions={<ResetDemoButton className="cx-btn cx-btn-danger" />}
      />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Demo students" value={state.students.length} hint={`${visible} visible to employers`} />
        <Stat label="Companies" value={state.companies.length} />
        <Stat label="Opportunities" value={state.jobs.length} hint={`${state.jobs.filter(j => j.status === 'open').length} open`} />
        <Stat label="Capability records" value={state.studentSkills.length} hint={`${verifiedClaims} verified · ${state.verifications.length} verification records`} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card title="Evidence verification breakdown" description="Skill claims by evidence type; the darker portion has a verification record.">
          <BarList caption="Skill claims by evidence type" secondaryLabel="verified" data={evidence.map(e => ({ key: e.evidenceType, label: e.label, value: e.count, secondary: e.verified }))} />
        </Card>
        <Card title="Skill distribution" description="Students holding each skill, any level. Darker portion verified.">
          <BarList caption="Students per skill" secondaryLabel="verified" data={skills.map(s => ({ key: s.skillId, label: s.name, value: s.total, secondary: s.verified }))} />
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card title="Matching activity">
          <dl className="space-y-2.5 text-[13px]">
            {[
              ['Opportunity views', count('job_viewed')],
              ['Assessments completed', state.attempts.length],
              ['Projects added', count('project_added')],
              ['Skills added', count('skill_added')],
              ['Visibility changes', count('visibility_changed')],
            ].map(([k, v]) => <div key={k} className="flex justify-between border-b border-cx-line pb-2 last:border-0"><dt className="text-cx-ink2">{k}</dt><dd className="cx-num font-medium">{v}</dd></div>)}
          </dl>
          <p className="mt-3 text-[11.5px] text-cx-dim">Counts include seeded demo activity.</p>
        </Card>
        <Card title="Shortlisting activity">
          <BarList caption="Shortlist entries per company" data={shortlistsByCompany} />
          <dl className="mt-4 space-y-2 text-[13px]">
            <div className="flex justify-between"><dt className="text-cx-ink2">Shortlist entries</dt><dd className="cx-num font-medium">{state.shortlists.length}</dd></div>
            <div className="flex justify-between"><dt className="text-cx-ink2">Candidate reviews</dt><dd className="cx-num font-medium">{state.reviews.length}</dd></div>
            <div className="flex justify-between"><dt className="text-cx-ink2">Employer notes</dt><dd className="cx-num font-medium">{state.notes.length}</dd></div>
          </dl>
        </Card>
        <Card title="Latest events" padded={false} action={<Tag>All personas</Tag>}>
          <ul>
            {recent.map(a => <li key={a.id} className="border-t border-cx-line px-5 py-2 text-[12.5px] first:border-0"><div className="text-cx-ink2">{a.message}</div><Time iso={a.createdAt} relative className="text-[11.5px] text-cx-dim" /></li>)}
          </ul>
        </Card>
      </div>
      <p className="mt-6 text-[12px] text-cx-dim">This is a product demonstration, not an administration system. Data lives in this browser only; resetting restores the original fictional dataset.</p>
    </>
  )
}
