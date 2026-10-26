import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence, Reorder, motion, useDragControls, useReducedMotion } from 'motion/react'
import { AlertCircle, ArrowDown, ArrowUp, GripVertical, Plus, Sunrise, Sunset, X } from 'lucide-react'
import { stashDraft, takeDraft, useDraft, usePreview, useSavePlan } from './useItinerary.js'
import { useMe } from '../auth/useAuth.js'
import { useToast } from '../../components/Toast.jsx'
import { ErrorState, InlineError, Spinner } from '../../components/States.jsx'
import { duration, minutes } from '../../lib/format.js'

const BEST = {
  sunrise: { icon: Sunrise, label: 'Best at sunrise' },
  sunset: { icon: Sunset, label: 'Best at sunset' },
  morning: { icon: Sunrise, label: 'Best in the morning' },
}

function Stop({ stop, attraction, index, count, day, days, onMove, onMoveDay, onRemove }) {
  const controls = useDragControls()
  const best = BEST[attraction.best]

  return (
    <Reorder.Item
      value={stop.slug}
      dragListener={false}
      dragControls={controls}
      className="relative list-none"
      transition={{ duration: 0.3, ease: [0.2, 0.7, 0.2, 1] }}
    >
      {index > 0 && stop.travelMinutes > 0 && (
        <p className="py-1.5 pl-[4.75rem] text-xs text-slate">{minutes(stop.travelMinutes)} to get here</p>
      )}
      <div className="flex items-stretch gap-3 rounded-surface border border-line bg-white p-3">
        <button
          type="button"
          className="-ml-1 hidden w-6 shrink-0 cursor-grab touch-none items-center justify-center text-slate active:cursor-grabbing sm:flex"
          onPointerDown={(e) => controls.start(e)}
          aria-label={`Drag to reorder ${attraction.name}`}
          tabIndex={-1}
        >
          <GripVertical className="size-5" aria-hidden />
        </button>
        <div className="w-12 shrink-0 text-sm">
          <p className="num font-bold">{stop.start}</p>
          <p className="num text-slate">{stop.end}</p>
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold leading-snug">{attraction.name}</p>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-3 text-sm text-slate">
            <span>About {minutes(attraction.minutes)}</span>
            {best && (
              <span className="inline-flex items-center gap-1"><best.icon className="size-3.5" aria-hidden />{best.label}</span>
            )}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-1">
            <button type="button" className="btn-quiet min-h-9 px-1.5 text-sm" disabled={index === 0} onClick={() => onMove(index, -1)} aria-label={`Move ${attraction.name} earlier`}>
              <ArrowUp className="size-4" aria-hidden />
            </button>
            <button type="button" className="btn-quiet min-h-9 px-1.5 text-sm" disabled={index === count - 1} onClick={() => onMove(index, 1)} aria-label={`Move ${attraction.name} later`}>
              <ArrowDown className="size-4" aria-hidden />
            </button>
            {days > 1 && (
              <select
                className="min-h-9 rounded-control border border-line bg-white px-2 text-sm"
                value={day}
                aria-label={`Move ${attraction.name} to another day`}
                onChange={(e) => onMoveDay(stop.slug, Number(e.target.value))}
              >
                {Array.from({ length: days }, (_, d) => (
                  <option key={d} value={d}>{d === day ? `Day ${d + 1}` : `Move to day ${d + 1}`}</option>
                ))}
              </select>
            )}
            <button type="button" className="btn-quiet ml-auto min-h-9 px-2 text-sm text-slate" onClick={() => onRemove(stop.slug)}>
              <X className="size-4" aria-hidden /> Remove
            </button>
          </div>
        </div>
      </div>
    </Reorder.Item>
  )
}

function Journey({ journey }) {
  if (!journey) return null
  return (
    <p className="text-sm text-slate">
      {journey.overnight
        ? `Overnight ${journey.mode} leaves Bengaluru at ${journey.departAt}, arrives about ${journey.arriveAt}.`
        : `Leave Bengaluru at ${journey.departAt} by ${journey.mode}, arrive about ${journey.arriveAt} (${duration(journey.oneWayHours)}).`}
    </p>
  )
}

export default function ItineraryEditor({ destination, initialDays = 2, initialMode = 'bus', saved }) {
  const reduce = useReducedMotion()
  const navigate = useNavigate()
  const location = useLocation()
  const toast = useToast()
  const { data: user } = useMe()
  const save = useSavePlan()

  const [days, setDays] = useState(saved?.days ?? initialDays)
  const [mode, setMode] = useState(saved?.mode ?? initialMode)
  const [plan, setPlan] = useState(saved?.plan ?? null)
  const [title, setTitle] = useState(saved?.title ?? '')
  const [active, setActive] = useState(0)
  const [dirty, setDirty] = useState(false)
  const [savedNote, setSavedNote] = useState(false)

  // New plans start from the server's draft (or a draft stashed before login).
  const draft = useDraft(destination.slug, days, mode, !saved)
  useEffect(() => {
    if (saved || !draft.data) return
    const stashed = takeDraft(destination.slug)
    if (stashed && stashed.days === days && stashed.mode === mode) {
      setPlan(stashed.plan)
      setTitle(stashed.title ?? '')
      setDirty(true)
    } else {
      setPlan(draft.data.plan)
      setDirty(false)
    }
    setActive(0)
  }, [draft.data]) // eslint-disable-line react-hooks/exhaustive-deps

  const preview = usePreview(destination.slug, days, mode, plan)
  const schedule = preview.data
  const bySlug = useMemo(() => new Map(destination.attractions.map((a) => [a.slug, a])), [destination])

  const edit = (next) => {
    setPlan(next)
    setDirty(true)
    setSavedNote(false)
  }
  const reorderDay = (order) => edit(plan.map((d, i) => (i === active ? order : d)))
  const move = (index, delta) => {
    const day = [...plan[active]]
    const [s] = day.splice(index, 1)
    day.splice(index + delta, 0, s)
    reorderDay(day)
  }
  const moveDay = (slug, to) => edit(plan.map((d, i) => (i === to ? [...d.filter((x) => x !== slug), slug] : d.filter((x) => x !== slug))))
  const remove = (slug) => edit(plan.map((d) => d.filter((x) => x !== slug)))
  const add = (slug) => edit(plan.map((d, i) => (i === active ? [...d, slug] : d)))

  async function onSave() {
    if (!user) {
      stashDraft(destination.slug, { days, mode, plan, title })
      navigate(`/login?next=${encodeURIComponent(location.pathname + location.search + '#plan')}`)
      return
    }
    const body = { plan, title: title.trim() || undefined }
    const result = await save.mutateAsync(saved ? { id: saved.id, ...body } : { ...body, destination: destination.slug, days, mode }).catch(() => null)
    if (!result) return
    setDirty(false)
    if (saved) {
      setSavedNote(true)
    } else {
      toast('Plan saved to My plans')
      navigate(`/plans/${result.id}`)
    }
  }

  // Warn before leaving with unsaved edits to a saved plan.
  useEffect(() => {
    if (!dirty || !saved) return
    const handler = (e) => e.preventDefault()
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [dirty, saved])

  if (!saved && draft.error) return <ErrorState error={draft.error} onRetry={draft.refetch} title="We couldn’t draft a plan" />
  if (!plan) return <div className="skeleton h-80" aria-label="Drafting a plan" />

  const dayInfo = schedule?.days[active]
  const timedStops = dayInfo?.stops ?? []
  const unscheduled = schedule?.unscheduled ?? []

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
      <div className="min-w-0">
        {!saved && (
          <div className="mb-5 flex flex-wrap items-end gap-3">
            <label className="text-sm font-semibold">
              Days
              <select className="field mt-1 w-28" value={days} onChange={(e) => setDays(Number(e.target.value))}>
                {[1, 2, 3, 4].map((d) => <option key={d} value={d}>{d === 1 ? '1 day' : `${d} days`}</option>)}
              </select>
            </label>
            <label className="text-sm font-semibold">
              Getting there
              <select className="field mt-1 w-28" value={mode} onChange={(e) => setMode(e.target.value)}>
                <option value="bus">Bus</option>
                <option value="car">Car</option>
              </select>
            </label>
            {draft.isFetching && <span className="flex items-center gap-2 pb-3 text-sm text-slate"><Spinner /> Drafting</span>}
          </div>
        )}

        <Journey journey={schedule?.journey} />

        <div role="tablist" aria-label="Days" className="mt-4 flex gap-2 overflow-x-auto pb-1">
          {plan.map((d, i) => (
            <button
              key={i}
              role="tab"
              type="button"
              aria-selected={active === i}
              onClick={() => setActive(i)}
              className={`min-h-11 shrink-0 rounded-control border px-4 text-left text-sm transition-colors ${
                active === i ? 'border-ghat-900 bg-ghat-900 text-white' : 'border-line bg-white hover:border-asphalt/30'
              }`}
            >
              <span className="block font-bold">Day {i + 1}</span>
              <span className={active === i ? 'text-white/70' : 'text-slate'}>{d.length === 1 ? '1 stop' : `${d.length} stops`}</span>
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={active}
            role="tabpanel"
            initial={reduce ? false : { opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={reduce ? undefined : { opacity: 0, x: -12 }}
            transition={{ duration: 0.18 }}
            className="mt-4"
          >
            {dayInfo && (
              <p className="mb-3 text-sm text-slate">
                Sightseeing window <span className="num font-semibold text-asphalt">{dayInfo.window.start}–{dayInfo.window.end}</span>
                {preview.isFetching && <span className="ml-3 inline-flex items-center gap-1.5"><Spinner className="size-3.5" /> Updating times</span>}
              </p>
            )}

            {dayInfo?.warnings.length > 0 && (
              <ul className="mb-3 space-y-1 rounded-control bg-amber/[0.08] p-3">
                {dayInfo.warnings.map((w) => (
                  <li key={w} className="flex gap-2 text-sm text-amber"><AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />{w}</li>
                ))}
              </ul>
            )}

            {plan[active].length === 0 ? (
              <p className="rounded-surface border border-dashed border-asphalt/20 p-6 text-center text-slate">
                Nothing planned for day {active + 1}. Add a stop from the list.
              </p>
            ) : (
              <Reorder.Group axis="y" values={plan[active]} onReorder={reorderDay} className="space-y-0">
                {plan[active].map((slug, i) => {
                  const timed = timedStops.find((s) => s.slug === slug) ?? { slug, start: '–', end: '–', travelMinutes: 0 }
                  return (
                    <Stop
                      key={slug}
                      stop={timed}
                      attraction={bySlug.get(slug)}
                      index={i}
                      count={plan[active].length}
                      day={active}
                      days={plan.length}
                      onMove={move}
                      onMoveDay={moveDay}
                      onRemove={remove}
                    />
                  )
                })}
              </Reorder.Group>
            )}
          </motion.div>
        </AnimatePresence>
        {preview.error && <div className="mt-3"><InlineError error={preview.error} /></div>}
      </div>

      <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
        <div className="surface p-4">
          <label htmlFor="plan-title" className="field-label">Plan name</label>
          <input
            id="plan-title"
            className="field"
            maxLength={80}
            placeholder={`${days === 1 ? '1 day' : `${days} days`} in ${destination.name}`}
            value={title}
            onChange={(e) => {
              setTitle(e.target.value)
              setDirty(true)
              setSavedNote(false)
            }}
          />
          <button type="button" className="btn-go mt-3 w-full" onClick={onSave} disabled={save.isPending || (saved && !dirty)}>
            {save.isPending && <Spinner />}
            {!user ? 'Log in to save this plan' : saved ? (dirty ? 'Save changes' : 'All changes saved') : 'Save plan'}
          </button>
          {savedNote && <p className="mt-2 text-sm text-leaf" role="status">Changes saved.</p>}
          {save.error && <div className="mt-2"><InlineError error={save.error} /></div>}
          {saved && <Link to="/plans" className="btn-quiet mt-1 w-full text-sm">Back to my plans</Link>}
        </div>

        <div>
          <h3 className="text-base font-bold">Not in the plan</h3>
          {unscheduled.length === 0 ? (
            <p className="mt-1 text-sm text-slate">Every stop we know here is in your plan.</p>
          ) : (
            <ul className="mt-2 space-y-2">
              {unscheduled.map((slug) => {
                const a = bySlug.get(slug)
                return (
                  <li key={slug} className="flex items-center justify-between gap-2 rounded-control border border-line bg-white p-2 pl-3">
                    <span className="min-w-0 text-sm">
                      <span className="block font-semibold">{a.name}</span>
                      <span className="text-slate">About {minutes(a.minutes)}</span>
                    </span>
                    <button type="button" className="btn-outline min-h-9 shrink-0 px-2.5 text-sm" onClick={() => add(slug)}>
                      <Plus className="size-4" aria-hidden /> Day {active + 1}
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </aside>
    </div>
  )
}
