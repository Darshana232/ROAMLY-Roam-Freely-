import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { evaluate, findTrips, planJourney } from '../src/modules/destinations/finder.service.js';

const destinations = JSON.parse(readFileSync(new URL('../src/seed/data/destinations.json', import.meta.url)));
const bySlug = (s) => destinations.find((d) => d.slug === s);

const prefs = (over = {}) => ({
  days: 2, budget: 5000, mode: 'bus', groupSize: 1, travelStyle: 'solo',
  interests: [], vibe: 'any', avoidDarkArrival: false, ...over,
});

test('a day trip never includes places more than 4 hours away', () => {
  const { results } = findTrips(destinations, prefs({ days: 1 }));
  assert.ok(results.length > 0);
  for (const r of results) assert.ok(r.journey.oneWayHours <= 4, `${r.destination.name} is ${r.journey.oneWayHours}h`);
  assert.ok(!results.some((r) => r.destination.slug === 'gokarna'));
});

test('long bus journeys over multiple days become overnight buses', () => {
  const j = planJourney(bySlug('gokarna'), { days: 3, mode: 'bus' });
  assert.equal(j.overnight, true);
  assert.equal(j.departAt, '22:30');
  // Driving yourself is never planned overnight.
  assert.equal(planJourney(bySlug('gokarna'), { days: 3, mode: 'car' }).overnight, false);
});

test('nothing over the stretch budget is returned', () => {
  const { results, excluded } = findTrips(destinations, prefs({ budget: 1500 }));
  for (const r of results) assert.ok(r.cost.total <= 1500 * 1.15);
  assert.ok(excluded.some((e) => /over your/.test(e.reason)));
});

test('picked interests are required and explained', () => {
  const { results } = findTrips(destinations, prefs({ interests: ['beach'], days: 3, budget: 8000 }));
  assert.ok(results.length > 0);
  for (const r of results) {
    assert.ok(r.matchedInterests.includes('beach'));
    assert.ok(r.reasons.some((x) => x.text.includes('beach')));
  }
});

test('avoiding dark arrivals removes pre-dawn overnight arrivals', () => {
  const all = findTrips(destinations, prefs({ days: 2, budget: 10000 }));
  const dark = all.results.filter((r) => r.journey.arrivesInDark);
  assert.ok(dark.length > 0, 'fixture should include at least one dark arrival');

  const safe = findTrips(destinations, prefs({ days: 2, budget: 10000, avoidDarkArrival: true }));
  assert.ok(safe.results.every((r) => !r.journey.arrivesInDark));
});

test('the hidden-gems vibe ranks quiet places above crowded ones', () => {
  const p = prefs({ days: 2, budget: 8000, vibe: 'hidden' });
  const quiet = evaluate(bySlug('agumbe'), { ...p, mode: 'bus' });
  const busy = evaluate(bySlug('chikkamagaluru'), { ...p, mode: 'bus' });
  assert.ok(quiet.breakdown.vibe > busy.breakdown.vibe);
});

test('car costs are shared across the group, bus fares are not', () => {
  const d = bySlug('chikkamagaluru');
  const solo = evaluate(d, prefs({ mode: 'car', groupSize: 1, budget: 20000 }));
  const four = evaluate(d, prefs({ mode: 'car', groupSize: 4, travelStyle: 'friends', budget: 20000 }));
  assert.ok(four.cost.transport < solo.cost.transport / 3);
});
