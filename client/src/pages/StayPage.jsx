import { useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Check, Minus, Star } from 'lucide-react'
import { api } from '../lib/api.js'
import { useMe } from '../features/auth/useAuth.js'
import { Rating } from '../features/stays/StaysList.jsx'
import { EmptyState, ErrorState, InlineError, Spinner, fieldErrors } from '../components/States.jsx'
import { plural, rupees } from '../lib/format.js'

const SAFETY = [
  ['reception24h', 'Reception open 24 hours'],
  ['womenOnlyDorm', 'Women-only dorm'],
  ['cctvCommonAreas', 'CCTV in common areas'],
  ['litAccessRoad', 'Lit road to the entrance'],
]

const reviewDate = new Intl.DateTimeFormat('en-IN', { month: 'long', year: 'numeric' })

function Stepper({ label, value, min, max, onChange }) {
  return (
    <div>
      <p className="field-label">{label}</p>
      <div className="inline-flex items-center rounded-control border border-line bg-white">
        <button type="button" className="btn px-3" aria-label={`Fewer ${label.toLowerCase()}`} disabled={value <= min} onClick={() => onChange(value - 1)}>−</button>
        <span className="num w-8 text-center font-semibold" aria-live="polite">{value}</span>
        <button type="button" className="btn px-3" aria-label={`More ${label.toLowerCase()}`} disabled={value >= max} onClick={() => onChange(value + 1)}>+</button>
      </div>
    </div>
  )
}

function StarInput({ label, value, onChange }) {
  return (
    <fieldset>
      <legend className="field-label">{label}</legend>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <label key={n} className="cursor-pointer p-1">
            <input type="radio" name={label} value={n} checked={value === n} onChange={() => onChange(n)} className="peer sr-only" />
            <Star className={`size-7 peer-focus-visible:outline peer-focus-visible:outline-3 peer-focus-visible:outline-milestone ${n <= value ? 'fill-milestone text-milestone' : 'text-asphalt/25'}`} aria-hidden />
            <span className="sr-only">{n} out of 5</span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}

function ReviewForm({ stayId }) {
  const qc = useQueryClient()
  const [form, setForm] = useState({ rating: 0, safetyRating: 0, text: '' })
  const submit = useMutation({
    mutationFn: (body) => api.post(`/stays/${stayId}/reviews`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['stay', stayId] })
      qc.invalidateQueries({ queryKey: ['eligibility', stayId] })
      qc.invalidateQueries({ queryKey: ['stays'] })
    },
  })
  const errors = fieldErrors(submit.error)
  const missing = !form.rating || !form.safetyRating

  return (
    <form
      className="surface space-y-4 p-4"
      onSubmit={(e) => {
        e.preventDefault()
        if (!missing) submit.mutate(form)
      }}
    >
      <h3 className="text-lg font-bold">Review your stay</h3>
      <StarInput label="Overall" value={form.rating} onChange={(rating) => setForm({ ...form, rating })} />
      <StarInput label="How safe did you feel?" value={form.safetyRating} onChange={(safetyRating) => setForm({ ...form, safetyRating })} />
      <div>
        <label htmlFor="review-text" className="field-label">What should the next traveller know?</label>
        <textarea id="review-text" className="field min-h-28 py-2" maxLength={1500} value={form.text}
          aria-invalid={Boolean(errors.text)} onChange={(e) => setForm({ ...form, text: e.target.value })} />
        <p className={`mt-1 text-sm ${errors.text ? 'text-signal' : 'text-slate'}`}>{errors.text ?? `${form.text.trim().length}/20 characters minimum`}</p>
      </div>
      {submit.error && !errors.text && <InlineError error={submit.error} />}
      <button type="submit" className="btn-go" disabled={submit.isPending || missing || form.text.trim().length < 20}>
        {submit.isPending && <Spinner />} Post review
      </button>
    </form>
  )
}

function ReviewGate({ stayId, destination }) {
  const { data: user } = useMe()
  const location = useLocation()
  const eligibility = useQuery({
    queryKey: ['eligibility', stayId],
    queryFn: async () => (await api.get(`/stays/${stayId}/eligibility`)).data,
    enabled: Boolean(user),
  })

  if (!user) {
    return (
      <p className="text-slate">
        Stayed here on a Roamly trip? <Link to={`/login?next=${encodeURIComponent(location.pathname)}`} className="link">Log in to review it</Link>.
      </p>
    )
  }
  if (eligibility.isPending) return <div className="skeleton h-16" />
  if (eligibility.error) return <InlineError error={eligibility.error} />
  if (eligibility.data.eligible) return <ReviewForm stayId={stayId} />
  if (eligibility.data.reason === 'already-reviewed') return <p className="text-leaf">You’ve reviewed this stay. Thanks.</p>
  return (
    <p className="rounded-control bg-stone-50 p-3 text-[15px] text-slate">
      Reviews come only from people who completed a Roamly trip to {destination.name}, so they can’t be bought or faked.{' '}
      <Link to={`/trips?destination=${destination.slug}`} className="link">Find a trip there</Link>.
    </p>
  )
}

export default function StayPage() {
  const { id } = useParams()
  const [nights, setNights] = useState(2)
  const [guests, setGuests] = useState(2)
  const { data, error, isPending, refetch, isFetching } = useQuery({
    queryKey: ['stay', id, nights, guests],
    queryFn: async () => (await api.get(`/stays/${id}`, { params: { nights, guests } })).data,
    placeholderData: keepPreviousData,
  })

  if (isPending) return <div className="mx-auto max-w-[1000px] px-4 py-10"><div className="skeleton h-96" /></div>
  if (error) {
    return (
      <div className="mx-auto max-w-[1000px] px-4 py-10">
        {error.response?.status === 404
          ? <EmptyState title="We can’t find that stay" action={<Link to="/discover" className="btn-primary">Find a trip</Link>} />
          : <ErrorState error={error} onRetry={refetch} />}
      </div>
    )
  }

  const { stay, reviews } = data
  const q = stay.quote

  return (
    <article className="mx-auto max-w-[1000px] px-4 py-10">
      <p className="text-sm text-slate">
        <Link to={`/places/${stay.destination.slug}`} className="link">{stay.destination.name}</Link>, {stay.area.toLowerCase()}
      </p>
      <h1 className="mt-1 text-[32px] font-extrabold sm:text-[40px]">{stay.name}</h1>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <Rating avg={stay.ratingAvg} count={stay.ratingCount} />
        {stay.safetyAvg && <span className="text-sm text-slate">Felt safe: <span className="num font-semibold text-asphalt">{stay.safetyAvg.toFixed(1)}</span>/5</span>}
        {stay.sample && <span className="rounded-full bg-asphalt/[0.07] px-2 py-0.5 text-xs font-semibold text-slate">Sample listing</span>}
      </div>

      <div className="mt-8 grid gap-8 md:grid-cols-[1fr_340px]">
        <div className="min-w-0 space-y-8">
          <section>
            <h2 className="text-xl font-bold">Safety, as declared by the listing</h2>
            <p className="mt-1 text-sm text-slate">Roamly hasn’t inspected these. Reviews below say how it actually felt.</p>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {SAFETY.map(([k, label]) => (
                <li key={k} className={`flex items-center gap-2 ${stay.safety[k] ? '' : 'text-slate'}`}>
                  {stay.safety[k] ? <Check className="size-4 text-leaf" aria-hidden /> : <Minus className="size-4" aria-hidden />}
                  <span>{label}{!stay.safety[k] && <span className="sr-only"> (not declared)</span>}</span>
                </li>
              ))}
              <li className="flex items-center gap-2"><span className="num font-semibold">{stay.safety.kmFromBusStand} km</span> from the bus stand</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold">Reviews</h2>
            <div className="mt-3"><ReviewGate stayId={stay.id} destination={stay.destination} /></div>
            {reviews.length > 0 && (
              <ul className="mt-5 space-y-4">
                {reviews.map((r) => (
                  <li key={r.id} className="border-t border-line pt-4">
                    <p className="flex flex-wrap items-center gap-x-3 text-sm">
                      <span className="font-semibold">{r.user.name}</span>
                      <span className="text-slate">{reviewDate.format(new Date(r.createdAt))}</span>
                      <span className="text-leaf">Completed a Roamly trip here</span>
                    </p>
                    <p className="mt-1 text-sm">Overall <span className="num font-semibold">{r.rating}</span>/5, felt safe <span className="num font-semibold">{r.safetyRating}</span>/5</p>
                    <p className="mt-2 max-w-[65ch]">{r.text}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <aside className="md:sticky md:top-24 md:self-start">
          <div className="surface p-4">
            <h2 className="text-lg font-bold">Price for your stay</h2>
            <div className="mt-3 flex gap-6">
              <Stepper label="Nights" value={nights} min={1} max={14} onChange={setNights} />
              <Stepper label="Guests" value={guests} min={1} max={12} onChange={setGuests} />
            </div>
            <dl className={`mt-4 space-y-1.5 text-[15px] transition-opacity ${isFetching ? 'opacity-60' : ''}`} aria-busy={isFetching}>
              {q.lines.map((l) => (
                <div key={l.label} className="flex justify-between gap-3"><dt className="text-slate">{l.label}</dt><dd className="num">{rupees(l.amount)}</dd></div>
              ))}
              <div className="flex justify-between gap-3 border-t border-line pt-2 font-bold">
                <dt>Total{q.taxesIncluded ? ', taxes included' : ''}</dt><dd className="num">{rupees(q.total)}</dd>
              </div>
              <div className="flex justify-between gap-3 text-sm text-slate"><dt>Each of {plural(q.guests, 'guest')}</dt><dd className="num">{rupees(q.perPerson)}</dd></div>
            </dl>
            {q.dormTotal && (
              <p className="mt-3 rounded-control bg-ghat-100 p-2.5 text-sm">
                Dorm beds instead: <span className="num font-semibold">{rupees(q.dormTotal)}</span> in total.
              </p>
            )}
            {stay.includes.length > 0 && <p className="mt-3 text-sm text-slate">Includes {stay.includes.join(', ').toLowerCase()}.</p>}
          </div>
        </aside>
      </div>
    </article>
  )
}
