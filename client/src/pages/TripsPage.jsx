import { Link, useSearchParams } from 'react-router-dom'
import { useDestinations, useTrips } from '../features/trips/useTrips.js'
import TripRow from '../features/trips/TripRow.jsx'
import { EmptyState, ErrorState } from '../components/States.jsx'

export default function TripsPage() {
  const [params, setParams] = useSearchParams()
  const destination = params.get('destination') ?? ''
  const womenOnly = params.get('womenOnly') === 'true'
  const destinations = useDestinations()
  const trips = useTrips({ destination: destination || undefined, womenOnly: womenOnly ? 'true' : undefined })

  const set = (k, v) => {
    const next = new URLSearchParams(params)
    if (v) next.set(k, v)
    else next.delete(k)
    setParams(next, { replace: true })
  }
  const destName = destinations.data?.find((d) => d.slug === destination)?.name

  return (
    <section className="mx-auto max-w-[1000px] px-4 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[36px] font-extrabold">Group trips</h1>
          <p className="mt-1 max-w-xl text-slate">
            Upcoming trips from Bengaluru looking for people. Ask for a seat; the host decides who comes.
          </p>
        </div>
        <Link to="/trips/new" className="btn-go">Host a trip</Link>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <label className="sr-only" htmlFor="trip-dest">Destination</label>
        <select id="trip-dest" className="field w-auto min-w-52" value={destination} onChange={(e) => set('destination', e.target.value)}>
          <option value="">Every destination</option>
          {destinations.data?.map((d) => <option key={d.slug} value={d.slug}>{d.name}</option>)}
        </select>
        <button type="button" className="chip" aria-pressed={womenOnly} onClick={() => set('womenOnly', womenOnly ? '' : 'true')}>
          Women-only trips
        </button>
      </div>

      <div className="mt-6">
        {trips.isPending && <div className="space-y-3">{[0, 1, 2].map((i) => <div key={i} className="skeleton h-28" />)}</div>}
        {trips.error && <ErrorState error={trips.error} onRetry={trips.refetch} />}
        {trips.data?.length === 0 && (
          <EmptyState
            title={destName ? `No upcoming trips to ${destName}` : 'No upcoming trips match'}
            action={<Link to={`/trips/new${destination ? `?destination=${destination}` : ''}`} className="btn-go">Host one</Link>}
          >
            Start one and others can ask to join.
          </EmptyState>
        )}
        {trips.data?.length > 0 && <ul className="space-y-3">{trips.data.map((t) => <TripRow key={t.id} trip={t} />)}</ul>}
      </div>
    </section>
  )
}
