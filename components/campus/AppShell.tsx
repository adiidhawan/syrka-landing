'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  Bell, Briefcase, Building2, ChartColumn, FolderKanban, Gauge, GraduationCap, LayoutDashboard, Menu, Search,
  Settings, Shield, Sparkles, Target, UserRound, Users,
} from 'lucide-react'
import { SyrkaSymbol } from '@/components/landing/brand'
import { PRIMARY_COMPANY_ID, PRIMARY_STUDENT_ID } from '@/lib/campus/seed'
import { useDemoState, useHydrated } from '@/lib/campus/store'
import { company } from '@/lib/campus/queries'
import { Avatar, cn, DemoBadge, Dialog, Time } from './ui'

export type Persona = 'student' | 'employer' | 'admin'

const NAV: Record<Persona, { href: string; label: string; Icon: typeof Gauge }[]> = {
  student: [
    { href: '/demo/student', label: 'Dashboard', Icon: LayoutDashboard },
    { href: '/demo/student/profile', label: 'Capability profile', Icon: UserRound },
    { href: '/demo/student/skills', label: 'Skills & assessments', Icon: Sparkles },
    { href: '/demo/student/projects', label: 'Projects', Icon: FolderKanban },
    { href: '/demo/student/opportunities', label: 'Opportunities', Icon: Target },
    { href: '/demo/student/settings', label: 'Visibility & sharing', Icon: Settings },
  ],
  employer: [
    { href: '/demo/employer', label: 'Dashboard', Icon: LayoutDashboard },
    { href: '/demo/employer/candidates', label: 'Candidates', Icon: Users },
    { href: '/demo/employer/jobs', label: 'Jobs', Icon: Briefcase },
    { href: '/demo/employer/analytics', label: 'Analytics', Icon: ChartColumn },
  ],
  admin: [
    { href: '/demo/admin', label: 'Ecosystem overview', Icon: Gauge },
  ],
}

const PERSONAS: { key: Persona; label: string; href: string; Icon: typeof Gauge }[] = [
  { key: 'student', label: 'Student', href: '/demo/student', Icon: GraduationCap },
  { key: 'employer', label: 'Employer', href: '/demo/employer', Icon: Building2 },
  { key: 'admin', label: 'Admin', href: '/demo/admin', Icon: Shield },
]

function isActive(pathname: string, href: string) {
  const root = href.split('/').length <= 3
  return root ? pathname === href : pathname === href || pathname.startsWith(`${href}/`)
}

function Brand() {
  return (
    <Link href="/demo" className="flex items-center gap-2.5 rounded-md text-cx-ink no-underline">
      <SyrkaSymbol className="h-[14px] w-auto text-cx-accent" strokeWidth={6} />
      <span className="text-[14px] font-semibold tracking-[0.14em]">SYRKA</span>
      <span className="text-[14px] font-normal text-cx-dim">Campus</span>
    </Link>
  )
}

function PersonaSwitch({ persona, onNavigate }: { persona: Persona; onNavigate?: () => void }) {
  return (
    <div className="grid grid-cols-3 gap-0.5 rounded-[9px] bg-cx-sunken p-0.5" role="tablist" aria-label="Demo persona">
      {PERSONAS.map(p => (
        <Link
          key={p.key} href={p.href} role="tab" aria-selected={persona === p.key} onClick={onNavigate}
          className={cn('flex items-center justify-center gap-1 rounded-[7px] py-1.5 text-[12px] font-medium no-underline transition-colors',
            persona === p.key ? 'bg-cx-surface text-cx-ink shadow-sm' : 'text-cx-dim hover:text-cx-ink')}
        >
          {p.label}
        </Link>
      ))}
    </div>
  )
}

function SidebarContent({ persona, onNavigate }: { persona: Persona; onNavigate?: () => void }) {
  const pathname = usePathname()
  const state = useDemoState()
  const student = state.students.find(s => s.id === PRIMARY_STUDENT_ID)
  const employer = company(state, PRIMARY_COMPANY_ID)
  const user = persona === 'student'
    ? { name: student?.name ?? 'Demo student', role: 'Demo student' }
    : persona === 'employer'
      ? { name: 'Northstar recruiter', role: `${employer?.name ?? 'Demo company'} · demo` }
      : { name: 'Demo administrator', role: 'SYRKA Campus · demo' }
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-4 pb-4 pt-5">
        <Brand />
        <DemoBadge />
      </div>
      <div className="px-3">
        <div className="cx-eyebrow mb-1.5 px-1">Viewing as</div>
        <PersonaSwitch persona={persona} onNavigate={onNavigate} />
      </div>
      <nav aria-label={`${persona} navigation`} className="mt-5 flex flex-col gap-0.5 px-3">
        {NAV[persona].map(({ href, label, Icon }) => {
          const active = isActive(pathname, href)
          return (
            <Link
              key={href} href={href} onClick={onNavigate} aria-current={active ? 'page' : undefined}
              className={cn('flex items-center gap-2.5 rounded-[8px] px-2.5 py-[7px] text-[13.5px] no-underline transition-colors',
                active ? 'bg-cx-surface font-medium text-cx-ink shadow-[0_0_0_1px_var(--cx-line)]' : 'text-cx-ink2 hover:bg-cx-sunken hover:text-cx-ink')}
            >
              <Icon size={16} className={active ? 'text-cx-accent' : 'text-cx-dim'} aria-hidden />
              {label}
            </Link>
          )
        })}
      </nav>
      <div className="mt-auto border-t border-cx-line p-3">
        <div className="flex items-center gap-2.5 rounded-[8px] px-1.5 py-1">
          <Avatar name={user.name} size={30} />
          <div className="min-w-0">
            <div className="truncate text-[13px] font-medium text-cx-ink">{user.name}</div>
            <div className="truncate text-[11.5px] text-cx-dim">{user.role}</div>
          </div>
        </div>
        <p className="mt-2 px-1.5 text-[11px] leading-snug text-cx-faint">Demo persona. No sign-in or real authentication.</p>
      </div>
    </div>
  )
}

function Notifications({ persona }: { persona: Persona }) {
  const state = useDemoState()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false) }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey) }
  }, [open])
  // Students see employer actions on their own profile (never internal notes); employers see their own activity.
  const items = state.activity.filter(a =>
    persona === 'student' ? a.studentId === PRIMARY_STUDENT_ID && a.actor === 'employer' && a.kind !== 'note_added'
      : persona === 'employer' ? a.companyId === PRIMARY_COMPANY_ID
        : true,
  ).slice(0, 6)
  const describe = (a: (typeof items)[number]) => {
    if (persona !== 'student') return a.message
    const org = a.companyId ? company(state, a.companyId)?.name ?? 'An employer' : 'An employer'
    const jobTitle = state.jobs.find(j => j.id === a.jobId)?.title
    if (a.kind === 'candidate_reviewed') return `${org} reviewed your profile`
    if (a.kind === 'candidate_shortlisted') return `${org} shortlisted you for ${jobTitle ?? 'a role'}`
    if (a.kind === 'candidate_unshortlisted') return `${org} updated its ${jobTitle ?? ''} shortlist`
    return a.message
  }
  return (
    <div className="relative" ref={ref}>
      <button type="button" className="cx-btn cx-btn-ghost h-9 w-9 !px-0" aria-label="Notifications" aria-expanded={open} onClick={() => setOpen(o => !o)}>
        <Bell size={17} />
      </button>
      {open && (
        <div className="cx-card absolute right-0 top-11 z-40 w-[320px] max-w-[calc(100vw-32px)] overflow-hidden shadow-xl">
          <div className="border-b border-cx-line px-4 py-2.5 text-[13px] font-semibold">Recent activity</div>
          {items.length ? (
            <ul className="max-h-80 overflow-y-auto">
              {items.map(a => (
                <li key={a.id} className="border-b border-cx-line px-4 py-2.5 last:border-0">
                  <div className="text-[13px] text-cx-ink">{describe(a)}</div>
                  <Time iso={a.createdAt} relative className="text-[11.5px] text-cx-dim" />
                </li>
              ))}
            </ul>
          ) : <div className="px-4 py-6 text-center text-[13px] text-cx-dim">Nothing new yet.</div>}
        </div>
      )}
    </div>
  )
}

function TopBar({ persona, onMenu }: { persona: Persona; onMenu: () => void }) {
  const router = useRouter()
  const [q, setQ] = useState('')
  const target = persona === 'student' ? '/demo/student/opportunities' : '/demo/employer/candidates'
  const placeholder = persona === 'student' ? 'Search jobs, companies, skills…' : 'Search candidates or skills…'
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-cx-line px-4 backdrop-blur md:px-6" style={{ background: 'color-mix(in srgb, var(--cx-bg) 92%, transparent)' }}>
      <div className="lg:hidden"><button type="button" className="cx-btn cx-btn-ghost h-9 w-9 !px-0" aria-label="Open navigation" onClick={onMenu}><Menu size={18} /></button></div>
      <div className="lg:hidden"><Brand /></div>
      <form
        role="search"
        className="relative ml-auto w-full max-w-[380px] max-sm:hidden lg:ml-0"
        onSubmit={e => { e.preventDefault(); router.push(q.trim() ? `${target}?q=${encodeURIComponent(q.trim())}` : target) }}
      >
        <Search size={15} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-cx-faint" aria-hidden />
        <input className="cx-input !pl-8" value={q} onChange={e => setQ(e.target.value)} placeholder={placeholder} aria-label={placeholder} />
      </form>
      <div className="ml-auto flex items-center gap-1.5">
        <span className="hidden text-[12px] text-cx-dim xl:inline">Fictional demo data</span>
        <Notifications persona={persona} />
      </div>
    </header>
  )
}

/** Placeholder shown until this browser's saved demo state has loaded, so seed values never flash on refresh. */
function LoadingState() {
  return (
    <div aria-busy="true" aria-label="Loading demo data" className="animate-pulse space-y-4">
      <div className="h-8 w-64 rounded-[8px] bg-cx-sunken" />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">{[0, 1, 2, 3].map(i => <div key={i} className="h-[92px] rounded-[12px] bg-cx-sunken" />)}</div>
      <div className="h-72 rounded-[12px] bg-cx-sunken" />
    </div>
  )
}

export default function AppShell({ persona, children }: { persona: Persona; children: ReactNode }) {
  const hydrated = useHydrated()
  const [menuOpen, setMenuOpen] = useState(false)
  const pathname = usePathname()
  // Close the mobile menu whenever the route changes.
  const [lastPath, setLastPath] = useState(pathname)
  if (lastPath !== pathname) { setLastPath(pathname); setMenuOpen(false) }
  return (
    <div className="min-h-[100dvh] lg:pl-[248px]">
      <aside className="fixed inset-y-0 left-0 hidden w-[248px] border-r border-cx-line bg-cx-bg lg:block">
        <SidebarContent persona={persona} />
      </aside>
      <Dialog open={menuOpen} onClose={() => setMenuOpen(false)} title="Navigation" variant="drawer-left" width={300}>
        <div className="-mx-5 -my-4 h-full"><SidebarContent persona={persona} onNavigate={() => setMenuOpen(false)} /></div>
      </Dialog>
      <TopBar persona={persona} onMenu={() => setMenuOpen(true)} />
      <main className="mx-auto w-full max-w-[1200px] px-4 py-6 md:px-6 md:py-8">{hydrated ? children : <LoadingState />}</main>
    </div>
  )
}
