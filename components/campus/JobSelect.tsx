'use client'

import { useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { PRIMARY_COMPANY_ID } from '@/lib/campus/seed'
import { useDemoState } from '@/lib/campus/store'
import { companyJobs } from '@/lib/campus/queries'

/** The employer's selected job, kept in the ?job= query parameter so a ranking can be linked and survives refresh. */
export function useSelectedJob(initial?: string): [string, (id: string) => void] {
  const state = useDemoState()
  const router = useRouter()
  const pathname = usePathname()
  const jobs = companyJobs(state, PRIMARY_COMPANY_ID)
  const [jobId, setJobId] = useState(() => (initial && jobs.some(j => j.id === initial) ? initial : jobs[0]?.id ?? ''))
  const select = (id: string) => {
    setJobId(id)
    const params = new URLSearchParams(window.location.search)
    params.set('job', id)
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }
  return [jobId, select]
}

export default function JobSelect({ value, onChange, label = 'Compare against' }: { value: string; onChange: (id: string) => void; label?: string }) {
  const state = useDemoState()
  const jobs = companyJobs(state, PRIMARY_COMPANY_ID)
  return (
    <label className="flex items-center gap-2 text-[12.5px] text-cx-dim">
      <span className="shrink-0">{label}</span>
      <select className="cx-select !w-auto min-w-[200px] font-medium text-cx-ink" value={value} onChange={e => onChange(e.target.value)}>
        {jobs.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
      </select>
    </label>
  )
}
