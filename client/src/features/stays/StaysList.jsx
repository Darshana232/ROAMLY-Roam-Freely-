import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Star } from 'lucide-react'
import { api } from '../../lib/api.js'
import { ErrorState } from '../../components/States.jsx'
import { rupees } from '../../lib/format.js'

const KIND = { hostel: 'Hostel', homestay: 'Homestay', guesthouse: 'Guesthouse', resort: 'Resort' }

export function Rating({ avg, count }) {
  if (!count) return <span className="text-sm text-slate">No reviews yet</span>
  return (
    <span className="inline-flex items-center gap-1 text-sm">
      <Star className="size-4 fill-milestone text-milestone" aria-hidden />
      <span className="num font-semibold">{avg.toFixed(1)}</span>
      <span className="text-slate">({count})</span>
    </span>
  )
}

export default function StaysList({ slug }) {
  const { data, error, isPending, refetch } = useQuery({
    queryKey: ['stays', slug],
    queryFn: async () => (await api.get('/stays', { params: { destination: slug } })).data.stays,
  })

  if (isPending) return <div className="grid gap-3 sm:grid-cols-2">{[0, 1].map((i) => <div key={i} className="skeleton h-36" />)}</div>
  if (error) return <ErrorState error={error} onRetry={refetch} />

  return (
    <>
      <ul className="grid gap-3 sm:grid-cols-2">
        {data.map((s) => (
          <li key={s.id} className="surface flex flex-col p-4">
            <p className="text-sm text-slate">{KIND[s.kind]}, {s.area.toLowerCase()}</p>
            <Link to={`/stays/${s.id}`} className="mt-0.5 text-lg font-bold leading-snug hover:underline">{s.name}</Link>
            <div className="mt-1"><Rating avg={s.ratingAvg} count={s.ratingCount} /></div>
            <p className="mt-3">
              <span className="num text-xl font-extrabold">{rupees(s.roomPerNight)}</span>
              <span className="text-sm text-slate"> a room per night, sleeps {s.sleeps}</span>
            </p>
            {s.dormBedPerNight && <p className="text-sm text-slate">Dorm beds from <span className="num">{rupees(s.dormBedPerNight)}</span></p>}
            <Link to={`/stays/${s.id}`} className="btn-outline mt-4 self-start">See price breakdown</Link>
          </li>
        ))}
      </ul>
      {data.some((s) => s.sample) && (
        <p className="mt-3 text-sm text-slate">
          These are sample listings that show how stays work in Roamly, not real properties. Reviews on them are real and
          come only from people who completed a trip here.
        </p>
      )}
    </>
  )
}
