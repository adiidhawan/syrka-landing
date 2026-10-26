import CandidatesView from '@/components/campus/views/CandidatesView'

export default async function CandidatesPage({ searchParams }: { searchParams: Promise<{ job?: string; q?: string }> }) {
  const { job, q } = await searchParams
  return <CandidatesView key={q ?? ''} initialJob={job} initialQuery={q ?? ''} />
}
