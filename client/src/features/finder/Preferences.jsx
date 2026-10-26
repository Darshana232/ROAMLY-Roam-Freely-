import { Check, Moon } from 'lucide-react'
import { INTEREST_LABELS } from '../../lib/format.js'

const VIBES = [
  ['any', 'Either'],
  ['hidden', 'Quieter places'],
  ['popular', 'Well-known favourites'],
]

export default function Preferences({ prefs, onChange }) {
  const toggleInterest = (key) => {
    const has = prefs.interests.includes(key)
    if (!has && prefs.interests.length >= 6) return
    onChange({ interests: has ? prefs.interests.filter((i) => i !== key) : [...prefs.interests, key] })
  }

  return (
    <div className="space-y-6">
      <fieldset>
        <legend className="field-label">What do you want to do there?</legend>
        <p className="-mt-1 mb-3 text-sm text-slate">Places must match at least one. Pick up to six.</p>
        <div className="flex flex-wrap gap-2">
          {Object.entries(INTEREST_LABELS).map(([key, label]) => {
            const on = prefs.interests.includes(key)
            return (
              <button key={key} type="button" className="chip" aria-pressed={on} onClick={() => toggleInterest(key)}>
                {on && <Check className="size-3.5" aria-hidden />}
                {label}
              </button>
            )
          })}
        </div>
      </fieldset>

      <fieldset>
        <legend className="field-label">Crowds</legend>
        <div className="inline-flex rounded-control border border-line bg-white p-1" role="radiogroup" aria-label="Crowds">
          {VIBES.map(([v, l]) => (
            <button
              key={v}
              type="button"
              role="radio"
              aria-checked={prefs.vibe === v}
              onClick={() => onChange({ vibe: v })}
              className={`min-h-10 rounded-[6px] px-3 text-sm font-medium transition-colors ${
                prefs.vibe === v ? 'bg-ghat-900 text-white' : 'text-slate hover:text-asphalt'
              }`}
            >
              {l}
            </button>
          ))}
        </div>
      </fieldset>

      <label className="flex cursor-pointer items-start gap-3 rounded-surface border border-line bg-white p-3">
        <input
          type="checkbox"
          className="mt-1 size-4 accent-ghat-900"
          checked={prefs.avoidDarkArrival}
          onChange={(e) => onChange({ avoidDarkArrival: e.target.checked })}
        />
        <span>
          <span className="flex items-center gap-1.5 font-semibold"><Moon className="size-4" aria-hidden /> Arrive in daylight</span>
          <span className="block text-sm text-slate">
            Hide places where the planned bus or drive gets in between 7 pm and 6 am.
          </span>
        </span>
      </label>
    </div>
  )
}
