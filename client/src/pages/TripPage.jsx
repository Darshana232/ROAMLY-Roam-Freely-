import { useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { CheckCircle2, Clock, MapPin, XCircle } from 'lucide-react'
import { useTrip, useTripAction } from '../features/trips/useTrips.js'
import { Seats, Tags } from '../features/trips/TripRow.jsx'
import { useMe } from '../features/auth/useAuth.js'
import Photo from '../components/Photo.jsx'
import { EmptyState, ErrorState, InlineError, Spinner } from '../components/States.jsx'
import { dateRange, nightsBetween, plural, rupees } from '../lib/format.js'

const STATUS = {
  pending: { icon: Clock, tone: 'text-amber', label: 'Waiting for the host' },
  approved: { icon: CheckCircle2, tone: 'text-leaf', label: 'Approved' },
  rejected: { icon: XCircle, tone: 'text-signal', label: 'Declined' },
}

function StatusLine({ status, children }) {
  const s = STATUS[status]
  return (
    <motion.p
      key={status}
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-center gap-2 font-semibold ${s.tone}`}
      role="status"
    >
      <s.icon className="size-5" aria-hidden /> {children ?? s.label}
    </motion.p>
  )
}

function HostPanel({ trip }) {
  const action = useTripAction(trip.id)
  const [confirmCancel, setConfirmCancel] = useState(false)
  const pending = trip.requests.filter((r) => r.status === 'pending')
  const decided = trip.requests.filter((r) => r.status !== 'pending')

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold">Requests</h2>
        {action.error && <div className="mt-2"><InlineError error={action.error} /></div>}
        {pending.length === 0 ? (
          <p className="mt-1 text-slate">No requests waiting.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            <AnimatePresence initial={false}>
              {pending.map((r) => (
                <motion.li key={r.id} layout exit={{ opacity: 0, height: 0 }} className="surface p-3">
                  <p className="font-semibold">{r.user.name}</p>
                  {r.message && <p className="mt-1 text-[15px]">“{r.message}”</p>}
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      className="btn-primary"
                      disabled={action.isPending || trip.seatsLeft === 0 || trip.started}
                      onClick={() => action.mutate({ path: `/requests/${r.id}/approve` })}
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      className="btn-outline"
                      disabled={action.isPending}
                      onClick={() => action.mutate({ path: `/requests/${r.id}/reject` })}
                    >
                      Decline
                    </button>
                  </div>
                  {trip.seatsLeft === 0 && <p className="mt-2 text-sm text-slate">The trip is full, so you can only decline.</p>}
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        )}
      </div>
      {decided.length > 0 && (
        <div>
          <h3 className="font-bold">Decided</h3>
          <ul className="mt-2 space-y-1 text-[15px]">
            {decided.map((r) => (
              <li key={r.id} className="flex justify-between gap-3">
                <span>{r.user.name}</span>
                <span className={STATUS[r.status].tone}>{STATUS[r.status].label}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {trip.status === 'open' && !trip.started && (
        <div className="border-t border-line pt-4">
          {confirmCancel ? (
            <div className="flex flex-wrap items-center gap-2">
              <p className="w-full text-sm">Everyone on this trip will see it as cancelled.</p>
              <button type="button" className="btn-outline" onClick={() => setConfirmCancel(false)}>Keep the trip</button>
              <button type="button" className="btn-danger" disabled={action.isPending} onClick={() => action.mutate({ path: '/cancel' })}>
                Cancel trip
              </button>
            </div>
          ) : (
            <button type="button" className="btn-quiet text-signal" onClick={() => setConfirmCancel(true)}>Cancel this trip</button>
          )}
        </div>
      )}
    </div>
  )
}

function GuestPanel({ trip, user }) {
  const action = useTripAction(trip.id)
  const location = useLocation()
  const [message, setMessage] = useState('')
  const mine = trip.myRequest

  if (!user) {
    return (
      <div>
        <p className="text-slate">Log in to ask the host for a seat.</p>
        <Link to={`/login?next=${encodeURIComponent(location.pathname)}`} className="btn-go mt-3 w-full">Log in to request a seat</Link>
      </div>
    )
  }

  if (mine?.status === 'pending' || mine?.status === 'approved') {
    return (
      <div className="space-y-3">
        <StatusLine status={mine.status}>{mine.status === 'approved' ? 'You’re going' : 'Request sent. Waiting for the host.'}</StatusLine>
        {action.error && <InlineError error={action.error} />}
        {!trip.started && (
          <button type="button" className="btn-outline w-full" disabled={action.isPending} onClick={() => action.mutate({ method: 'delete', path: '/requests/mine' })}>
            {action.isPending && <Spinner />} {mine.status === 'approved' ? 'Leave this trip' : 'Withdraw request'}
          </button>
        )}
      </div>
    )
  }
  if (mine?.status === 'rejected') return <StatusLine status="rejected">The host declined your request</StatusLine>

  const blocked =
    trip.status !== 'open' ? 'This trip was cancelled.'
      : trip.started ? 'This trip has already started.'
        : trip.seatsLeft === 0 ? 'This trip is full.'
          : trip.womenOnly && user.gender !== 'woman' ? 'This trip is for women only.'
            : null

  if (blocked) return <p className="font-semibold text-slate">{blocked}</p>

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault()
        action.mutate({ path: '/requests', body: { message: message.trim() || undefined } })
      }}
    >
      <label htmlFor="join-msg" className="field-label">Note to the host <span className="font-normal text-slate">(optional)</span></label>
      <textarea
        id="join-msg"
        className="field min-h-24 py-2"
        maxLength={400}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="A line about you helps the host decide."
      />
      {action.error && <InlineError error={action.error} />}
      <button type="submit" className="btn-go w-full" disabled={action.isPending}>
        {action.isPending && <Spinner />} Request a seat
      </button>
    </form>
  )
}

export default function TripPage() {
  const { id } = useParams()
  const { data: user } = useMe()
  const { data: trip, error, isPending, refetch } = useTrip(id)

  if (isPending) return <div className="mx-auto max-w-[1000px] px-4 py-10"><div className="skeleton h-96" /></div>
  if (error) {
    return (
      <div className="mx-auto max-w-[1000px] px-4 py-10">
        {error.response?.status === 404 ? (
          <EmptyState title="We can’t find that trip" action={<Link to="/trips" className="btn-primary">See group trips</Link>} />
        ) : (
          <ErrorState error={error} onRetry={refetch} />
        )}
      </div>
    )
  }

  const nights = nightsBetween(trip.startDate, trip.endDate)

  return (
    <article className="mx-auto max-w-[1000px] px-4 py-10">
      <div className="grid gap-8 md:grid-cols-[1fr_340px]">
        <div className="min-w-0">
          <div className="flex flex-wrap gap-2"><Tags trip={trip} />{trip.status === 'cancelled' && <span className="rounded-full bg-signal/10 px-2 py-0.5 text-xs font-semibold text-signal">Cancelled</span>}</div>
          <h1 className="mt-2 text-[32px] font-extrabold sm:text-[40px]">{trip.title}</h1>
          <p className="mt-2 text-lg">
            <Link to={`/places/${trip.destination.slug}`} className="link">{trip.destination.name}</Link>, {dateRange(trip.startDate, trip.endDate)}
            <span className="text-slate"> ({nights ? plural(nights, 'night') : 'day trip'}) by {trip.mode}</span>
          </p>
          <Photo image={trip.destination.image} alt={trip.destination.name} className="mt-5 aspect-[16/9] w-full" sizes="(min-width: 768px) 620px, 100vw" />

          <dl className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div><dt className="text-sm text-slate">Budget</dt><dd className="num text-lg font-bold">{rupees(trip.budgetPerPerson)} <span className="text-sm font-normal text-slate">each</span></dd></div>
            <div><dt className="text-sm text-slate">Seats</dt><dd className="mt-1"><Seats seats={trip.seats} left={trip.seatsLeft} /></dd></div>
            <div><dt className="text-sm text-slate">Host</dt><dd className="text-lg font-bold">{trip.host.name}</dd></div>
          </dl>

          {trip.meetingPoint && (
            <p className="mt-5 flex items-center gap-2"><MapPin className="size-4 text-slate" aria-hidden /> Meeting at {trip.meetingPoint}</p>
          )}
          {trip.description && <p className="mt-4 max-w-[65ch] whitespace-pre-line text-[17px]">{trip.description}</p>}

          <div className="mt-6">
            <h2 className="text-lg font-bold">Who’s going</h2>
            <p className="mt-1 text-[15px]">
              {[trip.host.name + ' (host)', ...trip.members.map((m) => m.name)].join(', ')}
            </p>
          </div>
          {trip.sample && (
            <p className="mt-6 rounded-control bg-asphalt/[0.05] p-3 text-sm text-slate">
              This is a sample trip created to show how group trips work. Requests and approvals on it are real and saved.
            </p>
          )}
        </div>

        <aside className="md:sticky md:top-24 md:self-start">
          <div className="surface p-4">
            {trip.isHost ? <HostPanel trip={trip} /> : <GuestPanel trip={trip} user={user} />}
          </div>
        </aside>
      </div>
    </article>
  )
}
