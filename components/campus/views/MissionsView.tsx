'use client'

import { useState } from 'react'
import { Bookmark, BookmarkCheck, ExternalLink, GitBranch, Info, MessageSquare } from 'lucide-react'
import { Card, EmptyState, PageHeader, Tag, Time } from '@/components/campus/ui'
import type { MissionsState } from '@/lib/campus/external.server'
import type { Mission } from '@/lib/campus/github'
import { PRIMARY_STUDENT_ID } from '@/lib/campus/seed'
import { toggleSavedMission, useDemoState } from '@/lib/campus/store'

function SaveButton({ mission }: { mission: Pick<Mission, 'id' | 'repo' | 'title' | 'url'> }) {
  const state = useDemoState()
  const saved = state.savedMissions.some(m => m.id === mission.id)
  return (
    <button className={`cx-btn cx-btn-sm ${saved ? 'cx-btn-accent' : ''}`} aria-pressed={saved} onClick={() => toggleSavedMission(PRIMARY_STUDENT_ID, mission)}>
      {saved ? <BookmarkCheck size={13} aria-hidden /> : <Bookmark size={13} aria-hidden />}{saved ? 'Saved' : 'Save'}
    </button>
  )
}

export default function MissionsView({ state: missions }: { state: MissionsState }) {
  const state = useDemoState()
  const [language, setLanguage] = useState('all')
  const list = missions.status === 'live' ? missions.data.missions : []
  const languages = [...new Set(list.map(m => m.language).filter((l): l is string => !!l))].sort()
  const shown = list.filter(m => language === 'all' || m.language === language)

  return (
    <>
      <PageHeader
        eyebrow="Open-source missions"
        title="Open-source missions"
        description="Open issues in well-known public projects that welcome new contributors. These are volunteer contributions to open source — not jobs, internships, verified projects or employer opportunities."
      />

      <div className="cx-card mb-4 flex gap-3 p-4 text-[12.5px] text-cx-ink2">
        <Info size={16} className="mt-0.5 shrink-0 text-cx-info" aria-hidden />
        <p>
          Source: <a href="https://github.com" target="_blank" rel="noreferrer noopener" className="underline underline-offset-2">GitHub</a>. SYRKA reads open issues, read-only, from a fixed list of repositories; it never posts, comments or stars on your behalf, and sends nothing about you to GitHub.
          {missions.status === 'live' && <> Last refreshed <Time iso={missions.data.fetchedAt} relative />.</>}
          {' '}Contributing is between you and each project; saving a mission here does not add it to your profile as evidence.
        </p>
      </div>

      {state.savedMissions.length > 0 && (
        <Card title={`Saved missions (${state.savedMissions.length})`} className="mb-4" padded={false}>
          <ul>
            {state.savedMissions.map(m => (
              <li key={m.id} className="flex flex-wrap items-center justify-between gap-2 border-t border-cx-line px-5 py-2.5 text-[13px] first:border-0">
                <a href={m.url} target="_blank" rel="noreferrer noopener" className="min-w-0 text-cx-ink underline-offset-2 hover:underline">{m.title} <span className="text-cx-dim">· {m.repo}</span></a>
                <SaveButton mission={m} />
              </li>
            ))}
          </ul>
        </Card>
      )}

      {missions.status !== 'live' ? (
        <div className="cx-card">
          <EmptyState icon={<GitBranch size={22} />} title="Missions are unavailable right now">
            {missions.rateLimitedUntil ? <>GitHub’s rate limit has been reached. Missions return after <Time iso={missions.rateLimitedUntil} relative />.</> : 'GitHub could not be reached. Try again later.'}
          </EmptyState>
        </div>
      ) : (
        <>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-[12.5px] text-cx-dim">{shown.length} open issues from {missions.data.repos.filter(r => r.ok).length} repositories</p>
            <select className="cx-select !w-auto" value={language} onChange={e => setLanguage(e.target.value)} aria-label="Primary language">
              <option value="all">Any language</option>
              {languages.map(l => <option key={l}>{l}</option>)}
            </select>
          </div>
          {shown.length ? (
            <ul className="grid gap-3 md:grid-cols-2">
              {shown.map(m => (
                <li key={m.id} className="cx-card flex flex-col p-5">
                  <div className="flex items-center gap-1.5 text-[12.5px] text-cx-dim"><GitBranch size={13} aria-hidden />{m.repo}{m.language && <> · {m.language}</>}</div>
                  <a href={m.url} target="_blank" rel="noreferrer noopener" className="mt-1 text-[14.5px] font-semibold text-cx-ink underline-offset-2 hover:underline">{m.title}</a>
                  <div className="mt-2 flex flex-wrap gap-1">{m.labels.slice(0, 5).map(l => <Tag key={l}>{l}</Tag>)}</div>
                  <div className="mt-auto flex flex-wrap items-center gap-2 pt-4 text-[12px] text-cx-dim">
                    <SaveButton mission={m} />
                    <a href={m.url} target="_blank" rel="noreferrer noopener" className="cx-btn cx-btn-sm">Open on GitHub <ExternalLink size={12} aria-hidden /></a>
                    <span className="ml-auto inline-flex items-center gap-2">
                      <span className="inline-flex items-center gap-1"><MessageSquare size={12} aria-hidden />{m.comments}</span>
                      <span>Updated <Time iso={m.updatedAt} relative /></span>
                      <span>· Source: GitHub</span>
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          ) : <div className="cx-card"><EmptyState icon={<GitBranch size={22} />} title="No open missions match">The configured repositories have no open, unassigned beginner issues right now.</EmptyState></div>}
        </>
      )}
    </>
  )
}
