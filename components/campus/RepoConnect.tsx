'use client'

import { useState } from 'react'
import { ExternalLink, GitBranch, RefreshCw, Star, X } from 'lucide-react'
import type { RepoMetadata } from '@/lib/campus/github'
import { PRIMARY_STUDENT_ID } from '@/lib/campus/seed'
import { disconnectRepo, saveConnectedRepo, useDemoState } from '@/lib/campus/store'
import { Time } from './ui'

/**
 * Links a public GitHub repository to a project and shows its public metadata (languages, last push, stars).
 * Read-only: only the repository name is sent to GitHub. The metadata is context, not a verification of skills.
 */
export default function RepoConnect({ projectId }: { projectId: string }) {
  const state = useDemoState()
  const repos = state.connectedRepos.filter(r => r.projectId === projectId)
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const connect = async (ref: string) => {
    setBusy(ref)
    setError(null)
    try {
      const res = await fetch(`/api/campus/github-repo?repo=${encodeURIComponent(ref)}`)
      const body = await res.json() as RepoMetadata & { error?: string }
      if (!res.ok) throw new Error(body.error ?? 'Could not read that repository.')
      saveConnectedRepo(PRIMARY_STUDENT_ID, projectId, body)
      setInput('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not read that repository.')
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="mt-4 rounded-[10px] border border-cx-line p-3">
      <div className="flex items-center gap-1.5 text-[12.5px] font-medium text-cx-ink2"><GitBranch size={13} aria-hidden />Public repository</div>
      {repos.map(r => {
        const total = Object.values(r.languages).reduce((a, b) => a + b, 0)
        const top = Object.entries(r.languages).sort((a, b) => b[1] - a[1]).slice(0, 3)
        return (
          <div key={r.fullName} className="mt-2 text-[12.5px]">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <a href={r.url} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-1 font-medium text-cx-accent-ink">{r.fullName}<ExternalLink size={11} aria-hidden /></a>
              <span className="inline-flex items-center gap-1 text-cx-dim"><Star size={11} aria-hidden />{r.stars}</span>
              {r.pushedAt && <span className="text-cx-dim">Last push <Time iso={r.pushedAt} /></span>}
              <span className="ml-auto flex gap-1">
                <button className="cx-btn cx-btn-ghost cx-btn-sm" disabled={busy !== null} onClick={() => connect(r.fullName)} aria-label={`Refresh ${r.fullName}`}><RefreshCw size={12} className={busy === r.fullName ? 'animate-spin' : ''} aria-hidden />Refresh</button>
                <button className="cx-btn cx-btn-ghost cx-btn-sm" onClick={() => disconnectRepo(projectId, r.fullName)} aria-label={`Disconnect ${r.fullName}`}><X size={12} aria-hidden /></button>
              </span>
            </div>
            {r.description && <p className="mt-0.5 text-cx-ink2">{r.description}</p>}
            {total > 0 && <p className="mt-0.5 text-cx-dim">Languages: {top.map(([l, n]) => `${l} ${Math.round((n / total) * 100)}%`).join(', ')}</p>}
            <p className="mt-0.5 text-[11.5px] text-cx-faint">Source: GitHub · fetched <Time iso={r.fetchedAt} relative />. Public metadata only — not a verification of your skills.</p>
          </div>
        )
      })}
      <form className="mt-2 flex flex-wrap gap-2" onSubmit={e => { e.preventDefault(); if (input.trim()) connect(input.trim()) }}>
        <input className="cx-input min-w-[200px] flex-1" placeholder="owner/repository or github.com link" value={input} onChange={e => setInput(e.target.value)} aria-label="Public GitHub repository" />
        <button type="submit" className="cx-btn cx-btn-sm" disabled={!input.trim() || busy !== null}>{busy !== null && !repos.some(r => r.fullName === busy) ? 'Connecting…' : 'Connect'}</button>
      </form>
      {error && <p className="mt-1.5 text-[12px] text-cx-bad" role="alert">{error}</p>}
    </div>
  )
}
