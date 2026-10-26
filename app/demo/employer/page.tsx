'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { BarList } from '@/components/campus/charts'
import { Avatar, Card, PageHeader, ScoreBadge, Stat, Tag, Time } from '@/components/campus/ui'
import { PRIMARY_COMPANY_ID } from '@/lib/campus/seed'
import { useDemoState } from '@/lib/campus/store'
import { company, companyJobs, employerCandidates, employerMatch, employerStats, skillDistribution } from '@/lib/campus/queries'

export default function EmployerDashboard() {
  const state = useDemoState()
  const org = company(state, PRIMARY_COMPANY_ID)
  const stats = employerStats(state, PRIMARY_COMPANY_ID)
  const candidates = employerCandidates(state)
  const jobs = companyJobs(state, PRIMARY_COMPANY_ID).filter(j => j.status === 'open')
  const distribution = skillDistribution(state, candidates.map(c => c.id)).slice(0, 8)
  const activity = state.activity.filter(a => a.companyId === PRIMARY_COMPANY_ID).slice(0, 7)
  const shortlisted = new Set(state.shortlists.filter(s => s.companyId === PRIMARY_COMPANY_ID).map(s => `${s.jobId}:${s.studentId}`))

  return (
    <>
      <PageHeader
        eyebrow={`${org?.name} · employer dashboard`}
        title="Recruitment overview"
        description="All figures are calculated from the fictional demo records and update as you shortlist and review."
        actions={<Link href="/demo/employer/candidates" className="cx-btn cx-btn-primary">Find candidates <ArrowRight size={14} aria-hidden /></Link>}
      />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Discoverable candidates" value={stats.candidates} hint={`${stats.privateProfiles} private, not shown`} href="/demo/employer/candidates" />
        <Stat label="Open positions" value={stats.openPositions} href="/demo/employer/jobs" />
        <Stat label="Candidates reviewed" value={stats.reviewed} hint={`of ${stats.candidates} discoverable`} />
        <Stat label="Shortlisted candidates" value={stats.shortlisted} hint={`${stats.shortlistEntries} shortlist entr${stats.shortlistEntries === 1 ? 'y' : 'ies'}`} href="/demo/employer/analytics" />
      </div>

      <div className="mt-4">
        <Card title="Recommended candidates for open positions" description="Top two discoverable candidates per role, by requirement alignment." padded={false}>
          <div className="cx-scroll-x">
            <table className="w-full min-w-[640px] text-[13px]">
              <thead><tr className="text-left text-[11.5px] text-cx-dim"><th className="px-5 py-2 font-medium">Role</th><th className="py-2 font-medium">Top candidates</th><th className="px-5 py-2 text-right font-medium">Shortlist</th></tr></thead>
              <tbody>
                {jobs.map(j => {
                  const top = candidates.map(c => ({ c, m: employerMatch(state, c, j.id) })).sort((a, b) => b.m.score - a.m.score).slice(0, 2)
                  return (
                    <tr key={j.id} className="border-t border-cx-line align-top">
                      <td className="px-5 py-3"><Link href={`/demo/employer/jobs/${j.id}`} className="font-medium text-cx-ink">{j.title}</Link><div className="text-[12px] text-cx-dim">{j.arrangement} · {j.location}</div></td>
                      <td className="py-3">
                        <div className="flex flex-wrap gap-4">
                          {top.map(({ c, m }) => (
                            <Link key={c.id} href={`/demo/employer/candidates/${c.id}?job=${j.id}`} className="flex items-center gap-2 no-underline">
                              <ScoreBadge score={m.score} size="sm" />
                              <span><span className="block font-medium text-cx-ink">{c.name}</span><span className="text-[12px] text-cx-dim">{m.summary.requiredMet}/{m.summary.requiredTotal} required{shortlisted.has(`${j.id}:${c.id}`) ? ' · shortlisted' : ''}</span></span>
                            </Link>
                          ))}
                        </div>
                      </td>
                      <td className="cx-num px-5 py-3 text-right">{stats.shortlistsByJob.find(s => s.job.id === j.id)?.count ?? 0}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card title="Candidate distribution by skill" description="Discoverable candidates with proficiency of 70 or more." action={<Tag tone="warn">Demo analytics</Tag>}>
          <BarList caption="Candidates per skill" data={distribution.map(d => ({ key: d.skillId, label: d.name, value: d.total, secondary: d.verified }))} secondaryLabel="verified" />
        </Card>
        <Card title="Recent recruitment activity" padded={false}>
          <ul>
            {activity.map(a => (
              <li key={a.id} className="flex items-center gap-3 border-t border-cx-line px-5 py-2.5 text-[13px] first:border-0">
                {a.studentId && <Avatar name={state.students.find(s => s.id === a.studentId)?.name ?? '?'} size={24} />}
                <span className="min-w-0 flex-1 text-cx-ink2">{a.message}</span>
                <Time iso={a.createdAt} relative className="shrink-0 text-[12px] text-cx-dim" />
              </li>
            ))}
            {!activity.length && <li className="px-5 py-6 text-[13px] text-cx-dim">No activity yet.</li>}
          </ul>
        </Card>
      </div>
    </>
  )
}
