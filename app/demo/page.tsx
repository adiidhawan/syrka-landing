import Link from 'next/link'
import { ArrowRight, Building2, GraduationCap, Shield } from 'lucide-react'
import { SyrkaSymbol } from '@/components/landing/brand'
import ResetDemoButton from '@/components/campus/ResetDemoButton'
import { DemoBadge } from '@/components/campus/ui'

const OPTIONS = [
  {
    href: '/demo/student', Icon: GraduationCap, eyebrow: 'Option A', title: 'Explore as a student',
    body: 'Build your capability profile, explore your skills, and discover opportunities that match your abilities.',
    cta: 'Enter Student Portal', persona: 'Aarav Mehta · B.Tech CSE, Demo Institute of Technology',
  },
  {
    href: '/demo/employer', Icon: Building2, eyebrow: 'Option B', title: 'Explore as an employer',
    body: 'Discover emerging talent, evaluate demonstrated capabilities, and find candidates who fit your roles.',
    cta: 'Enter Employer Portal', persona: 'Recruiter · Northstar Technologies',
  },
]

export default function DemoEntryPage() {
  return (
    <div className="relative min-h-[100dvh] overflow-hidden">
      {/* Dot grid from the landing page's paper sections. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 opacity-70" style={{ backgroundImage: 'radial-gradient(rgba(18,18,20,0.07) 1px, transparent 1.2px)', backgroundSize: '22px 22px' }} />
      <div className="relative mx-auto flex min-h-[100dvh] max-w-[1040px] flex-col px-4 py-6 md:px-8">
        <header className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 text-cx-ink no-underline">
            <SyrkaSymbol className="h-[14px] w-auto text-cx-accent" strokeWidth={6} />
            <span className="text-[14px] font-semibold tracking-[0.14em]">SYRKA</span>
            <span className="text-[14px] text-cx-dim">Campus</span>
          </Link>
          <DemoBadge />
        </header>

        <main className="flex flex-1 flex-col justify-center py-12">
          <div className="cx-eyebrow">Interactive demonstration</div>
          <h1 className="mt-3 max-w-3xl text-[clamp(32px,5vw,54px)] font-semibold leading-[1.02] tracking-[-0.03em] text-cx-ink">
            See how demonstrated capability connects students and employers.
          </h1>
          <p className="mt-4 max-w-2xl text-[16px] leading-relaxed text-cx-dim">
            One shared record of skills and evidence. Students see why a role fits them; employers see the evidence behind every match.
          </p>

          <div className="mt-10 grid gap-4 md:grid-cols-2">
            {OPTIONS.map(({ href, Icon, eyebrow, title, body, cta, persona }) => (
              <Link key={href} href={href} className="cx-card group flex flex-col p-6 no-underline transition-[border-color,box-shadow] hover:border-cx-strong hover:shadow-[0_12px_32px_-18px_rgba(18,18,20,0.35)]">
                <div className="flex items-center justify-between">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-[10px] bg-cx-accent-soft text-cx-accent"><Icon size={20} aria-hidden /></span>
                  <span className="cx-eyebrow">{eyebrow}</span>
                </div>
                <h2 className="mt-5 text-[20px] font-semibold text-cx-ink">{title}</h2>
                <p className="mt-2 text-[14px] leading-relaxed text-cx-dim">{body}</p>
                <p className="mt-4 text-[12.5px] text-cx-faint">Demo persona: {persona}</p>
                <span className="cx-btn cx-btn-primary mt-6 self-start">
                  {cta} <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" aria-hidden />
                </span>
              </Link>
            ))}
          </div>

          <div className="mt-8 flex flex-col gap-4 border-t border-cx-line pt-6 md:flex-row md:items-center md:justify-between">
            <p className="max-w-xl text-[13px] leading-relaxed text-cx-dim">
              Explore SYRKA using fictional students, companies, assessments, and job opportunities. No real student or employer information is used in this demonstration.
            </p>
            <div className="flex flex-wrap gap-2">
              <Link href="/demo/admin" className="cx-btn"><Shield size={14} aria-hidden /> Admin overview</Link>
              <ResetDemoButton />
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
