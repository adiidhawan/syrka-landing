import CandidateDetailView from '@/components/campus/views/CandidateDetailView'

export default async function CandidatePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ job?: string }> }) {
  const [{ id }, { job }] = await Promise.all([params, searchParams])
  return <CandidateDetailView id={id} initialJob={job} />
}
