'use client'

import Link from 'next/link'
import { ArrowDownRight, ArrowUpRight, Info, Landmark, Minus, Plus, Radio } from 'lucide-react'
import { BarList } from './charts'
import { Card, EmptyState, Tag, Time } from './ui'
import { FAMILY_LABEL, roleFamily } from '@/lib/campus/live-jobs'
import type { LandscapeState, MarketDemandState } from '@/lib/campus/external.server'
import { ONET_ROLE_SKILLS } from '@/lib/campus/onet-role-skills'
import { liveSkillName, skillsFor } from '@/lib/campus/queries'
import { PRIMARY_STUDENT_ID } from '@/lib/campus/seed'
import { useDemoState } from '@/lib/campus/store'
import type { ActivityEvent } from '@/lib/campus/types'

/** "Based on N real openings · Last refreshed … · Source: …" — shown on every demand module. */
export function DemandSourceLine({ market }: { market: Extract<MarketDemandState, { status: 'live' }> }) {
  return (
    <p className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[12px] text-cx-dim">
      <Radio size={12} className="text-cx-ok" aria-hidden />
      <span>Based on {market.demand.totalJobs} real job openings</span>
      <span>· Last refreshed <Time iso={market.demand.fetchedAt} relative /></span>
      <span>· Source: {market.sourceSummary}</span>
    </p>
  )
}

const UNAVAILABLE_COPY = {
  disabled: 'Live openings are switched off in this environment, so there is no market demand to show.',
  stale: 'The last refresh of live openings is too old to use, so market demand is hidden until the next refresh.',
  unavailable: 'Live openings could not be reached, so market demand cannot be calculated right now.',
}

function WeeklyChange({ value }: { value: number | undefined }) {
  if (value === undefined) return <span className="text-cx-faint">—</span>
  if (value === 0) return <span className="inline-flex items-center gap-0.5 text-cx-dim"><Minus size={12} aria-hidden />0</span>
  return value > 0
    ? <span className="inline-flex items-center gap-0.5 text-cx-ok"><ArrowUpRight size={12} aria-hidden />+{value}</span>
    : <span className="inline-flex items-center gap-0.5 text-cx-bad"><ArrowDownRight size={12} aria-hidden />{value}</span>
}

/** Live market demand for the skills on the student's profile. Measures job postings, never the student. */
export function MarketDemandCard({ market }: { market: MarketDemandState }) {
  const state = useDemoState()
  if (market.status !== 'live') {
    return (
      <Card title="Live market demand">
        <EmptyState icon={<Radio size={22} />} title="No live market data right now">{UNAVAILABLE_COPY[market.reason]}</EmptyState>
      </Card>
    )
  }
  const profile = skillsFor(state, PRIMARY_STUDENT_ID)
  const rows = profile
    .map(s => ({ s, d: market.demand.skills[s.skillId] }))
    .sort((a, b) => (b.d?.total ?? 0) - (a.d?.total ?? 0))
  const shown = rows.filter(r => r.d).slice(0, 8)
  const hasHistory = market.priorDate !== null

  return (
    <Card
      title="Live market demand"
      description="How many current openings at real companies mention each skill on your profile."
      action={<Tag tone="accent">Job-posting demand</Tag>}
    >
      <DemandSourceLine market={market} />
      {shown.length ? (
        <>
          <div className="mt-4">
            <BarList
              caption="Live roles mentioning each profile skill"
              secondaryLabel="stated in requirements"
              totalLabel="stated + extracted"
              max={Math.max(...shown.map(r => r.d!.total))}
              data={shown.map(({ s, d }) => ({ key: s.skillId, label: s.skill.name, value: d!.total, secondary: d!.stated }))}
            />
          </div>
          <div className="cx-scroll-x mt-5">
            <table className="w-full min-w-[560px] text-[12.5px]">
              <caption className="sr-only">Demand details per skill</caption>
              <thead>
                <tr className="text-left text-[11.5px] text-cx-dim">
                  <th className="pb-2 font-medium">Skill</th>
                  <th className="pb-2 text-right font-medium">Stated</th>
                  <th className="pb-2 text-right font-medium">Extracted</th>
                  <th className="pb-2 text-right font-medium">India-only</th>
                  <th className="pb-2 text-right font-medium">Internship / full-time</th>
                  <th className="pb-2 text-right font-medium">{hasHistory ? <>vs <Time iso={market.priorDate!} /></> : '7-day change'}</th>
                  <th className="pb-2 pl-4 font-medium">Top role categories</th>
                </tr>
              </thead>
              <tbody>
                {shown.map(({ s, d }) => (
                  <tr key={s.skillId} className="border-t border-cx-line">
                    <td className="py-2 font-medium">{s.skill.name}</td>
                    <td className="cx-num py-2 text-right">{d!.stated}</td>
                    <td className="cx-num py-2 text-right text-cx-dim">{d!.extracted}</td>
                    <td className="cx-num py-2 text-right">{d!.indiaOnly}</td>
                    <td className="cx-num py-2 text-right">{d!.internship} / {d!.fullTime}</td>
                    <td className="cx-num py-2 text-right">{hasHistory ? <WeeklyChange value={market.weekly[s.skillId]} /> : <span className="text-cx-faint">—</span>}</td>
                    <td className="py-2 pl-4 text-cx-ink2">{d!.families.map(f => FAMILY_LABEL[f.family]).join(', ')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {rows.length > shown.length && <p className="mt-2 text-[12px] text-cx-dim">{rows.length - shown.length} of your skills {rows.length - shown.length === 1 ? 'does' : 'do'} not appear in any current opening.</p>}
        </>
      ) : <EmptyState title="None of your skills appear in current openings">Add skills to your profile to see how often live roles mention them.</EmptyState>}
      <div className="mt-4 flex gap-2 rounded-[8px] bg-cx-sunken px-3 py-2.5 text-[12px] text-cx-ink2">
        <Info size={14} className="mt-0.5 shrink-0 text-cx-info" aria-hidden />
        <span>
          This measures job-posting demand, not your proficiency. “Stated” means the posting lists the skill under its requirements; “extracted” means it is only mentioned elsewhere in the description.
          {' '}{hasHistory ? 'The change column compares with the daily snapshot taken a week earlier.' : 'No snapshot from 7 days ago exists yet, so only current demand is shown — no trend is estimated.'}
        </span>
      </div>
    </Card>
  )
}

/** Profile skills in current demand, example roles, and frequent target-role skills missing from the profile. */
export function SkillsInDemand({ market }: { market: MarketDemandState }) {
  const state = useDemoState()
  if (market.status !== 'live') {
    return <Card title="Skills in demand now"><EmptyState icon={<Radio size={22} />} title="No live market data right now">{UNAVAILABLE_COPY[market.reason]}</EmptyState></Card>
  }
  const student = state.students.find(s => s.id === PRIMARY_STUDENT_ID)!
  const profile = skillsFor(state, PRIMARY_STUDENT_ID)
  const have = new Set(profile.map(s => s.skillId))
  const inDemand = profile.map(s => ({ s, d: market.demand.skills[s.skillId] })).filter(r => r.d).sort((a, b) => b.d!.total - a.d!.total).slice(0, 6)

  const family = roleFamily(student.preferredRole)
  const fam = family ? market.demand.families[family] : undefined
  // O*NET decides which skills are relevant to the target role; live roles decide how often they come up.
  const relevant = new Set(family ? ONET_ROLE_SKILLS[family].skills.map(k => k.skillId) : [])
  const missing = fam && fam.roles >= 5
    ? Object.entries(fam.skills)
        .filter(([id, n]) => !have.has(id) && relevant.has(id) && n >= Math.max(2, Math.ceil(fam.roles * 0.2)))
        .sort((a, b) => b[1] - a[1]).slice(0, 5)
    : []

  return (
    <Card title="Skills in demand now" description="Current openings that mention the skills on your profile. Your own skill records are unchanged by this.">
      <DemandSourceLine market={market} />
      {inDemand.length ? (
        <ul className="mt-4 space-y-4">
          {inDemand.map(({ s, d }) => (
            <li key={s.skillId} className="border-t border-cx-line pt-3 first:border-0 first:pt-0">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="text-[13.5px] font-medium">{s.skill.name}</span>
                <span className="text-[12.5px] text-cx-ink2"><span className="cx-num font-medium">{d!.total}</span> current roles <span className="text-cx-dim">({d!.stated} stated, {d!.extracted} extracted)</span></span>
              </div>
              <div className="mt-1 text-[12px] text-cx-dim">Mostly {d!.families.map(f => FAMILY_LABEL[f.family]).join(', ')}</div>
              <ul className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-[12.5px]">
                {d!.examples.map(e => (
                  <li key={e.id}><Link href={`/demo/student/opportunities/live/${e.id}`} className="text-cx-accent-ink underline-offset-2 hover:underline">{e.title}</Link> <span className="text-cx-dim">· {e.company}{e.stated ? '' : ' · extracted'}</span></li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      ) : <EmptyState title="None of your skills appear in current openings" />}

      <div className="mt-5 border-t border-cx-line pt-4">
        <h3 className="text-[13.5px] font-semibold">Missing from your profile</h3>
        <p className="mt-0.5 text-[12px] text-cx-dim">
          {family ? <>Skills that come up often in live {FAMILY_LABEL[family]} roles, matching your target role “{student.preferredRole}”.</> : <>Set a preferred role on your profile to see skills that often come up for it.</>}
        </p>
        {family && (!fam || fam.roles < 5) && <p className="mt-3 text-[13px] text-cx-dim">Not enough live {FAMILY_LABEL[family]} roles right now ({fam?.roles ?? 0}) to say what is commonly asked.</p>}
        {missing.length > 0 && (
          <ul className="mt-3 space-y-2">
            {missing.map(([id, n]) => (
              <li key={id} className="flex flex-wrap items-center justify-between gap-2 text-[13px]">
                <span><span className="font-medium">{liveSkillName(state, id)}</span> <span className="text-cx-dim">— in {n} of {fam!.roles} live {FAMILY_LABEL[family!]} roles</span></span>
                <Link href={`/demo/student/skills?add=${encodeURIComponent(liveSkillName(state, id))}`} className="cx-btn cx-btn-sm"><Plus size={12} aria-hidden />I have this skill</Link>
              </li>
            ))}
          </ul>
        )}
        {family && fam && fam.roles >= 5 && !missing.length && <p className="mt-3 text-[13px] text-cx-dim">Your profile already covers the skills that come up most for this role.</p>}
        <p className="mt-3 text-[11.5px] text-cx-faint">Relevance to the role uses an internal mapping built from O*NET 31.0 (see Data sources). Adding a skill records your own self-reported claim; nothing here verifies a skill.</p>
      </div>
    </Card>
  )
}

/** Aggregate India context. Separate from everything personal; never used for scoring. */
export function IndiaLandscape({ landscape }: { landscape: LandscapeState }) {
  return (
    <section aria-labelledby="landscape-title" className="mt-8">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <div>
          <div className="cx-eyebrow">Aggregate context</div>
          <h2 id="landscape-title" className="mt-1 text-[18px] font-semibold">India career landscape</h2>
        </div>
        <Tag>Not used for scoring</Tag>
      </div>
      {landscape.status === 'live' ? (
        <div className="cx-card p-5">
          <ul className="grid gap-5 sm:grid-cols-3">
            {landscape.indicators.map(i => (
              <li key={i.id}>
                <div className="text-[12.5px] text-cx-dim">{i.label}</div>
                <div className="cx-num mt-1 text-[26px] font-semibold leading-none">{i.value}<span className="ml-0.5 text-[14px] font-medium text-cx-dim">%</span></div>
                <div className="mt-1.5 text-[11.5px] text-cx-dim">{i.unit} · {i.year} · {i.note}</div>
                {i.datasetUpdated && <div className="text-[11.5px] text-cx-faint">Dataset updated <Time iso={i.datasetUpdated} /></div>}
              </li>
            ))}
          </ul>
          <p className="mt-5 flex gap-2 border-t border-cx-line pt-3 text-[12px] text-cx-dim">
            <Landmark size={14} className="mt-0.5 shrink-0" aria-hidden />
            <span>National aggregates for context only — never used to rank students, calculate alignment or judge anyone’s employability. Source: <a href="https://data.worldbank.org/country/india" target="_blank" rel="noreferrer noopener" className="underline underline-offset-2">World Bank, World Development Indicators</a> (CC BY 4.0); unemployment series are ILO modelled estimates. Last refreshed <Time iso={landscape.fetchedAt} relative />. Series older than 4 years are hidden.</span>
          </p>
        </div>
      ) : (
        <div className="cx-card"><EmptyState icon={<Landmark size={22} />} title="No current aggregate data">The World Bank indicators could not be loaded, or are too old to show.</EmptyState></div>
      )}
    </section>
  )
}

const ACTIVITY_LINK: Partial<Record<ActivityEvent['kind'], (a: ActivityEvent) => string | undefined>> = {
  live_job_viewed: a => a.ref && `/demo/student/opportunities/live/${a.ref.id}`,
  opportunity_saved: a => a.ref && `/demo/student/opportunities/live/${a.ref.id}`,
  application_opened: a => a.ref && `/demo/student/opportunities/live/${a.ref.id}`,
  mission_saved: () => '/demo/student/missions',
  repo_connected: () => '/demo/student/projects',
  repo_refreshed: () => '/demo/student/projects',
  skill_added: () => '/demo/student/skills',
  assessment_completed: () => '/demo/student/skills',
}

/** The student's real activity: only events this visitor caused, newest first. */
export function StudentActivity({ limit = 8 }: { limit?: number }) {
  const state = useDemoState()
  const events = state.activity.filter(a => a.studentId === PRIMARY_STUDENT_ID && a.actor === 'student').slice(0, limit)
  if (!events.length) {
    return <p className="px-5 py-6 text-[13px] text-cx-dim">No activity yet. Explore live opportunities or add a skill to begin building your career record.</p>
  }
  return (
    <ul>
      {events.map(a => {
        const href = ACTIVITY_LINK[a.kind]?.(a)
        return (
          <li key={a.id} className="flex items-baseline justify-between gap-4 border-t border-cx-line px-5 py-2.5 text-[13px] first:border-0">
            {href ? <Link href={href} className="text-cx-ink2 underline-offset-2 hover:underline">{a.message}</Link> : <span className="text-cx-ink2">{a.message}</span>}
            <Time iso={a.createdAt} relative className="shrink-0 text-[12px] text-cx-dim" />
          </li>
        )
      })}
    </ul>
  )
}
