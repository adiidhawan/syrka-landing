import AppShell from '@/components/campus/AppShell'

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return <AppShell persona="student">{children}</AppShell>
}
