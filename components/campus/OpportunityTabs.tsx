'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Radio } from 'lucide-react'
import { cn } from './ui'

/** Switches the student's opportunities between the fictional demo roles and real live openings. */
export default function OpportunityTabs() {
  const pathname = usePathname()
  const live = pathname.startsWith('/demo/student/opportunities/live')
  const tab = 'flex items-center gap-1.5 rounded-[7px] px-3 py-1.5 text-[13px] font-medium no-underline transition-colors'
  return (
    <div className="mb-5 inline-flex gap-0.5 rounded-[9px] bg-cx-sunken p-0.5" role="tablist" aria-label="Opportunity source">
      <Link href="/demo/student/opportunities" role="tab" aria-selected={!live} className={cn(tab, !live ? 'bg-cx-surface text-cx-ink shadow-sm' : 'text-cx-dim hover:text-cx-ink')}>
        Illustrative demo roles
      </Link>
      <Link href="/demo/student/opportunities/live" role="tab" aria-selected={live} className={cn(tab, live ? 'bg-cx-surface text-cx-ink shadow-sm' : 'text-cx-dim hover:text-cx-ink')}>
        <Radio size={13} className="text-cx-ok" aria-hidden />Real job openings
      </Link>
    </div>
  )
}
