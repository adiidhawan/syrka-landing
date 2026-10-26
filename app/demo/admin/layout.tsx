import AppShell from '@/components/campus/AppShell'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AppShell persona="admin">{children}</AppShell>
}
