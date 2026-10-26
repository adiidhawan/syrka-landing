import AppShell from '@/components/campus/AppShell'

export default function EmployerLayout({ children }: { children: React.ReactNode }) {
  return <AppShell persona="employer">{children}</AppShell>
}
