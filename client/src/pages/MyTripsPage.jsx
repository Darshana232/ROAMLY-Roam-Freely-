import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2, XCircle } from 'lucide-react'
import { useAlerts, useMarkAlertsSeen, useMyTrips } from '../features/trips/useTrips.js'
import TripRow from '../features/trips/TripRow.jsx'
import { EmptyState, ErrorState } from '../components/States.jsx'
import { plural } from '../lib/format.js'

const STATUS_TEXT = {
  pending: ['text-amber', 'Waiting for the host'],
  approved: ['text-leaf', 'You’re going'],
  rejected: ['text-signal', 'Declined'],
}

const isPast = (t) => new Date(t.endDate) < new Date(new Date().toDateString())

// Shows decisions the traveller hasn't seen, then marks them seen. The list is
// kept for this visit so the message doesn't vanish the moment it's read.
function Decisions() {
  const { data } = useAlerts(true)
  const markSeen = useMarkAlertsSeen()
  const [shown, setShown] = useState([])

  useEffect(() => {
    if (!data?.decisions.length) return
    setShown((prev) => [...prev, ...data.decisions.filter((d) => !prev.some((p) => p.tripId === d.tripId))])
    markSeen.mutate()
  }, [data]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!shown.length) return null
  return (
    <ul className="mt-6 space-y-2" role="status">
      {shown.map((d) => (
        <li key={d.tripId} className={`flex items-center gap-2 rounded-surface p-3 font-medium ${d.status === 'approved' ? 'bg-leaf/10 text-leaf' : 'bg-signal/[0.07] text-signal'}`}>
          {d.status === 'approved' ? <CheckCircle2 className="size-5 shrink-0" aria-hidden /> : <XCircle className="size-5 shrink-0" aria-hidden />}
          <span>
            {d.status === 'approved' ? 'Approved. You’re going on ' : 'The host declined your request for '}
            <Link to={`/trips/${d.tripId}`} className="underline underline-offset-2">{d.title}</Link>.
          </span>
        </li>
      ))}
    </ul>
  )
}

export default function MyTripsPage() {
  const { data, error, isPending, refetch } = useMyTrips()

  return (
    <section className="mx-auto max-w-[1000px] px-4 py-10">
      <h1 className="text-[36px] font-extrabold">My trips</h1>
      <Decisions />
      {isPending && <div className="mt-6 space-y-3">{[0, 1].map((i) => <div key={i} className="skeleton h-28" />)}</div>}
      {error && <div className="mt-6"><ErrorState error={error} onRetry={refetch} /></div>}
      {data && (
        <>
          <h2 className="mt-8 text-xl font-bold">Hosting</h2>
          {data.hosting.length === 0 ? (
            <div className="mt-3">
              <EmptyState title="You’re not hosting any trips" action={<Link to="/trips/new" className="btn-go">Host a trip</Link>} />
            </div>
          ) : (
            <ul className="mt-3 space-y-3">
              {data.hosting.map((t) => (
                <TripRow
                  key={t.id}
                  trip={t}
                  extra={
                    t.status === 'cancelled' ? <span className="font-semibold text-signal">Cancelled</span>
                      : t.pendingRequests > 0 ? <Link to={`/trips/${t.id}`} className="font-semibold text-amber underline">{plural(t.pendingRequests, 'request')} to review</Link>
                        : isPast(t) ? <span className="text-slate">Finished</span> : null
                  }
                />
              ))}
            </ul>
          )}

          <h2 className="mt-10 text-xl font-bold">Joining</h2>
          {data.joining.length === 0 ? (
            <div className="mt-3">
              <EmptyState title="You haven’t asked to join any trips" action={<Link to="/trips" className="btn-primary">Browse group trips</Link>} />
            </div>
          ) : (
            <ul className="mt-3 space-y-3">
              {data.joining.map((t) => {
                const [tone, text] = STATUS_TEXT[t.myStatus] ?? ['', t.myStatus]
                return (
                  <TripRow
                    key={t.id}
                    trip={t}
                    extra={<span className={`font-semibold ${tone}`}>{t.status === 'cancelled' ? 'Cancelled by host' : isPast(t) && t.myStatus === 'approved' ? 'Completed' : text}</span>}
                  />
                )
              })}
            </ul>
          )}
        </>
      )}
    </section>
  )
}
