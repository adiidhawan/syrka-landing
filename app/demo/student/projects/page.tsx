import ProjectsView from '@/components/campus/views/ProjectsView'

export default async function ProjectsPage({ searchParams }: { searchParams: Promise<{ new?: string; skill?: string }> }) {
  const params = await searchParams
  return <ProjectsView startNew={params.new === '1'} skill={params.skill} />
}
