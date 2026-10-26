import { after, before, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { api, isoDay, newUser, startDb, stopDb } from './helpers.js';
import { Trip } from '../src/modules/trips/trip.model.js';

before(startDb);
after(stopDb);

describe('auth', () => {
  test('register, read session, log out', async () => {
    const { agent, user } = await newUser();
    const me = await agent.get('/api/auth/me');
    assert.equal(me.status, 200);
    assert.equal(me.body.user.email, user.email);
    assert.equal(me.body.user.passwordHash, undefined);

    assert.equal((await agent.post('/api/auth/logout')).status, 204);
    assert.equal((await agent.get('/api/auth/me')).body.user, null);
    assert.equal((await agent.get('/api/itineraries')).status, 401);
  });

  test('duplicate email is rejected and wrong password gives one generic error', async () => {
    const { body } = await newUser();
    const dup = await api().post('/api/auth/register').send(body);
    assert.equal(dup.status, 409);

    const wrong = await api().post('/api/auth/login').send({ email: body.email, password: 'nope-nope-nope' });
    const unknown = await api().post('/api/auth/login').send({ email: 'ghost@example.com', password: 'nope-nope-nope' });
    assert.equal(wrong.status, 401);
    assert.equal(unknown.body.error.message, wrong.body.error.message);
  });

  test('invalid input returns field-level messages', async () => {
    const res = await api().post('/api/auth/register').send({ name: 'A', email: 'not-an-email', password: 'short' });
    assert.equal(res.status, 400);
    const fields = res.body.error.details.map((d) => d.field).sort();
    assert.deepEqual(fields, ['email', 'name', 'password']);
  });
});

describe('finder API', () => {
  test('returns ranked, explained results and validates input', async () => {
    const res = await api().get('/api/destinations/search?days=1&budget=2000&mode=bus&interests=heritage');
    assert.equal(res.status, 200);
    assert.ok(res.body.results.length > 0);
    const scores = res.body.results.map((r) => r.score);
    assert.deepEqual(scores, [...scores].sort((a, b) => b - a));
    assert.ok(res.body.results[0].reasons.length > 0);

    const bad = await api().get('/api/destinations/search?days=9&interests=parties');
    assert.equal(bad.status, 400);
  });
});

describe('itineraries', () => {
  test('draft, save, reload, and keep it private', async () => {
    const draft = await api().get('/api/itineraries/draft?destination=hampi&days=2&mode=bus');
    assert.equal(draft.status, 200);
    assert.equal(draft.body.plan.length, 2);

    const { agent } = await newUser();
    const saved = await agent.post('/api/itineraries').send({ destination: 'hampi', days: 2, mode: 'bus', plan: draft.body.plan });
    assert.equal(saved.status, 201);
    const id = saved.body.itinerary.id;

    // Persisted: a fresh read returns the same plan.
    const reread = await agent.get(`/api/itineraries/${id}`);
    assert.deepEqual(reread.body.itinerary.plan, draft.body.plan);

    // Reordering is saved and the server recomputes times.
    const reordered = draft.body.plan.map((d) => [...d].reverse());
    const patched = await agent.patch(`/api/itineraries/${id}`).send({ plan: reordered });
    assert.equal(patched.status, 200);
    assert.deepEqual(patched.body.itinerary.plan, reordered);

    const stranger = await newUser();
    assert.equal((await stranger.agent.get(`/api/itineraries/${id}`)).status, 404);
    assert.equal((await stranger.agent.delete(`/api/itineraries/${id}`)).status, 404);
    assert.equal((await api().get(`/api/itineraries/${id}`)).status, 401);
  });

  test('rejects stops from another destination, duplicates and wrong day counts', async () => {
    const { agent } = await newUser();
    const foreign = await agent.post('/api/itineraries').send({ destination: 'hampi', days: 1, mode: 'bus', plan: [['abbey-falls']] });
    assert.equal(foreign.status, 400);
    const dup = await agent.post('/api/itineraries').send({ destination: 'hampi', days: 1, mode: 'bus', plan: [['matanga-hill', 'matanga-hill']] });
    assert.equal(dup.status, 400);
    const days = await agent.post('/api/itineraries').send({ destination: 'hampi', days: 2, mode: 'bus', plan: [['matanga-hill']] });
    assert.equal(days.status, 400);
  });
});

const tripBody = (over = {}) => ({
  destination: 'chikkamagaluru', title: 'Test weekend trip', startDate: isoDay(10), endDate: isoDay(11),
  mode: 'bus', budgetPerPerson: 4000, seats: 2, ...over,
});

describe('group trips', () => {
  test('date rules and women-only hosting are enforced', async () => {
    const { agent } = await newUser({ gender: 'man' });
    assert.equal((await agent.post('/api/trips').send(tripBody({ startDate: isoDay(-1), endDate: isoDay(0) }))).status, 400);
    assert.equal((await agent.post('/api/trips').send(tripBody({ startDate: isoDay(5), endDate: isoDay(4) }))).status, 400);
    assert.equal((await agent.post('/api/trips').send(tripBody({ endDate: isoDay(30) }))).status, 400);
    assert.equal((await agent.post('/api/trips').send(tripBody({ womenOnly: true }))).status, 403);
  });

  test('simultaneous duplicate join requests create only one request', async () => {
    const host = await newUser();
    const trip = (await host.agent.post('/api/trips').send(tripBody())).body.trip;
    const guest = await newUser();

    const [a, b] = await Promise.all([
      guest.agent.post(`/api/trips/${trip.id}/requests`).send({}),
      guest.agent.post(`/api/trips/${trip.id}/requests`).send({}),
    ]);
    assert.deepEqual([a.status, b.status].sort(), [201, 409]);

    // The host can't join their own trip.
    assert.equal((await host.agent.post(`/api/trips/${trip.id}/requests`).send({})).status, 400);
  });

  test('approving at the same moment can never overfill a trip', async () => {
    const host = await newUser();
    const trip = (await host.agent.post('/api/trips').send(tripBody({ seats: 1, startDate: isoDay(40), endDate: isoDay(41) }))).body.trip;

    const guests = await Promise.all([newUser(), newUser(), newUser()]);
    for (const g of guests) await g.agent.post(`/api/trips/${trip.id}/requests`).send({});
    const { requests } = (await host.agent.get(`/api/trips/${trip.id}`)).body.trip;

    const results = await Promise.all(
      requests.map((r) => host.agent.post(`/api/trips/${trip.id}/requests/${r.id}/approve`)),
    );
    assert.equal(results.filter((r) => r.status === 200).length, 1);
    assert.ok(results.filter((r) => r.status !== 200).every((r) => r.status === 409));

    const stored = await Trip.findById(trip.id).lean();
    assert.equal(stored.seatsTaken, 1);
  });

  test('only the host can approve, and withdrawing frees the seat', async () => {
    const host = await newUser();
    const trip = (await host.agent.post('/api/trips').send(tripBody({ startDate: isoDay(50), endDate: isoDay(51) }))).body.trip;
    const guest = await newUser();
    const req = (await guest.agent.post(`/api/trips/${trip.id}/requests`).send({})).body.request;

    const intruder = await newUser();
    assert.equal((await intruder.agent.post(`/api/trips/${trip.id}/requests/${req.id}/approve`)).status, 404);
    assert.equal((await guest.agent.post(`/api/trips/${trip.id}/requests/${req.id}/approve`)).status, 404);

    assert.equal((await host.agent.post(`/api/trips/${trip.id}/requests/${req.id}/approve`)).status, 200);
    assert.equal((await Trip.findById(trip.id).lean()).seatsTaken, 1);

    assert.equal((await guest.agent.delete(`/api/trips/${trip.id}/requests/mine`)).status, 204);
    assert.equal((await Trip.findById(trip.id).lean()).seatsTaken, 0);
  });

  test('women-only trips refuse requests from anyone not registered as a woman', async () => {
    const host = await newUser({ gender: 'woman' });
    const trip = (await host.agent.post('/api/trips').send(tripBody({ womenOnly: true, startDate: isoDay(60), endDate: isoDay(61) }))).body.trip;
    const man = await newUser({ gender: 'man' });
    const woman = await newUser({ gender: 'woman' });
    assert.equal((await man.agent.post(`/api/trips/${trip.id}/requests`).send({})).status, 403);
    assert.equal((await woman.agent.post(`/api/trips/${trip.id}/requests`).send({})).status, 201);
  });

  test('you cannot be on two overlapping trips', async () => {
    const host = await newUser();
    assert.equal((await host.agent.post('/api/trips').send(tripBody({ startDate: isoDay(70), endDate: isoDay(72) }))).status, 201);
    assert.equal((await host.agent.post('/api/trips').send(tripBody({ startDate: isoDay(72), endDate: isoDay(73) }))).status, 409);
  });
});

describe('stays and reviews', () => {
  test('only travellers with a completed trip can review, once', async () => {
    const stays = (await api().get('/api/stays?destination=kabini')).body.stays;
    const stay = stays[0];
    const review = { rating: 4, safetyRating: 5, text: 'Clean rooms, helpful staff, well lit path from the road.' };

    const { agent, user } = await newUser();
    assert.equal((await agent.get(`/api/stays/${stay.id}/eligibility`)).body.eligible, false);
    assert.equal((await agent.post(`/api/stays/${stay.id}/reviews`).send(review)).status, 403);

    // Give this user a finished trip to Kabini (past trips can't be made via the API).
    const kabini = (await api().get('/api/destinations/kabini')).body.destination;
    await Trip.create({
      host: new mongoose.Types.ObjectId(user.id), destination: kabini._id, title: 'Past Kabini trip',
      startDate: new Date(isoDay(-10)), endDate: new Date(isoDay(-9)), mode: 'car', budgetPerPerson: 5000, seats: 2,
    });

    assert.equal((await agent.get(`/api/stays/${stay.id}/eligibility`)).body.eligible, true);
    assert.equal((await agent.post(`/api/stays/${stay.id}/reviews`).send(review)).status, 201);
    assert.equal((await agent.post(`/api/stays/${stay.id}/reviews`).send(review)).status, 409);

    const detail = (await api().get(`/api/stays/${stay.id}`)).body;
    assert.equal(detail.stay.ratingCount, 1);
    assert.equal(detail.stay.ratingAvg, 4);
    assert.equal(detail.reviews.length, 1);
  });

  test('price quote itemises every charge', async () => {
    const stays = (await api().get('/api/stays?destination=coorg-madikeri')).body.stays;
    const resort = stays.find((s) => s.kind === 'resort');
    const { stay } = (await api().get(`/api/stays/${resort.id}?nights=2&guests=3`)).body;
    const sum = stay.quote.lines.reduce((s, l) => s + l.amount, 0);
    assert.equal(stay.quote.total, sum);
    assert.equal(stay.quote.rooms, 2);
  });
});
