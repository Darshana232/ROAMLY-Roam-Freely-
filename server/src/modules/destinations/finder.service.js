// The Trip Finder engine. Pure functions only (no database, no HTTP), so the
// ranking rules can be unit-tested and explained line by line.
//
// For every destination it:
//   1. plans the journey (day travel vs overnight bus, arrival time, hours on the ground)
//   2. estimates a per-person cost with every assumption shown
//   3. drops places that cannot work (too far for the days, over budget, no matching
//      interest, arrives in the dark when the traveller asked to avoid that)
//   4. scores what's left on five weighted factors and explains each one

export const ORIGINS = {
  bengaluru: { name: 'Bengaluru', code: 'BLR' },
};

export const INTERESTS = [
  'hills', 'trekking', 'waterfalls', 'heritage', 'wildlife', 'beach',
  'plantations', 'spiritual', 'lakes', 'food', 'adventure', 'nature',
];

// All money in rupees. These are planning estimates, not quotes, and are
// returned with every result so the UI can show exactly how a number was made.
export const ASSUMPTIONS = {
  speedKmh: { car: 50, bus: 40 },
  cityExitHours: { car: 0.5, bus: 0.75 }, // getting out of Bengaluru traffic
  busFarePerKm: 1.3, // state transport express class, approximate
  carCostPerKm: 9, // fuel plus tolls for a hatchback/sedan
  carSeats: 5,
  stayPerPersonNight: { low: 700, mid: 1300, high: 2200 }, // sharing a room
  soloRoomMultiplier: 1.6, // paying for a room alone
  foodPerDay: { low: 500, mid: 700, high: 900 },
  localPerDay: { bus: 300, car: 100 }, // autos/jeeps vs parking and entry
  dayStart: 8, // sightseeing hours 08:00 to 18:30
  dayEnd: 18.5,
  dayTripDepart: 6.5,
  homeBy: 22,
  overnightDepart: 22.5,
  overnightMinHours: 6, // shorter than this and an overnight bus arrives pre-dawn anyway
  sightseeingHoursPerIdealDay: 8,
  stretchBudget: 1.15, // up to 15% over budget is shown as a stretch, beyond is excluded
};

const WEIGHTS = { interests: 35, time: 25, budget: 20, vibe: 12, practical: 8 };
const A = ASSUMPTIONS;

const round = (n, step = 1) => Math.round(n / step) * step;
const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));

export function formatClock(hours) {
  const minutes = ((round(hours * 60, 5) % 1440) + 1440) % 1440;
  const hh = String(Math.floor(minutes / 60)).padStart(2, '0');
  const mm = String(minutes % 60).padStart(2, '0');
  return `${hh}:${mm}`;
}

const isDark = (clock) => clock >= 19 || clock < 6;

// --- 1. Journey ---------------------------------------------------------

export function planJourney(dest, { days, mode }) {
  const oneWay = dest.roadKm / A.speedKmh[mode] + A.cityExitHours[mode];
  const overnight = mode === 'bus' && days >= 2 && oneWay >= A.overnightMinHours;
  const dayLength = A.dayEnd - A.dayStart;

  let departAt, arriveAt, groundHours;

  if (overnight) {
    // Leave the night before day 1, return on the night of the last day.
    departAt = A.overnightDepart;
    arriveAt = (departAt + oneWay) % 24;
    const firstDayStart = Math.max(A.dayStart, arriveAt + 1); // an hour to settle in
    groundHours = (A.dayEnd - firstDayStart) + dayLength * (days - 1);
  } else if (days === 1) {
    departAt = A.dayTripDepart;
    arriveAt = departAt + oneWay;
    // Sightseeing stops at dusk even if you could stay later and still get home.
    const leaveBy = Math.min(A.dayEnd, A.homeBy - oneWay);
    groundHours = leaveBy - Math.max(arriveAt, A.dayStart - 1);
  } else {
    departAt = A.dayTripDepart;
    arriveAt = departAt + oneWay;
    const firstDay = Math.max(0, A.dayEnd - Math.max(arriveAt, A.dayStart));
    const lastDay = Math.max(0, A.homeBy - oneWay - A.dayStart);
    groundHours = firstDay + dayLength * (days - 2) + Math.min(lastDay, dayLength);
  }

  const needed = dest.idealDays * A.sightseeingHoursPerIdealDay;
  return {
    // > 1 means more time than the place needs; < 1 means rushed.
    surplus: round(groundHours / needed, 0.01),
    mode,
    overnight,
    oneWayHours: round(oneWay, 0.25),
    departAt: formatClock(departAt),
    arriveAt: formatClock(arriveAt),
    arrivesInDark: isDark(arriveAt % 24),
    groundHours: round(Math.max(0, groundHours), 0.5),
    coverage: round(clamp(groundHours / needed, 0, 1), 0.01),
  };
}

// --- 2. Cost --------------------------------------------------------------

export function estimateCost(dest, { days, mode, groupSize, travelStyle }, journey) {
  const tier = dest.costTier;
  const people = groupSize;
  // An overnight bus replaces the night before day 1, so it doesn't add a stay.
  const nights = days - 1;

  let transport;
  if (mode === 'bus') {
    transport = dest.roadKm * 2 * A.busFarePerKm;
  } else {
    const cars = Math.ceil(people / A.carSeats);
    transport = (dest.roadKm * 2 * A.carCostPerKm * cars) / people;
  }

  const solo = travelStyle === 'solo' || people === 1;
  const stay = nights * A.stayPerPersonNight[tier] * (solo ? A.soloRoomMultiplier : 1);
  const food = days * A.foodPerDay[tier];
  const local = days * A.localPerDay[mode];

  const total = transport + stay + food + local;
  return {
    transport: round(transport, 10),
    stay: round(stay, 10),
    food: round(food, 10),
    local: round(local, 10),
    total: round(total, 50),
    nights,
    soloRoom: solo && nights > 0,
    overnightBus: journey.overnight,
  };
}

// --- 3 + 4. Filter, score, explain -----------------------------------------

const hhmm = (h) => {
  const whole = Math.floor(h);
  const mins = round((h - whole) * 60, 5);
  return mins ? `${whole}h ${mins}m` : `${whole}h`;
};
const rupees = (n) => `₹${n.toLocaleString('en-IN')}`;

function scoreBudget(ratio) {
  if (ratio <= 0.7) return 1;
  if (ratio <= 1) return 1 - ((ratio - 0.7) / 0.3) * 0.3; // 1.0 -> 0.7
  return 0.7 - ((ratio - 1) / (A.stretchBudget - 1)) * 0.4; // 0.7 -> 0.3
}

export function evaluate(dest, prefs) {
  const { days, budget, mode, interests, vibe, travelStyle, avoidDarkArrival } = prefs;
  const journey = planJourney(dest, prefs);
  const cost = estimateCost(dest, prefs, journey);
  const ratio = cost.total / budget;
  const matched = interests.filter((i) => dest.interests.includes(i));

  // Hard constraints, checked in the order a person would care about them.
  if (days === 1 && journey.oneWayHours > 4) return { excluded: `${hhmm(journey.oneWayHours)} each way is too far for a day trip` };
  if (journey.groundHours < 3) return { excluded: `Only ${hhmm(journey.groundHours)} there after travel` };
  if (journey.coverage < 0.45) return { excluded: `Needs about ${dest.idealDays} days; ${days} would be mostly travel` };
  if (ratio > A.stretchBudget) return { excluded: `Estimated ${rupees(cost.total)}, over your ${rupees(budget)} budget` };
  if (interests.length && matched.length === 0) return { excluded: 'Doesn’t match the interests you picked' };
  if (avoidDarkArrival && journey.arrivesInDark) return { excluded: `Arrives around ${journey.arriveAt}, after dark` };

  const parts = {
    interests: interests.length ? matched.length / interests.length : 0.6,
    time: timeFit(journey),
    budget: scoreBudget(ratio),
    vibe: vibe === 'hidden' ? (5 - dest.crowd) / 4 : vibe === 'popular' ? (dest.crowd - 1) / 4 : 0.65,
    practical: practicalScore(dest, prefs),
  };
  const breakdown = Object.fromEntries(Object.entries(parts).map(([k, v]) => [k, round(v * WEIGHTS[k], 0.1)]));
  const score = round(Object.values(breakdown).reduce((a, b) => a + b, 0));

  return {
    score,
    breakdown,
    journey,
    cost,
    budgetFit: ratio <= 1 ? 'within' : 'stretch',
    matchedInterests: matched,
    reasons: explain(dest, prefs, { journey, cost, matched, ratio }),
  };
}

// Rushed trips lose points, and so do trips with far more time than the place
// needs (two days at a half-day hill is a poor use of a weekend).
function timeFit({ coverage, surplus }) {
  if (surplus > 1.6) return clamp(1 - (surplus - 1.6) * 0.35, 0.3, 1);
  return coverage;
}

function practicalScore(dest, { mode, travelStyle }) {
  const reachable = mode === 'car' || dest.busFromBlr ? 0.5 : 0;
  // Remoteness matters most when nobody else is relying on you, or you on them.
  const services = dest.remote ? (travelStyle === 'solo' ? 0 : 0.25) : 0.5;
  return reachable + services;
}

function explain(dest, prefs, { journey, cost, matched, ratio }) {
  const r = [];
  const good = (text) => r.push({ tone: 'good', text });
  const warn = (text) => r.push({ tone: 'warn', text });

  if (matched.length) good(`Matches ${matched.join(', ')}`);

  const travel = journey.overnight
    ? `Overnight bus, about ${hhmm(journey.oneWayHours)}, arriving around ${journey.arriveAt}`
    : `About ${hhmm(journey.oneWayHours)} each way by ${prefs.mode}`;
  const ground = `${hhmm(journey.groundHours)} to explore over ${prefs.days} day${prefs.days > 1 ? 's' : ''}`;
  (journey.coverage >= 0.8 ? good : warn)(`${travel}. ${ground}${journey.coverage < 0.8 ? ', so it will feel rushed' : ''}`);
  if (journey.surplus > 1.6) {
    warn(`Usually ${dest.idealDays === 1 ? 'a day trip' : `${dest.idealDays} days`}; ${prefs.days} days may be more than you need`);
  }

  const diff = Math.abs(prefs.budget - cost.total);
  if (ratio <= 1) good(`Estimated ${rupees(cost.total)} per person, ${rupees(round(diff, 50))} under budget`);
  else warn(`Estimated ${rupees(cost.total)} per person, ${rupees(round(diff, 50))} over budget`);

  if (prefs.vibe === 'hidden' && dest.crowd <= 2) good('Rarely crowded, even on weekends');
  if (prefs.vibe === 'hidden' && dest.crowd >= 4) warn('Busy on weekends; go early');
  if (prefs.vibe === 'popular' && dest.crowd >= 4) good('A well-known favourite with plenty of options');

  if (prefs.mode === 'bus') {
    if (dest.busFromBlr) good('Direct buses run from Bengaluru');
    else warn('No direct bus; expect a change or a local taxi');
  }
  if (journey.arrivesInDark) warn(`Arrival around ${journey.arriveAt} is in the dark; plan your pickup`);
  if (dest.remote) warn('Patchy phone signal and few services nearby');

  return r;
}

export function findTrips(destinations, prefs) {
  const results = [];
  const excluded = [];

  for (const dest of destinations) {
    const outcome = evaluate(dest, prefs);
    if (outcome.excluded) excluded.push({ slug: dest.slug, name: dest.name, reason: outcome.excluded });
    else results.push({ destination: dest, ...outcome });
  }

  // Score first; ties go to the cheaper trip.
  results.sort((a, b) => b.score - a.score || a.cost.total - b.cost.total);
  return { results, excluded, assumptions: ASSUMPTIONS };
}
