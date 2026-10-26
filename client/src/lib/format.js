export const rupees = (n) => `₹${Math.round(n).toLocaleString('en-IN')}`

export function duration(hours) {
  const h = Math.floor(hours)
  const m = Math.round((hours - h) * 60)
  if (!h) return `${m}m`
  return m ? `${h}h ${m}m` : `${h}h`
}

export function minutes(total) {
  if (total < 60) return `${total} min`
  return duration(total / 60)
}

// Dates come from the API as UTC midnight for calendar days.
const dayFmt = new Intl.DateTimeFormat('en-IN', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' })
const shortFmt = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', timeZone: 'UTC' })

export const day = (iso) => dayFmt.format(new Date(iso))

export function dateRange(start, end) {
  const s = new Date(start)
  const e = new Date(end)
  if (s.getTime() === e.getTime()) return dayFmt.format(s)
  return `${shortFmt.format(s)} – ${shortFmt.format(e)}`
}

export function nightsBetween(start, end) {
  return Math.round((new Date(end) - new Date(start)) / 86_400_000)
}

export const plural = (n, word, many = `${word}s`) => `${n} ${n === 1 ? word : many}`

export const crowdLabel = (crowd) =>
  ['', 'Rarely crowded', 'Quiet most weekends', 'Moderately busy', 'Busy on weekends', 'Very busy on weekends'][crowd]

export const INTEREST_LABELS = {
  hills: 'Hills',
  trekking: 'Trekking',
  waterfalls: 'Waterfalls',
  heritage: 'Heritage',
  wildlife: 'Wildlife',
  beach: 'Beaches',
  plantations: 'Coffee and tea estates',
  spiritual: 'Temples and spiritual',
  lakes: 'Lakes and backwaters',
  food: 'Food',
  adventure: 'Rafting and adventure',
  nature: 'Forests and nature',
}
