'use client'

import { useEffect, useState } from 'react'
import { BookOpenText, ExternalLink, Unlock } from 'lucide-react'
import { Card, EmptyState, Tag, Time } from './ui'
import type { OpenWorksState } from '@/lib/campus/external.server'
import { FAMILY_LABEL, roleFamily } from '@/lib/campus/live-jobs'
import { skillsFor } from '@/lib/campus/queries'
import { PRIMARY_STUDENT_ID } from '@/lib/campus/seed'
import { useDemoState } from '@/lib/campus/store'

type Load = { status: 'idle' | 'loading' } | { status: 'error'; message: string } | OpenWorksState

/** Optional exploration of recent open-access work for a skill or target role. Nothing here is a learning record. */
export default function ExploreOpenWork() {
  const state = useDemoState()
  const student = state.students.find(s => s.id === PRIMARY_STUDENT_ID)!
  const family = roleFamily(student.preferredRole)
  // Only catalogue skills can be explored (custom skills are not sent anywhere).
  const options = [
    ...(family ? [{ value: FAMILY_LABEL[family], label: `Target role: ${FAMILY_LABEL[family]}` }] : []),
    ...skillsFor(state, PRIMARY_STUDENT_ID).filter(s => !s.skillId.startsWith('custom-')).map(s => ({ value: s.skill.name, label: s.skill.name })),
  ]
  const [query, setQuery] = useState('')
  const [load, setLoad] = useState<Load>({ status: 'idle' })

  useEffect(() => {
    if (!query) return
    const ctrl = new AbortController()
    fetch(`/api/campus/open-work?q=${encodeURIComponent(query)}`, { signal: ctrl.signal })
      .then(async r => (r.ok ? setLoad(await r.json()) : setLoad({ status: 'error', message: ((await r.json().catch(() => ({}))) as { error?: string }).error ?? 'Could not load open work.' })))
      .catch(e => { if (e.name !== 'AbortError') setLoad({ status: 'error', message: 'Could not reach the server.' }) })
    return () => ctrl.abort()
  }, [query])

  return (
    <Card title="Explore related open work" description="Recent open-access research and project write-ups related to a skill or your target role. For exploration only — nothing here is recorded as read or completed." action={<Tag>Optional</Tag>}>
      <label className="flex flex-wrap items-center gap-2 text-[12.5px] text-cx-dim">
        <span>Explore</span>
        <select className="cx-select !w-auto min-w-[220px] text-cx-ink" value={query} onChange={e => { setQuery(e.target.value); setLoad({ status: e.target.value ? 'loading' : 'idle' }) }}>
          <option value="">Choose a skill or role…</option>
          {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </label>

      <div className="mt-4" aria-live="polite">
        {load.status === 'idle' && <p className="text-[13px] text-cx-dim">Pick a skill or role to see related open work.</p>}
        {load.status === 'loading' && <p className="text-[13px] text-cx-dim">Loading from OpenAlex…</p>}
        {load.status === 'error' && <p className="text-[13px] text-cx-bad" role="alert">{load.message}</p>}
        {load.status === 'unavailable' && <EmptyState icon={<BookOpenText size={22} />} title="OpenAlex is unavailable right now">Its free daily allowance may be used up. Try again later.</EmptyState>}
        {load.status === 'live' && (load.works.length ? (
          <>
            <ul className="space-y-3">
              {load.works.map(w => (
                <li key={w.id} className="border-t border-cx-line pt-3 first:border-0 first:pt-0">
                  <a href={w.url} target="_blank" rel="noreferrer noopener" className="inline-flex items-start gap-1 text-[13.5px] font-medium text-cx-ink underline-offset-2 hover:underline">{w.title}<ExternalLink size={12} className="mt-1 shrink-0" aria-hidden /></a>
                  <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-cx-dim">
                    {w.authors.length > 0 && <span>{w.authors.join(', ')}{w.authors.length === 3 ? ' et al.' : ''}</span>}
                    {w.institutions.length > 0 && <span>· {w.institutions.join(', ')}</span>}
                    {w.publishedOn && <span>· <Time iso={w.publishedOn} /></span>}
                    {w.venue && <span>· {w.venue}</span>}
                    {w.openAccess && <Tag tone="ok"><Unlock size={10} aria-hidden />Open access{w.oaStatus ? ` (${w.oaStatus})` : ''}</Tag>}
                  </div>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-[11.5px] text-cx-dim">Source: <a href="https://openalex.org" target="_blank" rel="noreferrer noopener" className="underline underline-offset-2">OpenAlex</a> (metadata CC0; each work keeps its own licence). Retrieved <Time iso={load.fetchedAt} relative />.</p>
          </>
        ) : <EmptyState icon={<BookOpenText size={22} />} title="No recent open-access work found">Try another skill.</EmptyState>)}
      </div>
    </Card>
  )
}
