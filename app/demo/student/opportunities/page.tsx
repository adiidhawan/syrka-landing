import OpportunitiesView from '@/components/campus/views/OpportunitiesView'

export default async function OpportunitiesPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams
  return <OpportunitiesView key={q ?? ''} initialQuery={q ?? ''} />
}
