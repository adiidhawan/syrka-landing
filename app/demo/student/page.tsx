'use client'

import Link from 'next/link'
import { ArrowRight, CircleCheck, Circle, Eye, Lock, MapPin } from 'lucide-react'
import { LineChart } from '@/components/campus/charts'
import { Card, EvidenceBadge, Meter, PageHeader, ScoreBadge, Stat, Switch, Tag, Time } from '@/components/campus/ui'
import { PRIMARY_STUDENT_ID } from '@/lib/campus/seed'
import { setEmployerVisibility, useDemoState, useHydrated } from '@/lib/campus/store'
import { profileCompleteness, skillName, skillsFor, studentJobMatches } from '@/lib/campus/queries'

function greeting(hydrated: boolean) {
  if (!hydrated) return 'Welcome back'
  const h = new Date().getHours()
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
}

export default function StudentDashboard() {
  const state = useDemoState()
  const hydrated = useHydrated()
  const student = state.students.find(s => s.id === PRIMARY_STUDENT_ID)!
  const skills = skillsFor(state, student.id)
  const completeness = profileCompleteness(state, student.id)
  const matches = studentJobMatches(state, student.id)
  const verifiedCount = skills.filter(s => s.verificationStatus === 'verified').length
  const activity = state.activity.filter(a => a.studentId === student.id && a.actor === 'student').slice(0, 6)

  const historySkills = [...new Set(state.skillHistory.filter(h => h.studentId === student.id).map(h => h.skillId))].slice(0, 3)
  const history = state.skillHistory.filter(h => h.studentId === student.id && historySkills.includes(h.skillId))
  const xLabels = [...new Set(history.map(h => h.date))].sort()
  const hasReal = history.some(h => !h.illustrative)

  return (
    <>
      <PageHeader
        eyebrow="Student dashboard"
        title={<span suppressHydrationWarning>{greeting(hydrated)}, {student.name.split(' ')[0]}.</span>}
        description="Here’s where your capabilities stand and where they can take you."
        actions={<Link href="/demo/student/opportunities" className="cx-btn cx-btn-primary">View opportunities <ArrowRight size={14} aria-hidden /></Link>}
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Profile completeness" value={`${completeness.percent}%`} hint={`${completeness.items.filter(i => !i.done).length} items left`} href="#completeness" />
        <Stat label="Skills on profile" value={skills.length} hint={`${verifiedCount} verified`} href="/demo/student/skills" />
        <Stat label="Projects" value={state.projects.filter(p => p.studentId === student.id).length} hint={`${state.projects.filter(p => p.studentId === student.id && p.verificationStatus === 'verified').length} faculty-reviewed`} href="/demo/student/projects" />
        <Stat label="Best requirement alignment" value={matches[0] ? `${matches[0].match.score}%` : '—'} hint={matches[0]?.job.title} href={matches[0] ? `/demo/student/opportunities/${matches[0].job.id}` : undefined} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.55fr_1fr]">
        <Card
          title="Opportunity matches"
          description="Scored by the same engine employers use, against each job’s stated requirements."
          action={<Link href="/demo/student/opportunities" className="text-[12.5px] font-medium text-cx-accent-ink">All {matches.length} →</Link>}
          padded={false}
        >
          <ul>
            {matches.slice(0, 4).map(({ job, company, match }) => (
              <li key={job.id} className="border-t border-cx-line first:border-0">
                <Link href={`/demo/student/opportunities/${job.id}`} className="flex items-center gap-4 px-5 py-3.5 no-underline transition-colors hover:bg-cx-sunken">
                  <ScoreBadge score={match.score} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-x-2">
                      <span className="text-[14px] font-medium text-cx-ink">{job.title}</span>
                      <span className="text-[12.5px] text-cx-dim">{company.name}</span>
                    </div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[12px] text-cx-dim">
                      <span className="inline-flex items-center gap-1"><MapPin size={11} aria-hidden />{job.location} · {job.arrangement}</span>
                      <span>· {match.summary.requiredMet}/{match.summary.requiredTotal} required met</span>
                    </div>
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {match.required.map(r => <Tag key={r.skillId} tone={r.status === 'met' ? 'ok' : r.status === 'partial' ? 'warn' : 'neutral'}>{r.name}</Tag>)}
                    </div>
                  </div>
                  <span className="max-sm:hidden"><span className="cx-btn cx-btn-sm">View</span></span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>

        <Card id="completeness" title="Profile completeness" description="Calculated from the fields on your profile.">
          <div className="flex items-center gap-3">
            <div className="cx-num text-[30px] font-semibold leading-none">{completeness.percent}%</div>
            <div className="flex-1"><Meter value={completeness.percent} label="Profile completeness" /></div>
          </div>
          <ul className="mt-4 space-y-1.5">
            {[...completeness.items].sort((a, b) => Number(a.done) - Number(b.done)).map(i => (
              <li key={i.key} className="flex items-center gap-2 text-[13px]">
                {i.done ? <CircleCheck size={15} className="text-cx-ok" aria-label="Done" /> : <Circle size={15} className="text-cx-faint" aria-label="To do" />}
                {i.done ? <span className="text-cx-dim">{i.label}</span> : <Link href={i.href} className="font-medium text-cx-ink underline-offset-2 hover:underline">{i.label}</Link>}
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_1.2fr]">
        <Card title="Skill overview" description="Top skills by proficiency, with where each claim comes from." action={<Link href="/demo/student/skills" className="text-[12.5px] font-medium text-cx-accent-ink">All skills →</Link>}>
          <ul className="space-y-3">
            {skills.slice(0, 8).map(s => (
              <li key={s.id}>
                <div className="mb-1 flex items-center justify-between gap-2 text-[13px]">
                  <span className="truncate font-medium">{s.skill.name}</span>
                  <span className="flex items-center gap-2">
                    <EvidenceBadge type={s.evidenceType} compact />
                    <span className="cx-num w-6 text-right font-medium">{s.proficiency}</span>
                  </span>
                </div>
                <Meter value={s.proficiency} tone={s.evidenceType === 'self_reported' ? 'muted' : 'accent'} label={`${s.skill.name} proficiency`} />
              </li>
            ))}
          </ul>
          <p className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-[11.5px] text-cx-dim">
            <span className="flex items-center gap-1.5"><span className="h-1.5 w-4 rounded-full bg-cx-accent" />Assessed, verified or project-backed</span>
            <span className="flex items-center gap-1.5"><span className="h-1.5 w-4 rounded-full bg-cx-faint" />Self-reported</span>
          </p>
        </Card>

        <Card title="Capability development" description={hasReal ? 'Monthly points are illustrative demo history; points dated after an assessment you take are real results.' : 'Illustrative demo history — these points are not real measurements.'}>
          <div className="mb-2"><Tag tone="warn">Illustrative demo history</Tag></div>
          <LineChart
            caption="Proficiency over time for selected skills"
            xLabels={xLabels}
            formatX={d => new Date(`${d}T00:00:00`).toLocaleDateString('en-GB', { month: 'short', ...(d.endsWith('-01') ? {} : { day: 'numeric' }) })}
            yMin={40}
            series={historySkills.map(id => ({ key: id, name: skillName(state, id), points: history.filter(h => h.skillId === id).map(h => ({ x: h.date, y: h.proficiency })) }))}
          />
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <Card title="Recent activity" padded={false}>
          {activity.length ? (
            <ul>
              {activity.map(a => (
                <li key={a.id} className="flex items-baseline justify-between gap-4 border-t border-cx-line px-5 py-2.5 text-[13px] first:border-0">
                  <span className="text-cx-ink2">{a.message}</span>
                  <Time iso={a.createdAt} relative className="shrink-0 text-[12px] text-cx-dim" />
                </li>
              ))}
            </ul>
          ) : <p className="px-5 py-6 text-[13px] text-cx-dim">No activity yet.</p>}
        </Card>

        <Card title="Profile visibility">
          <div className="mb-4 flex items-center gap-2.5">
            {student.visibility.employerVisible
              ? <><span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-cx-ok-soft text-cx-ok"><Eye size={16} aria-hidden /></span><div><div className="text-[13.5px] font-medium">Shared with employers</div><div className="text-[12px] text-cx-dim">Employers on SYRKA Campus can discover the sections you share.</div></div></>
              : <><span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-cx-sunken text-cx-dim"><Lock size={16} aria-hidden /></span><div><div className="text-[13.5px] font-medium">Private</div><div className="text-[12px] text-cx-dim">No employer can find or open your profile.</div></div></>}
          </div>
          <Switch label="Visible to employers" checked={student.visibility.employerVisible} onChange={v => setEmployerVisibility(student.id, v)} />
          <Link href="/demo/student/settings" className="mt-4 inline-block text-[12.5px] font-medium text-cx-accent-ink">Choose which sections are shared →</Link>
        </Card>
      </div>
    </>
  )
}
