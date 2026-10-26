import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useCreateTrip, useDestinations } from '../features/trips/useTrips.js'
import { useMe } from '../features/auth/useAuth.js'
import { useToast } from '../components/Toast.jsx'
import { InlineError, Spinner, fieldErrors } from '../components/States.jsx'

const isoDay = (offset) => {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  return d.toLocaleDateString('en-CA') // YYYY-MM-DD in local time
}

function Field({ label, error, hint, children, id }) {
  return (
    <div>
      <label htmlFor={id} className="field-label">{label}</label>
      {children}
      {(error || hint) && <p className={`mt-1 text-sm ${error ? 'text-signal' : 'text-slate'}`}>{error ?? hint}</p>}
    </div>
  )
}

export default function NewTripPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const toast = useToast()
  const { data: user } = useMe()
  const destinations = useDestinations()
  const create = useCreateTrip()
  const [form, setForm] = useState({
    destination: params.get('destination') ?? '',
    title: '',
    startDate: isoDay(7),
    endDate: isoDay(8),
    mode: 'bus',
    budgetPerPerson: 4000,
    seats: 3,
    womenOnly: false,
    meetingPoint: '',
    description: '',
  })
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))
  const errors = fieldErrors(create.error)
  const canWomenOnly = user?.gender === 'woman'

  // Catch the obvious mistakes before the round trip; the server checks everything again.
  const localError =
    !form.destination ? 'Choose where the trip is going'
      : form.endDate < form.startDate ? 'The end date is before the start date'
        : null

  function onSubmit(e) {
    e.preventDefault()
    if (localError) return
    create.mutate(
      {
        ...form,
        budgetPerPerson: Number(form.budgetPerPerson),
        seats: Number(form.seats),
        meetingPoint: form.meetingPoint.trim() || undefined,
        description: form.description.trim() || undefined,
      },
      {
        onSuccess: (trip) => {
          toast('Trip published')
          navigate(`/trips/${trip.id}`)
        },
      },
    )
  }

  return (
    <section className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-[36px] font-extrabold">Host a trip</h1>
      <p className="mt-1 text-slate">Other travellers can ask for a seat. You approve who comes.</p>

      <form className="mt-8 space-y-5" onSubmit={onSubmit} noValidate>
        <Field id="t-dest" label="Destination" error={errors.destination}>
          <select id="t-dest" className="field" value={form.destination} onChange={(e) => set('destination', e.target.value)} required>
            <option value="" disabled>{destinations.isPending ? 'Loading places' : 'Choose a place'}</option>
            {destinations.data?.map((d) => <option key={d.slug} value={d.slug}>{d.name} (about {d.roadKm} km)</option>)}
          </select>
        </Field>

        <Field id="t-title" label="Trip title" error={errors.title} hint="What would make someone want to come?">
          <input id="t-title" className="field" maxLength={90} value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="Sunrise at Mullayanagiri and estate walks" />
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field id="t-start" label="Start date" error={errors.startDate}>
            <input id="t-start" type="date" className="field" min={isoDay(1)} value={form.startDate}
              onChange={(e) => set('startDate', e.target.value)} />
          </Field>
          <Field id="t-end" label="End date" error={errors.endDate} hint="Up to 14 days">
            <input id="t-end" type="date" className="field" min={form.startDate} value={form.endDate}
              onChange={(e) => set('endDate', e.target.value)} />
          </Field>
        </div>

        <div className="grid gap-5 sm:grid-cols-3">
          <Field id="t-mode" label="Getting there">
            <select id="t-mode" className="field" value={form.mode} onChange={(e) => set('mode', e.target.value)}>
              <option value="bus">Bus</option>
              <option value="car">Car</option>
            </select>
          </Field>
          <Field id="t-budget" label="Budget per person (₹)" error={errors.budgetPerPerson}>
            <input id="t-budget" type="number" inputMode="numeric" min={0} step={100} className="field num" value={form.budgetPerPerson}
              onChange={(e) => set('budgetPerPerson', e.target.value)} />
          </Field>
          <Field id="t-seats" label="Seats for others" error={errors.seats}>
            <input id="t-seats" type="number" inputMode="numeric" min={1} max={15} className="field num" value={form.seats}
              onChange={(e) => set('seats', e.target.value)} />
          </Field>
        </div>

        <Field id="t-meet" label="Meeting point" hint="Optional. A public place is best.">
          <input id="t-meet" className="field" maxLength={120} value={form.meetingPoint} onChange={(e) => set('meetingPoint', e.target.value)} placeholder="Majestic bus stand, platform 18" />
        </Field>

        <Field id="t-desc" label="Plan and expectations" hint="Optional. Pace, sharing rooms, what’s included.">
          <textarea id="t-desc" className="field min-h-28 py-2" maxLength={1200} value={form.description} onChange={(e) => set('description', e.target.value)} />
        </Field>

        <label className={`flex items-start gap-3 rounded-surface border border-line bg-white p-3 ${canWomenOnly ? 'cursor-pointer' : 'opacity-70'}`}>
          <input type="checkbox" className="mt-1 size-4 accent-ghat-900" disabled={!canWomenOnly} checked={form.womenOnly}
            onChange={(e) => set('womenOnly', e.target.checked)} />
          <span>
            <span className="font-semibold">Women only</span>
            <span className="block text-sm text-slate">
              {canWomenOnly
                ? 'Only people registered as women can request a seat.'
                : 'Available to hosts registered as women.'}
            </span>
          </span>
        </label>

        {create.error && !Object.keys(errors).length && <InlineError error={create.error} />}
        {localError && <p className="text-sm text-slate">{localError}</p>}

        <button type="submit" className="btn-go w-full sm:w-auto" disabled={create.isPending || Boolean(localError)}>
          {create.isPending && <Spinner />} Publish trip
        </button>
      </form>
    </section>
  )
}
