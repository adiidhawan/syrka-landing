'use client'

import { ShieldCheck } from 'lucide-react'
import SharingPanel from '@/components/campus/SharingPanel'
import { Card, PageHeader } from '@/components/campus/ui'
import { PRIMARY_STUDENT_ID } from '@/lib/campus/seed'

export default function StudentSettingsPage() {
  return (
    <>
      <PageHeader eyebrow="Settings" title="Visibility and sharing" description="You decide whether employers can find you, and which parts of your record they see." />
      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Card title="Employer visibility"><SharingPanel studentId={PRIMARY_STUDENT_ID} /></Card>
        <Card title="How this is enforced">
          <div className="space-y-3 text-[13px] text-cx-ink2">
            <p className="flex gap-2"><ShieldCheck size={16} className="mt-0.5 shrink-0 text-cx-ok" aria-hidden />Visibility is applied in the shared data-access layer that every employer page reads through, not by hiding components. A private profile is left out of candidate search, analytics and direct links.</p>
            <p>Hidden sections are removed before the employer view is built, and matching on the employer side uses only what you share. Hiding projects, for example, also removes them as project evidence.</p>
            <p className="text-[12px] text-cx-dim">This is a demo running in your browser, with no real authentication. In production these rules run on the server.</p>
          </div>
        </Card>
      </div>
    </>
  )
}
