import { useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import TripSentence from '../features/finder/TripSentence.jsx'
import { DEFAULTS, toSearch } from '../features/finder/useFinder.js'
import { useDestinations, useTrips } from '../features/trips/useTrips.js'
import TripRow from '../features/trips/TripRow.jsx'
import Milestone from '../components/Milestone.jsx'
import Photo from '../components/Photo.jsx'
import { ErrorState } from '../components/States.jsx'
import { plural } from '../lib/format.js'

const HERO_PLACE = 'agumbe'

const WEIGHTS = [
  ['Interests', 35, 'How many of the things you picked the place is known for.'],
  ['Time there', 25, 'Hours left to explore after travel, against how long the place deserves.'],
  ['Budget', 20, 'Estimated bus or fuel, stay, food and local transport, per person.'],
  ['Crowds', 12, 'Quieter or well-known, whichever you asked for.'],
  ['Getting there', 8, 'Direct buses, and phone signal if you’re going alone.'],
]
const SHADES = ['bg-ghat-900', 'bg-ghat-700', 'bg-[#3f7a63]', 'bg-[#7aa892]', 'bg-[#b8d2c4]']

function Road({ destinations }) {
  const scroller = useRef(null)
  const scroll = (dir) => scroller.current?.scrollBy({ left: dir * scroller.current.clientWidth * 0.8, behavior: 'smooth' })

  return (
    <div className="relative">
      <ol ref={scroller} className="flex snap-x gap-5 overflow-x-auto px-4 pb-0 pt-2 [scrollbar-width:none] sm:px-[max(1rem,calc((100vw_-_1200px)/2_+_1rem))]" aria-label="Places ordered by distance from Bengaluru">
        {destinations.map((d) => (
          <li key={d.slug} className="snap-start">
            <Link to={`/places/${d.slug}`} className="group block rounded-t-full">
              <Milestone name={d.name} km={d.roadKm} size="md" className="transition-transform duration-200 group-hover:-translate-y-1" />
            </Link>
          </li>
        ))}
      </ol>
      {/* The road the stones stand beside. */}
      <div className="h-10 bg-asphalt" aria-hidden>
        <div className="relative top-1/2 h-1 -translate-y-1/2 bg-[repeating-linear-gradient(90deg,#f5f6f3_0_28px,transparent_28px_56px)]" />
      </div>
      <div className="mx-auto mt-3 flex max-w-[1200px] justify-end gap-2 px-4">
        <button type="button" className="btn-outline px-3" onClick={() => scroll(-1)} aria-label="Scroll back towards Bengaluru">
          <ChevronLeft className="size-5" />
        </button>
        <button type="button" className="btn-outline px-3" onClick={() => scroll(1)} aria-label="Scroll further from Bengaluru">
          <ChevronRight className="size-5" />
        </button>
      </div>
    </div>
  )
}

export default function HomePage() {
  const navigate = useNavigate()
  const [prefs, setPrefs] = useState(DEFAULTS)
  const destinations = useDestinations()
  const trips = useTrips({})
  const hero = destinations.data?.find((d) => d.slug === HERO_PLACE)
  const farthest = destinations.data?.at(-1)

  return (
    <>
      <section className="bg-ghat-900 text-white">
        <div className="mx-auto grid max-w-[1200px] lg:grid-cols-[1.15fr_1fr]">
          <div className="px-4 py-12 sm:py-16 lg:py-24 lg:pr-12">
            <h1 className="font-wide text-[44px] font-extrabold sm:text-[64px]">How far can you get this weekend?</h1>
            <form
              className="mt-8"
              onSubmit={(e) => {
                e.preventDefault()
                navigate(`/discover?${toSearch(prefs)}`)
              }}
            >
              <TripSentence prefs={prefs} onChange={(p) => setPrefs((s) => ({ ...s, ...p }))} tone="dark" className="text-[24px] text-white/85 sm:text-[30px]" />
              <button type="submit" className="btn-go mt-8 min-h-12 px-6 text-base">Show places that fit</button>
            </form>
            {destinations.data?.length > 0 && (
              <p className="mt-6 max-w-md text-sm text-white/65">
                {plural(destinations.data.length, 'place')} from {destinations.data[0].roadKm} to {farthest.roadKm} km out of Bengaluru,
                ranked on your days, budget and interests, with the working shown.
              </p>
            )}
          </div>
          <div className="relative min-h-[260px] lg:min-h-full">
            {hero ? (
              <div className="absolute inset-0"><Photo image={hero.image} alt={`${hero.name}, ${hero.region}`} priority className="size-full rounded-none" sizes="(min-width: 1024px) 560px, 100vw" /></div>
            ) : (
              <div className="absolute inset-0 bg-ghat-700" />
            )}
          </div>
        </div>
      </section>

      <section className="pt-14" aria-labelledby="road-h">
        <div className="mx-auto max-w-[1200px] px-4">
          <h2 id="road-h" className="text-[32px] font-extrabold">The road out of Bengaluru</h2>
          <p className="mt-1 max-w-[60ch] text-slate">Every place Roamly knows, nearest first. Pick one to see how to spend the days there.</p>
        </div>
        <div className="mt-6">
          {destinations.error && <div className="mx-auto max-w-[1200px] px-4"><ErrorState error={destinations.error} onRetry={destinations.refetch} /></div>}
          {destinations.isPending && (
            <div className="mx-auto flex max-w-[1200px] gap-5 overflow-hidden px-4">
              {Array.from({ length: 7 }, (_, i) => <div key={i} className="skeleton h-[150px] w-[120px] shrink-0 rounded-t-full" />)}
            </div>
          )}
          {destinations.data?.length === 0 && (
            <p className="mx-auto max-w-[1200px] px-4 text-slate">No places are loaded yet. Run the seed script on the server.</p>
          )}
          {destinations.data?.length > 0 && <Road destinations={destinations.data} />}
        </div>
      </section>

      <section className="mx-auto grid max-w-[1200px] gap-10 px-4 pt-20 lg:grid-cols-[1fr_1.2fr]" aria-labelledby="rank-h">
        <div>
          <h2 id="rank-h" className="text-[32px] font-extrabold">How a place gets ranked</h2>
          <p className="mt-3 max-w-[55ch] text-[17px]">
            First, anything that can’t work is ruled out: too far for the days you have, more than 15% over budget, nothing
            you’re interested in, or arriving after dark when you asked not to. You’ll see what was dropped and why.
          </p>
          <p className="mt-3 max-w-[55ch] text-[17px]">
            What’s left is scored out of 100. Every result shows its own breakdown and how its cost was estimated.
          </p>
        </div>
        <div>
          <div className="flex h-4 overflow-hidden rounded-full" aria-hidden>
            {WEIGHTS.map(([label, w], i) => <div key={label} className={SHADES[i]} style={{ width: `${w}%` }} />)}
          </div>
          <ul className="mt-5 space-y-4">
            {WEIGHTS.map(([label, w, text], i) => (
              <li key={label} className="grid grid-cols-[auto_3rem_1fr] items-baseline gap-3">
                <span className={`size-3 rounded-sm ${SHADES[i]}`} aria-hidden />
                <span className="num font-condensed text-2xl font-extrabold leading-none">
                  {w}<span className="sr-only"> points for</span>
                </span>
                <span>
                  <span className="block font-semibold">{label}</span>
                  <span className="block text-[15px] text-slate">{text}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mx-auto max-w-[1000px] px-4 pt-20" aria-labelledby="trips-h">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 id="trips-h" className="text-[32px] font-extrabold">Trips looking for people</h2>
            <p className="mt-1 text-slate">Ask for a seat. The host approves who comes.</p>
          </div>
          <Link to="/trips" className="btn-outline">All group trips</Link>
        </div>
        <div className="mt-6">
          {trips.isPending && <div className="space-y-3">{[0, 1].map((i) => <div key={i} className="skeleton h-28" />)}</div>}
          {trips.error && <ErrorState error={trips.error} onRetry={trips.refetch} />}
          {trips.data?.length === 0 && <p className="text-slate">No upcoming trips right now. <Link to="/trips/new" className="link">Host the first one</Link>.</p>}
          {trips.data?.length > 0 && <ul className="space-y-3">{trips.data.slice(0, 3).map((t) => <TripRow key={t.id} trip={t} />)}</ul>}
        </div>
      </section>
    </>
  )
}
