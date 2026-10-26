import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useDeletePlan, useMyPlans, usePlan } from '../features/itinerary/useItinerary.js'
import ItineraryEditor from '../features/itinerary/ItineraryEditor.jsx'
import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api.js'
import Photo from '../components/Photo.jsx'
import { EmptyState, ErrorState, InlineError, Spinner } from '../components/States.jsx'
import { plural } from '../lib/format.js'

const updatedFmt = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short' })

function PlanRow({ plan }) {
  const del = useDeletePlan()
  const [confirming, setConfirming] = useState(false)

  return (
    <li className="surface flex flex-col gap-4 p-3 sm:flex-row sm:items-center">
      <Photo image={plan.destination.image} alt="" credit={false} sizes="(min-width: 640px) 96px, 100vw" className="aspect-[16/9] w-full sm:aspect-square sm:w-24" />
      <div className="min-w-0 flex-1">
        <Link to={`/plans/${plan.id}`} className="text-lg font-bold hover:underline">{plan.title}</Link>
        <p className="text-sm text-slate">
          {plan.destination.name}, {plural(plan.days, 'day')} by {plan.mode}, {plural(plan.stops, 'stop')}. Updated {updatedFmt.format(new Date(plan.updatedAt))}
        </p>
        {del.error && <div className="mt-2"><InlineError error={del.error} /></div>}
      </div>
      <div className="flex gap-2">
        {confirming ? (
          <>
            <button type="button" className="btn-outline" onClick={() => setConfirming(false)}>Keep it</button>
            <button type="button" className="btn-danger" disabled={del.isPending} onClick={() => del.mutate(plan.id)}>
              {del.isPending && <Spinner />} Delete plan
            </button>
          </>
        ) : (
          <>
            <button type="button" className="btn-quiet text-slate" onClick={() => setConfirming(true)}>Delete</button>
            <Link to={`/plans/${plan.id}`} className="btn-primary">Open</Link>
          </>
        )}
      </div>
    </li>
  )
}

export function PlansPage() {
  const { data, error, isPending, refetch } = useMyPlans()
  return (
    <section className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-[36px] font-extrabold">My plans</h1>
      <div className="mt-6">
        {isPending && <div className="space-y-3">{[0, 1].map((i) => <div key={i} className="skeleton h-28" />)}</div>}
        {error && <ErrorState error={error} onRetry={refetch} />}
        {data && data.length === 0 && (
          <EmptyState title="No plans yet" action={<Link to="/discover" className="btn-go">Find a place to plan</Link>}>
            Open any place, adjust the draft plan and save it here.
          </EmptyState>
        )}
        {data && data.length > 0 && <ul className="space-y-3">{data.map((p) => <PlanRow key={p.id} plan={p} />)}</ul>}
      </div>
    </section>
  )
}

export function PlanPage() {
  const { id } = useParams()
  const plan = usePlan(id)
  // The editor needs the full destination (all attractions) to edit against.
  const dest = useQuery({
    queryKey: ['destination', plan.data?.destination.slug],
    queryFn: async () => (await api.get(`/destinations/${plan.data.destination.slug}`)).data.destination,
    enabled: Boolean(plan.data),
  })

  if (plan.error) {
    return (
      <section className="mx-auto max-w-3xl px-4 py-10">
        {plan.error.response?.status === 404 ? (
          <EmptyState title="We can’t find that plan" action={<Link to="/plans" className="btn-primary">Go to my plans</Link>}>
            It may have been deleted, or it belongs to another account.
          </EmptyState>
        ) : (
          <ErrorState error={plan.error} onRetry={plan.refetch} />
        )}
      </section>
    )
  }

  return (
    <section className="mx-auto max-w-[1200px] px-4 py-10">
      {plan.data ? (
        <>
          <p className="text-sm text-slate">
            <Link to={`/places/${plan.data.destination.slug}`} className="link">{plan.data.destination.name}</Link>, {plural(plan.data.days, 'day')} by {plan.data.mode}
          </p>
          <h1 className="mt-1 text-[32px] font-extrabold sm:text-[40px]">{plan.data.title}</h1>
        </>
      ) : (
        <div className="skeleton h-12 w-2/3" />
      )}
      <div className="mt-6">
        {dest.error && <ErrorState error={dest.error} onRetry={dest.refetch} />}
        {dest.data && plan.data ? <ItineraryEditor key={plan.data.id} destination={dest.data} saved={plan.data} /> : !dest.error && <div className="skeleton h-80" />}
      </div>
    </section>
  )
}
