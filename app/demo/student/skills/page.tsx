import SkillsView from '@/components/campus/views/SkillsView'

export default async function SkillsPage({ searchParams }: { searchParams: Promise<{ assess?: string; add?: string }> }) {
  const { assess, add } = await searchParams
  return <SkillsView initialAssess={assess} initialAdd={add} />
}
