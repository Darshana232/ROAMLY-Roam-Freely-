import { Link } from 'react-router-dom'
import Photo from '../../components/Photo.jsx'
import { dateRange, nightsBetween, plural, rupees } from '../../lib/format.js'

const monthFmt = new Intl.DateTimeFormat('en-IN', { month: 'short', timeZone: 'UTC' })

export function Seats({ seats, left }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="flex gap-0.5" aria-hidden>
        {Array.from({ length: seats }, (_, i) => (
          <span key={i} className={`h-3 w-2 rounded-[2px] ${i < seats - left ? 'bg-ghat-900' : 'border border-ghat-900/40'}`} />
        ))}
      </span>
      <span className={left === 0 ? 'font-semibold text-signal' : left === 1 ? 'font-semibold text-amber' : ''}>
        {left === 0 ? 'Full' : `${plural(left, 'seat')} left`}
      </span>
    </span>
  )
}

export function Tags({ trip }) {
  return (
    <>
      {trip.womenOnly && <span className="rounded-full bg-milestone-soft px-2 py-0.5 text-xs font-semibold">Women only</span>}
      {trip.sample && <span className="rounded-full bg-asphalt/[0.07] px-2 py-0.5 text-xs font-semibold text-slate">Sample trip</span>}
    </>
  )
}

export default function TripRow({ trip, extra }) {
  const start = new Date(trip.startDate)
  const nights = nightsBetween(trip.startDate, trip.endDate)

  return (
    <li className="surface flex gap-4 p-3 sm:p-4">
      <div className="flex w-14 shrink-0 flex-col items-center justify-center rounded-control bg-ghat-900 py-2 text-white">
        <span className="num font-condensed text-[30px] font-extrabold leading-none">{start.getUTCDate()}</span>
        <span className="text-xs text-white/75">{monthFmt.format(start)}</span>
      </div>
      <Photo image={trip.destination.image} alt="" credit={false} sizes="128px" className="hidden aspect-[4/3] w-32 shrink-0 sm:block" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Link to={`/trips/${trip.id}`} className="text-lg font-bold leading-snug hover:underline">{trip.title}</Link>
          <Tags trip={trip} />
        </div>
        <p className="text-sm text-slate">
          {trip.destination.name}, {dateRange(trip.startDate, trip.endDate)} ({nights ? plural(nights, 'night') : 'day trip'}) by {trip.mode}. Hosted by {trip.host.name}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm">
          <Seats seats={trip.seats} left={trip.seatsLeft} />
          <span><span className="num font-semibold">{rupees(trip.budgetPerPerson)}</span> <span className="text-slate">per person</span></span>
          {extra}
        </div>
      </div>
    </li>
  )
}
