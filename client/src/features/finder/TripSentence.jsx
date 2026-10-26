import { useEffect, useState } from 'react'
import { ChevronDown } from 'lucide-react'

const DAYS = [1, 2, 3, 4].map((d) => [d, d === 1 ? '1 day' : `${d} days`])
const STYLES = [
  ['solo', 'solo'],
  ['couple', 'as a couple'],
  ['friends', 'with friends'],
  ['open-group', 'with people I’ll meet'],
]
const MODES = [
  ['bus', 'bus'],
  ['car', 'car'],
]

// An inline select that reads as part of the sentence. Still a native
// <select>, so keyboard, screen reader and mobile pickers all just work.
function Blank({ label, value, options, onChange, tone }) {
  return (
    <span className="relative inline-flex items-baseline">
      <select
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`cursor-pointer appearance-none bg-transparent pr-[0.9em] font-bold underline decoration-milestone decoration-[0.12em] underline-offset-[0.18em] outline-none [field-sizing:content] ${
          tone === 'dark' ? 'text-white' : 'text-asphalt'
        }`}
      >
        {options.map(([v, l]) => (
          <option key={v} value={v} className="text-base text-asphalt">{l}</option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-0 top-1/2 size-[0.6em] -translate-y-1/3 opacity-60" aria-hidden />
    </span>
  )
}

// Typing a budget shouldn't fire a search per keystroke; commit on pause or blur.
function BudgetBlank({ value, onChange, tone }) {
  const [draft, setDraft] = useState(String(value))
  useEffect(() => setDraft(String(value)), [value])

  useEffect(() => {
    const n = Number(draft)
    if (!Number.isFinite(n) || n === value || n < 500) return
    const t = setTimeout(() => onChange(Math.min(100000, Math.round(n))), 600)
    return () => clearTimeout(t)
  }, [draft]) // eslint-disable-line react-hooks/exhaustive-deps

  const invalid = Number(draft) < 500 || !Number.isFinite(Number(draft))

  return (
    <span className="inline-flex items-baseline">
      <span aria-hidden>₹</span>
      <input
        aria-label="Budget per person in rupees"
        aria-invalid={invalid}
        inputMode="numeric"
        value={draft}
        onChange={(e) => setDraft(e.target.value.replace(/[^\d]/g, '').slice(0, 6))}
        onBlur={() => invalid && setDraft(String(value))}
        style={{ width: `${Math.max(3, draft.length) + 0.4}ch` }}
        className={`num bg-transparent font-bold underline decoration-[0.12em] underline-offset-[0.18em] outline-none ${
          invalid ? 'decoration-signal' : 'decoration-milestone'
        } ${tone === 'dark' ? 'text-white' : 'text-asphalt'}`}
      />
    </span>
  )
}

export default function TripSentence({ prefs, onChange, tone = 'light', className = '' }) {
  const group = prefs.travelStyle === 'friends' || prefs.travelStyle === 'open-group'
  const sizes = Array.from({ length: 11 }, (_, i) => [i + 2, String(i + 2)])

  return (
    <p className={`font-wide leading-[1.5] ${className}`}>
      I have{' '}
      <Blank label="Days" tone={tone} value={prefs.days} options={DAYS} onChange={(v) => onChange({ days: Number(v) })} /> and{' '}
      <BudgetBlank tone={tone} value={prefs.budget} onChange={(v) => onChange({ budget: v })} /> each, going{' '}
      <Blank label="Travelling as" tone={tone} value={prefs.travelStyle} options={STYLES} onChange={(v) => onChange({ travelStyle: v })} />
      {group && (
        <>
          {' '}(<Blank label="Group size" tone={tone} value={prefs.groupSize} options={sizes} onChange={(v) => onChange({ groupSize: Number(v) })} /> of us)
        </>
      )}{' '}
      by <Blank label="Travel mode" tone={tone} value={prefs.mode} options={MODES} onChange={(v) => onChange({ mode: v })} />.
    </p>
  )
}
