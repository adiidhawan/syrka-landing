import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import '@/components/campus/campus.css'

const sans = Geist({ subsets: ['latin'], variable: '--font-cx-sans' })
const mono = Geist_Mono({ subsets: ['latin'], variable: '--font-cx-mono' })

export const metadata: Metadata = {
  title: { default: 'SYRKA Campus — Demo', template: '%s · SYRKA Campus demo' },
  description: 'An interactive demonstration of SYRKA Campus using fictional students, companies, assessments and jobs.',
}

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return <div className={`cx ${sans.variable} ${mono.variable} min-h-[100dvh]`}>{children}</div>
}
