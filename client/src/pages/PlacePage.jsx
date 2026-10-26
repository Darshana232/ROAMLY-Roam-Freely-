import { useEffect } from 'react'
import { Link, useLocation, useParams, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ExternalLink } from 'lucide-react'
import { api } from '../lib/api.js'
import Milestone from '../components/Milestone.jsx'
import Photo from '../components/Photo.jsx'
import { EmptyState, ErrorState } from '../components/States.jsx'
import ItineraryEditor from '../features/itinerary/ItineraryEditor.jsx'
import StaysList from '../features/stays/StaysList.jsx'
import TripRow from '../features/trips/TripRow.jsx'
import { useTrips } from '../features/trips/useTrips.js'
import { INTEREST_LABELS, crowdLabel, minutes, plural } from '../lib/format.js'

function Facts({ d }) {
  const facts = [
    ['By road from Bengaluru', `About ${d.roadKm} km`],
    ['Worth', plural(d.idealDays, 'day')],
    ['Crowds', crowdLabel(d.crowd)],
    ['Direct bus', d.busFromBlr ? 'Yes, from Bengaluru' : 'No, change or taxi'],
    ...(d.remote ? [['Services', 'Patchy signal, few shops']] : []),
  ]
  return (
    <dl className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3 lg:grid-cols-5">
      {facts.map(([k, v]) => (
        <div key={k}>
          <dt className="text-sm text-slate">{k}</dt>
          <dd className="font-semibold">{v}</dd>
        </div>
      ))}
    </dl>
  )
}

function Attractions({ d }) {
  return (
    <ul className="grid gap-x-8 gap-y-5 md:grid-cols-2">
      {d.attractions.map((a) => (
        <li key={a.slug} className="border-t border-line pt-4">
          <p className="font-bold">{a.name}</p>
          {a.summary && <p className="mt-1 text-[15px]">{a.summary}</p>}
          <p className="mt-1.5 flex flex-wrap gap-x-4 text-sm text-slate">
            <span>Allow about {minutes(a.minutes)}</span>
            <span>{a.hours ? `Usually open ${a.hours.open}–${a.hours.close}; confirm locally` : 'Opening hours not verified'}</span>
            <a href={a.source} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:underline">
              {a.summary ? 'Wikipedia' : `Read about it on Wikipedia (${d.name})`} <ExternalLink className="size-3" aria-hidden />
            </a>
          </p>
        </li>
      ))}
    </ul>
  )
}

function TripsHere({ d }) {
  const { data, error, isPending, refetch } = useTrips({ destination: d.slug })
  if (isPending) return <div className="skeleton h-28" />
  if (error) return <ErrorState error={error} onRetry={refetch} />
  if (!data.length) {
    return (
      <EmptyState title={`No one’s going to ${d.name} yet`} action={<Link to={`/trips/new?destination=${d.slug}`} className="btn-go">Host a trip here</Link>}>
        Start a trip and others heading the same way can ask to join.
      </EmptyState>
    )
  }
  return (
    <>
      <ul className="space-y-3">{data.slice(0, 3).map((t) => <TripRow key={t.id} trip={t} />)}</ul>
      <div className="mt-3 flex gap-3">
        {data.length > 3 && <Link to={`/trips?destination=${d.slug}`} className="btn-outline">All {data.length} trips</Link>}
        <Link to={`/trips/new?destination=${d.slug}`} className="btn-quiet">Host your own</Link>
      </div>
    </>
  )
}

export default function PlacePage() {
  const { slug } = useParams()
  const [params] = useSearchParams()
  const location = useLocation()
  const days = Math.min(4, Math.max(1, Number(params.get('days')) || 0))
  const mode = params.get('mode') === 'car' ? 'car' : 'bus'

  const { data: d, error, isPending, refetch } = useQuery({
    queryKey: ['destination', slug],
    queryFn: async () => (await api.get(`/destinations/${slug}`)).data.destination,
  })

  // Arriving from "Plan the days" lands on the planner once the page exists.
  useEffect(() => {
    if (d && location.hash === '#plan') document.getElementById('plan')?.scrollIntoView({ block: 'start' })
  }, [d, location.hash])

  if (isPending) {
    return (
      <div className="mx-auto max-w-[1200px] px-4 py-10">
        <div className="grid gap-8 lg:grid-cols-[1fr_1.3fr]"><div className="skeleton h-72" /><div className="skeleton aspect-[3/2]" /></div>
      </div>
    )
  }
  if (error) {
    return (
      <div className="mx-auto max-w-[1200px] px-4 py-10">
        {error.response?.status === 404
          ? <EmptyState title="We don’t have that place yet" action={<Link to="/discover" className="btn-primary">Find a trip</Link>} />
          : <ErrorState error={error} onRetry={refetch} />}
      </div>
    )
  }

  return (
    <article>
      <header className="mx-auto grid max-w-[1200px] gap-8 px-4 pb-8 pt-8 lg:grid-cols-[1fr_1.3fr] lg:items-end lg:pt-12">
        <div className="order-2 lg:order-1">
          <Milestone name={d.name} km={d.roadKm} size="lg" />
          <h1 className="mt-6 text-[44px] font-extrabold sm:text-[60px]">{d.name}</h1>
          <p className="text-lg text-slate">{d.region}</p>
          {d.summary && (
            <p className="mt-4 max-w-[60ch] text-[17px]">
              {d.summary}{' '}
              <a href={d.source} target="_blank" rel="noreferrer" className="link whitespace-nowrap">From Wikipedia</a>
            </p>
          )}
          <p className="mt-4 flex flex-wrap gap-2">
            {d.interests.filter((i) => INTEREST_LABELS[i]).map((i) => (
              <span key={i} className="rounded-full bg-ghat-100 px-2.5 py-1 text-sm">{INTEREST_LABELS[i]}</span>
            ))}
          </p>
        </div>
        <Photo image={d.image} alt={d.name} priority className="order-1 aspect-[3/2] w-full lg:order-2" sizes="(min-width: 1024px) 680px, 100vw" />
      </header>

      <div className="mx-auto max-w-[1200px] px-4">
        <div className="border-y border-line py-5"><Facts d={d} /></div>

        <section id="plan" className="scroll-mt-20 pt-12" aria-labelledby="plan-h">
          <h2 id="plan-h" className="text-[32px] font-extrabold">Plan the days</h2>
          <p className="mt-1 max-w-[65ch] text-slate">
            A first draft built from travel time, how long each place takes and when it’s best. Drag stops, move them between days, then save.
          </p>
          <div className="mt-6">
            <ItineraryEditor key={`${d.slug}-${days}-${mode}`} destination={d} initialDays={days || Math.min(4, d.idealDays)} initialMode={mode} />
          </div>
        </section>

        <section className="pt-14" aria-labelledby="see-h">
          <h2 id="see-h" className="text-[32px] font-extrabold">Places to see</h2>
          <div className="mt-5"><Attractions d={d} /></div>
        </section>

        <section className="pt-14" aria-labelledby="stay-h">
          <h2 id="stay-h" className="text-[32px] font-extrabold">Where to stay</h2>
          <div className="mt-5"><StaysList slug={d.slug} /></div>
        </section>

        <section className="pt-14" aria-labelledby="trips-h">
          <h2 id="trips-h" className="text-[32px] font-extrabold">Group trips to {d.name}</h2>
          <div className="mt-5"><TripsHere d={d} /></div>
        </section>
      </div>
    </article>
  )
}
