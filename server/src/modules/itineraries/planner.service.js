// Itinerary planner. Pure functions, like the finder.
//
//   draftPlan()  builds a first day-by-day plan from a destination's attractions
//   timeline()   turns any ordering of stops (generated or user-edited) into
//                timed stops with travel gaps and honest warnings
//
// The server always recomputes the timeline, so a saved itinerary can never
// claim a schedule that its own rules say is impossible.
import { ASSUMPTIONS, formatClock, planJourney } from '../destinations/finder.service.js';

const toHours = (hhmm) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h + m / 60;
};

export function distanceKm(a, b) {
  if (!a || !b) return 0;
  const R = 6371;
  const rad = (d) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// Straight-line distance x 1.4 for winding local roads, at 30 km/h, and never
// less than 15 minutes (parking, tickets, finding the way).
export function travelMinutes(a, b) {
  if (!a || !b) return 20;
  return Math.max(15, Math.round(((distanceKm(a, b) * 1.4) / 30) * 60 / 5) * 5);
}

// The usable sightseeing window for each day, from the same journey model
// the finder uses, so both features agree on what a day looks like.
export function dayWindows(dest, { days, mode }) {
  const j = planJourney(dest, { days, mode });
  const arrive = toHours(j.arriveAt);
  const windows = [];
  for (let d = 0; d < days; d++) {
    let start = ASSUMPTIONS.dayStart;
    let end = ASSUMPTIONS.dayEnd;
    if (d === 0) start = j.overnight ? Math.max(start, arrive + 1) : Math.max(start, arrive);
    if (d === days - 1 && !j.overnight) end = Math.min(end, ASSUMPTIONS.homeBy - j.oneWayHours);
    windows.push({ start, end: Math.max(start, end) });
  }
  return { windows, journey: j };
}

// Sunrise viewpoints get an early slot before the regular day starts.
const SUNRISE_AT = 6;
const SUNSET_AT = 18;

export function timeline(dest, stopsByDay, windows) {
  const bySlug = new Map(dest.attractions.map((a) => [a.slug, a]));

  return stopsByDay.map((slugs, i) => {
    const win = windows[i];
    const stops = [];
    const warnings = [];
    let clock = win.start;
    let prev = null;

    slugs.forEach((slug, idx) => {
      const a = bySlug.get(slug);
      if (!a) return;
      const gap = prev ? travelMinutes(prev.coords, a.coords) : 0;
      let start = clock + gap / 60;

      if (a.best === 'sunrise' && idx === 0 && i > 0) start = SUNRISE_AT;
      if (a.best === 'sunset') start = Math.max(start, SUNSET_AT - a.minutes / 60);
      if (a.hours) start = Math.max(start, toHours(a.hours.open));

      const end = start + a.minutes / 60;
      if (a.hours && end > toHours(a.hours.close)) {
        warnings.push(`${a.name} closes at ${a.hours.close}`);
      }
      if (a.best === 'sunrise' && start > 7) warnings.push(`${a.name} is best at sunrise`);

      stops.push({ slug, name: a.name, start: formatClock(start), end: formatClock(end), travelMinutes: gap, best: a.best });
      clock = end;
      prev = a;
    });

    if (clock > win.end + 0.01) {
      warnings.push(`Runs until ${formatClock(clock)}, past the ${formatClock(win.end)} finish for this day`);
    }
    return { day: i + 1, window: { start: formatClock(win.start), end: formatClock(win.end) }, stops, warnings };
  });
}

// Greedy draft: each day takes a sunrise/morning stop first if one is left,
// then the nearest remaining stop that still fits, and keeps a sunset stop
// for the end of the day when there is room for it.
export function draftPlan(dest, { days, mode }) {
  const { windows, journey } = dayWindows(dest, { days, mode });
  const remaining = [...dest.attractions];
  const plan = [];
  // Spread the sightseeing roughly evenly instead of cramming day 1.
  const share = (dest.attractions.reduce((sum, a) => sum + a.minutes, 0) / 60 / windows.length) * 1.15;

  const take = (a) => remaining.splice(remaining.indexOf(a), 1)[0];

  windows.forEach((win, dayIndex) => {
    const day = [];
    let clock = win.start;
    let here = null;
    let planned = 0;
    const isLast = dayIndex === windows.length - 1;

    const fits = (a) => {
      const gap = here ? travelMinutes(here.coords, a.coords) / 60 : 0;
      let start = clock + gap;
      if (a.hours) start = Math.max(start, toHours(a.hours.open));
      const end = start + a.minutes / 60;
      return end <= win.end && (!a.hours || end <= toHours(a.hours.close)) ? end : null;
    };
    const add = (a, end) => {
      day.push(take(a).slug);
      clock = end;
      here = a;
      planned += a.minutes / 60;
    };

    // Sunrise spots open a later day (the timeline starts them at dawn); on
    // the arrival day only a plain "morning" stop can lead.
    if (dayIndex > 0) {
      const sunrise = remaining.find((a) => a.best === 'sunrise');
      if (sunrise) {
        day.push(take(sunrise).slug);
        here = sunrise;
        planned += sunrise.minutes / 60;
        clock = Math.max(clock, SUNRISE_AT + sunrise.minutes / 60);
      }
    }
    const morning = remaining.find((a) => a.best === 'morning' || (dayIndex > 0 && a.best === 'sunrise'));
    if (!day.length && morning && win.start <= 10 && fits(morning)) add(morning, fits(morning));

    const sunset = remaining.find((a) => a.best === 'sunset');
    // Leave room for the evening stop, including getting to it.
    const reserve = sunset ? sunset.minutes / 60 + 1.5 : 0;
    const sunsetShare = sunset ? sunset.minutes / 60 : 0;

    for (;;) {
      const candidates = remaining
        .filter((a) => a !== sunset && (a.best !== 'sunrise' || isLast))
        // Stay within this day's share, unless it's the last day or the day is empty.
        .filter((a) => isLast || !day.length || planned + sunsetShare + a.minutes / 60 <= share)
        .map((a) => ({ a, end: fits(a) }))
        .filter(({ end }) => end !== null && end <= win.end - reserve);
      if (!candidates.length) break;
      candidates.sort((x, y) => travelMinutes(here?.coords, x.a.coords) - travelMinutes(here?.coords, y.a.coords));
      add(candidates[0].a, candidates[0].end);
    }

    if (sunset && remaining.includes(sunset)) {
      const end = Math.max(fits(sunset) ?? Infinity, SUNSET_AT);
      if (end <= win.end + 0.01) add(sunset, end);
    }
    plan.push(day);
  });

  return { plan, unscheduled: remaining.map((a) => a.slug), journey, windows };
}
