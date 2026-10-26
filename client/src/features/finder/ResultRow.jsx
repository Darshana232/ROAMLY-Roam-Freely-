import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'motion/react'
import { AlertCircle, Bus, Car, CheckCircle2, ChevronDown } from 'lucide-react'
import Milestone from '../../components/Milestone.jsx'
import Photo from '../../components/Photo.jsx'
import { duration, plural, rupees } from '../../lib/format.js'

const FACTORS = [
  ['interests', 'Interests', 35],
  ['time', 'Time there', 25],
  ['budget', 'Budget', 20],
  ['vibe', 'Crowds', 12],
  ['practical', 'Getting there', 8],
]

function ScoreBreakdown({ breakdown }) {
  return (
    <dl className="grid gap-1.5">
      {FACTORS.map(([key, label, max]) => (
        <div key={key} className="grid grid-cols-[7.5rem_1fr_3.5rem] items-center gap-3 text-sm">
          <dt className="text-slate">{label}</dt>
          <dd className="h-2 overflow-hidden rounded-full bg-asphalt/[0.07]">
            <div className="h-full rounded-full bg-ghat-700" style={{ width: `${(breakdown[key] / max) * 100}%` }} />
          </dd>
          <dd className="num text-right text-slate">{Math.round(breakdown[key])}/{max}</dd>
        </div>
      ))}
    </dl>
  )
}

function CostBreakdown({ cost, prefs }) {
  const rows = [
    [prefs.mode === 'bus' ? 'Bus fares, return' : 'Fuel and tolls, your share', cost.transport],
    [cost.nights ? `${plural(cost.nights, 'night')} stay${cost.soloRoom ? ', room to yourself' : ', sharing a room'}` : 'No overnight stay', cost.stay],
    ['Food', cost.food],
    [prefs.mode === 'bus' ? 'Autos and local transport' : 'Parking and entry', cost.local],
  ]
  return (
    <dl className="grid gap-1 text-sm">
      {rows.map(([label, amount]) => (
        <div key={label} className="flex justify-between gap-4">
          <dt className="text-slate">{label}</dt>
          <dd className="num">{rupees(amount)}</dd>
        </div>
      ))}
      {cost.overnightBus && <p className="text-slate">The overnight bus replaces one night’s stay.</p>}
    </dl>
  )
}

function Disclosure({ label, children }) {
  const [open, setOpen] = useState(false)
  return (
    <div>
      <button type="button" aria-expanded={open} onClick={() => setOpen((o) => !o)} className="flex min-h-9 items-center gap-1 text-sm font-semibold text-ghat-700">
        {label}
        <ChevronDown className={`size-4 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden />
      </button>
      {open && <div className="mt-2 rounded-control bg-stone-50 p-3">{children}</div>}
    </div>
  )
}

export default function ResultRow({ result, prefs, rank }) {
  const reduce = useReducedMotion()
  const { destination: d, journey, cost, reasons, score, breakdown, budgetFit } = result
  const ModeIcon = journey.mode === 'bus' ? Bus : Car
  const planHref = `/places/${d.slug}?days=${prefs.days}&mode=${prefs.mode}#plan`

  return (
    <motion.li
      layout={reduce ? false : 'position'}
      transition={{ duration: 0.3, ease: [0.2, 0.7, 0.2, 1] }}
      className="surface grid gap-5 p-4 sm:p-5 md:grid-cols-[auto_minmax(0,240px)_1fr]"
    >
      <div className="flex items-start gap-4 md:flex-col md:items-center">
        <Milestone name={d.name} km={d.roadKm} size="md" />
        <div className="md:text-center">
          <p className="num text-[28px] font-extrabold leading-none text-ghat-900">{score}</p>
          <p className="text-xs text-slate">match out of 100</p>
          {rank === 0 && <p className="mt-1 text-xs font-semibold text-leaf">Best fit</p>}
        </div>
      </div>

      <Photo image={d.image} alt={d.name} className="aspect-[4/3] w-full" sizes="(min-width: 768px) 240px, 100vw" />

      <div className="min-w-0">
        <h3 className="text-[26px] font-extrabold">
          <Link to={`/places/${d.slug}`} className="hover:underline">{d.name}</Link>
        </h3>
        <p className="text-sm text-slate">{d.region}</p>

        <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[15px]">
          <span className="inline-flex items-center gap-1.5">
            <ModeIcon className="size-4 text-slate" aria-hidden />
            {journey.overnight ? 'Overnight, leave' : 'Leave'} <span className="num font-semibold">{journey.departAt}</span>
          </span>
          <span>
            arrive <span className={`num font-semibold ${journey.arrivesInDark ? 'text-amber' : ''}`}>{journey.arriveAt}</span>
          </span>
          <span className="text-slate">{duration(journey.oneWayHours)} each way</span>
        </p>

        <ul className="mt-3 space-y-1.5">
          {reasons.map((r) => (
            <li key={r.text} className="flex gap-2 text-[15px]">
              {r.tone === 'good' ? (
                <CheckCircle2 className="mt-1 size-4 shrink-0 text-leaf" aria-label="Fits" />
              ) : (
                <AlertCircle className="mt-1 size-4 shrink-0 text-amber" aria-label="Heads up" />
              )}
              <span>{r.text}</span>
            </li>
          ))}
        </ul>

        <div className="mt-4 flex flex-wrap items-end justify-between gap-4 border-t border-line pt-4">
          <div>
            <p className="num text-[26px] font-extrabold leading-none">
              {rupees(cost.total)}
              <span className="ml-1.5 text-sm font-medium text-slate">estimated per person</span>
            </p>
            {budgetFit === 'stretch' && <p className="mt-1 text-sm text-amber">A little over your budget</p>}
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to={`/trips?destination=${d.slug}`} className="btn-outline">Group trips</Link>
            <Link to={planHref} className="btn-primary">Plan the days</Link>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-x-6">
          <Disclosure label="How the cost was estimated"><CostBreakdown cost={cost} prefs={prefs} /></Disclosure>
          <Disclosure label="How the score was worked out"><ScoreBreakdown breakdown={breakdown} /></Disclosure>
        </div>
      </div>
    </motion.li>
  )
}
