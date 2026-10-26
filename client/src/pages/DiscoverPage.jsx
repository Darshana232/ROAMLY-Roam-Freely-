import { useState } from 'react'
import { SlidersHorizontal } from 'lucide-react'
import { useFinderPrefs, useFinderResults } from '../features/finder/useFinder.js'
import TripSentence from '../features/finder/TripSentence.jsx'
import Preferences from '../features/finder/Preferences.jsx'
import ResultRow from '../features/finder/ResultRow.jsx'
import { EmptyState, ErrorState, Spinner } from '../components/States.jsx'
import { plural, rupees } from '../lib/format.js'

function ResultsSkeleton() {
  return (
    <ul className="space-y-4" aria-hidden>
      {[0, 1, 2].map((i) => (
        <li key={i} className="surface grid gap-5 p-5 md:grid-cols-[120px_240px_1fr]">
          <div className="skeleton h-[150px] w-[120px] rounded-t-full" />
          <div className="skeleton aspect-[4/3]" />
          <div className="space-y-3">
            <div className="skeleton h-7 w-1/2" />
            <div className="skeleton h-4 w-1/3" />
            <div className="skeleton h-4 w-full" />
            <div className="skeleton h-4 w-5/6" />
          </div>
        </li>
      ))}
    </ul>
  )
}

// When nothing fits, offer the specific changes most likely to help.
function NoResults({ prefs, update }) {
  const options = []
  options.push(['Add ₹1,500', { budget: prefs.budget + 1500 }])
  if (prefs.days < 4) options.push([`Make it ${prefs.days + 1} days`, { days: prefs.days + 1 }])
  if (prefs.interests.length) options.push(['Any interest', { interests: [] }])
  if (prefs.avoidDarkArrival) options.push(['Allow night arrivals', { avoidDarkArrival: false }])
  if (prefs.mode === 'bus') options.push(['Go by car', { mode: 'car' }])

  return (
    <EmptyState
      title={`Nothing fits ${plural(prefs.days, 'day')} and ${rupees(prefs.budget)} yet`}
      action={
        <div className="flex flex-wrap justify-center gap-2">
          {options.map(([label, patch]) => (
            <button key={label} type="button" className="btn-outline" onClick={() => update(patch)}>{label}</button>
          ))}
        </div>
      }
    >
      Every place we know was ruled out. The list below says why; one of these changes usually opens things up.
    </EmptyState>
  )
}

function Excluded({ items }) {
  if (!items.length) return null
  return (
    <details className="group mt-8 rounded-surface border border-line bg-white p-4">
      <summary className="cursor-pointer list-none font-semibold marker:hidden">
        <span className="underline decoration-line underline-offset-4 group-open:no-underline">
          {plural(items.length, 'place')} didn’t fit
        </span>
        <span className="ml-2 font-normal text-slate">See why</span>
      </summary>
      <ul className="mt-3 grid gap-x-8 gap-y-1.5 sm:grid-cols-2">
        {items.map((e) => (
          <li key={e.slug} className="text-sm">
            <span className="font-semibold">{e.name}</span> <span className="text-slate">{e.reason}</span>
          </li>
        ))}
      </ul>
    </details>
  )
}

export default function DiscoverPage() {
  const [prefs, update] = useFinderPrefs()
  const { data, error, isPending, isFetching, refetch, isPlaceholderData } = useFinderResults(prefs)
  const [showPrefs, setShowPrefs] = useState(false)
  const activeCount = prefs.interests.length + (prefs.vibe !== 'any') + prefs.avoidDarkArrival

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-8 lg:py-12">
      <h1 className="sr-only">Find a trip from Bengaluru</h1>
      <TripSentence prefs={prefs} onChange={update} className="max-w-4xl text-[26px] sm:text-[34px]" />

      <div className="mt-8 grid gap-8 lg:grid-cols-[300px_1fr]">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <button
            type="button"
            className="btn-outline w-full lg:hidden"
            aria-expanded={showPrefs}
            aria-controls="prefs"
            onClick={() => setShowPrefs((s) => !s)}
          >
            <SlidersHorizontal className="size-4" aria-hidden />
            Interests and preferences{activeCount ? ` (${activeCount})` : ''}
          </button>
          <div id="prefs" className={`${showPrefs ? 'mt-4 block' : 'hidden'} lg:mt-0 lg:block`}>
            <Preferences prefs={prefs} onChange={update} />
          </div>
        </aside>

        <section aria-labelledby="results-heading" aria-busy={isFetching}>
          <div className="mb-4 flex min-h-8 items-center justify-between gap-4">
            <h2 id="results-heading" className="text-xl font-bold" aria-live="polite">
              {data ? `${plural(data.results.length, 'place')} that fit` : 'Finding places that fit'}
            </h2>
            {isFetching && isPlaceholderData && (
              <span className="flex items-center gap-2 text-sm text-slate"><Spinner /> Re-ranking</span>
            )}
          </div>

          {isPending && <ResultsSkeleton />}
          {error && !data && <ErrorState error={error} onRetry={refetch} title="We couldn’t rank places right now" />}
          {data && (
            <>
              {data.results.length ? (
                <ul className={`space-y-4 transition-opacity ${isPlaceholderData ? 'opacity-60' : ''}`}>
                  {data.results.map((r, i) => (
                    <ResultRow key={r.destination.slug} result={r} prefs={data.prefs} rank={i} />
                  ))}
                </ul>
              ) : (
                <NoResults prefs={prefs} update={update} />
              )}
              <Excluded items={data.excluded} />
              <p className="mt-6 max-w-3xl text-sm text-slate">
                Times assume {prefs.mode === 'bus' ? 'state buses averaging 40 km/h' : 'driving at 50 km/h'} plus time to
                get out of Bengaluru. Costs use typical budget prices and are estimates, not quotes.
              </p>
            </>
          )}
        </section>
      </div>
    </div>
  )
}
