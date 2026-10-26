import { z } from 'zod';
import { AppError } from '../../utils/AppError.js';
import { Destination } from '../destinations/destination.model.js';
import { JoinRequest, Trip } from './trip.model.js';

const MAX_TRIP_DAYS = 14;
const DAY = 24 * 60 * 60 * 1000;

// Dates are calendar days (YYYY-MM-DD) and stored as midnight UTC.
const day = z.iso.date('Use a date like 2026-11-14').transform((s) => new Date(`${s}T00:00:00Z`));
const id = z.string().regex(/^[a-f0-9]{24}$/, 'Invalid id');

export const createBody = z
  .object({
    destination: z.string().regex(/^[a-z0-9-]+$/),
    title: z.string().trim().min(4, 'Give the trip a short title').max(90),
    description: z.string().trim().max(1200).optional(),
    meetingPoint: z.string().trim().max(120).optional(),
    startDate: day,
    endDate: day,
    mode: z.enum(['bus', 'car']),
    budgetPerPerson: z.number().int().min(0).max(100000),
    seats: z.number().int().min(1, 'At least one seat').max(15, 'Up to 15 seats'),
    womenOnly: z.boolean().default(false),
  })
  .refine((t) => t.endDate >= t.startDate, { path: ['endDate'], message: 'End date can’t be before the start date' })
  .refine((t) => (t.endDate - t.startDate) / DAY + 1 <= MAX_TRIP_DAYS, {
    path: ['endDate'],
    message: `Trips can be at most ${MAX_TRIP_DAYS} days`,
  });

export const listQuery = z.object({
  destination: z.string().regex(/^[a-z0-9-]+$/).optional(),
  womenOnly: z.enum(['true', 'false']).optional(),
});

export const idParams = z.object({ id });
export const requestParams = z.object({ id, requestId: id });
export const joinBody = z.object({ message: z.string().trim().max(400).optional() });

const today = () => {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
};
const hasStarted = (trip) => trip.startDate <= today();

function present(trip, viewer) {
  const isHost = viewer && trip.host._id.equals(viewer._id);
  return {
    id: trip._id,
    title: trip.title,
    description: trip.description,
    meetingPoint: trip.meetingPoint,
    startDate: trip.startDate,
    endDate: trip.endDate,
    mode: trip.mode,
    budgetPerPerson: trip.budgetPerPerson,
    seats: trip.seats,
    seatsLeft: Math.max(0, trip.seats - trip.seatsTaken),
    womenOnly: trip.womenOnly,
    status: trip.status,
    sample: trip.sample,
    started: hasStarted(trip),
    host: { id: trip.host._id, name: trip.host.name },
    destination: trip.destination,
    isHost: Boolean(isHost),
  };
}

const populateTrip = (q) =>
  q.populate('host', 'name').populate('destination', 'slug name region image');

// A person can't be on two trips that overlap, as host or confirmed member.
async function assertNoOverlap(userId, startDate, endDate, ignoreTripId) {
  const hosting = await Trip.exists({
    host: userId, status: 'open', _id: { $ne: ignoreTripId },
    startDate: { $lte: endDate }, endDate: { $gte: startDate },
  });
  const approved = await JoinRequest.find({ user: userId, status: 'approved' }).select('trip').lean();
  const joining = approved.length
    ? await Trip.exists({
        _id: { $in: approved.map((r) => r.trip), $ne: ignoreTripId }, status: 'open',
        startDate: { $lte: endDate }, endDate: { $gte: startDate },
      })
    : null;
  if (hosting || joining) throw new AppError(409, 'You already have a trip on overlapping dates');
}

export async function create(req, res) {
  const body = req.body;
  if (body.startDate <= today()) throw new AppError(400, 'Trips must start from tomorrow onwards');
  if (body.startDate > new Date(Date.now() + 365 * DAY)) throw new AppError(400, 'Trips can be planned up to a year ahead');
  if (body.womenOnly && req.user.gender !== 'woman') {
    throw new AppError(403, 'Only women can host a women-only trip');
  }

  const dest = await Destination.findOne({ slug: body.destination }).select('_id');
  if (!dest) throw new AppError(404, 'We don’t have that destination');
  await assertNoOverlap(req.user._id, body.startDate, body.endDate);

  const trip = await Trip.create({ ...body, destination: dest._id, host: req.user._id });
  const full = await populateTrip(Trip.findById(trip._id));
  res.status(201).json({ trip: present(full, req.user) });
}

export async function list(req, res) {
  const { destination, womenOnly } = req.validatedQuery;
  const filter = { status: 'open', startDate: { $gt: today() } };
  if (destination) {
    const dest = await Destination.findOne({ slug: destination }).select('_id');
    if (!dest) return res.json({ trips: [] });
    filter.destination = dest._id;
  }
  if (womenOnly === 'true') filter.womenOnly = true;

  const trips = await populateTrip(Trip.find(filter).sort({ startDate: 1 }).limit(60));
  res.json({ trips: trips.map((t) => present(t, req.user)) });
}

export async function getOne(req, res) {
  const trip = await populateTrip(Trip.findById(req.params.id));
  if (!trip) throw new AppError(404, 'Trip not found');

  const members = await JoinRequest.find({ trip: trip._id, status: 'approved' }).populate('user', 'name').lean();
  const result = {
    ...present(trip, req.user),
    members: members.map((m) => ({ id: m.user._id, name: m.user.name })),
  };

  if (req.user) {
    if (result.isHost) {
      const requests = await JoinRequest.find({ trip: trip._id, status: { $in: ['pending', 'approved', 'rejected'] } })
        .populate('user', 'name')
        .sort({ createdAt: 1 })
        .lean();
      result.requests = requests.map((r) => ({
        id: r._id, status: r.status, message: r.message, createdAt: r.createdAt, user: { id: r.user._id, name: r.user.name },
      }));
    } else {
      const mine = await JoinRequest.findOne({ trip: trip._id, user: req.user._id }).lean();
      result.myRequest = mine ? { id: mine._id, status: mine.status } : null;
    }
  }
  res.json({ trip: result });
}

export async function requestToJoin(req, res) {
  const trip = await Trip.findById(req.params.id);
  if (!trip || trip.status !== 'open') throw new AppError(404, 'This trip isn’t open');
  if (trip.host.equals(req.user._id)) throw new AppError(400, 'You’re hosting this trip');
  if (hasStarted(trip)) throw new AppError(400, 'This trip has already started');
  if (trip.seatsTaken >= trip.seats) throw new AppError(409, 'This trip is full');
  if (trip.womenOnly && req.user.gender !== 'woman') throw new AppError(403, 'This trip is for women only');

  const existing = await JoinRequest.findOne({ trip: trip._id, user: req.user._id });
  if (existing?.status === 'pending' || existing?.status === 'approved') {
    throw new AppError(409, 'You’ve already asked to join this trip');
  }
  if (existing?.status === 'rejected') throw new AppError(403, 'The host declined your earlier request');
  await assertNoOverlap(req.user._id, trip.startDate, trip.endDate, trip._id);

  let request;
  if (existing) {
    // Rejoining after withdrawing: reuse the record, only if it is still withdrawn.
    request = await JoinRequest.findOneAndUpdate(
      { _id: existing._id, status: 'withdrawn' },
      { status: 'pending', message: req.body.message ?? '', decidedAt: null },
      { returnDocument: 'after' },
    );
    if (!request) throw new AppError(409, 'You’ve already asked to join this trip');
  } else {
    // The unique index turns a simultaneous duplicate into a 409.
    request = await JoinRequest.create({ trip: trip._id, user: req.user._id, message: req.body.message ?? '' });
  }
  res.status(201).json({ request: { id: request._id, status: request.status } });
}

export async function approve(req, res) {
  const now = today();
  // Reserve a seat first. The filter makes this atomic: it only succeeds if
  // the caller is the host, the trip hasn't started and a seat is free.
  const seat = await Trip.findOneAndUpdate(
    {
      _id: req.params.id, host: req.user._id, status: 'open', startDate: { $gt: now },
      $expr: { $lt: ['$seatsTaken', '$seats'] },
    },
    { $inc: { seatsTaken: 1 } },
    { returnDocument: 'after' },
  );
  if (!seat) {
    const trip = await Trip.findById(req.params.id);
    if (!trip || !trip.host.equals(req.user._id)) throw new AppError(404, 'Trip not found');
    if (trip.status !== 'open') throw new AppError(400, 'This trip was cancelled');
    if (trip.startDate <= now) throw new AppError(400, 'This trip has already started');
    throw new AppError(409, 'No seats left on this trip');
  }

  const request = await JoinRequest.findOneAndUpdate(
    { _id: req.params.requestId, trip: seat._id, status: 'pending' },
    { status: 'approved', decidedAt: new Date() },
    { returnDocument: 'after' },
  );
  if (!request) {
    // Nothing to approve (already decided or withdrawn): give the seat back.
    await Trip.updateOne({ _id: seat._id }, { $inc: { seatsTaken: -1 } });
    throw new AppError(409, 'This request has already been handled');
  }
  res.json({ request: { id: request._id, status: request.status }, seatsLeft: seat.seats - seat.seatsTaken });
}

export async function reject(req, res) {
  const trip = await Trip.findOne({ _id: req.params.id, host: req.user._id });
  if (!trip) throw new AppError(404, 'Trip not found');
  const request = await JoinRequest.findOneAndUpdate(
    { _id: req.params.requestId, trip: trip._id, status: 'pending' },
    { status: 'rejected', decidedAt: new Date() },
    { returnDocument: 'after' },
  );
  if (!request) throw new AppError(409, 'This request has already been handled');
  res.json({ request: { id: request._id, status: request.status } });
}

export async function withdraw(req, res) {
  const trip = await Trip.findById(req.params.id);
  if (!trip) throw new AppError(404, 'Trip not found');
  if (hasStarted(trip)) throw new AppError(400, 'This trip has already started');

  const request = await JoinRequest.findOneAndUpdate(
    { trip: trip._id, user: req.user._id, status: { $in: ['pending', 'approved'] } },
    { status: 'withdrawn', decidedAt: new Date() },
  );
  if (!request) throw new AppError(404, 'You don’t have an active request for this trip');
  if (request.status === 'approved') await Trip.updateOne({ _id: trip._id }, { $inc: { seatsTaken: -1 } });
  res.status(204).end();
}

export async function cancel(req, res) {
  const trip = await Trip.findOneAndUpdate(
    { _id: req.params.id, host: req.user._id, status: 'open', startDate: { $gt: today() } },
    { status: 'cancelled' },
  );
  if (!trip) throw new AppError(404, 'Trip not found or can no longer be cancelled');
  res.status(204).end();
}

export async function mine(req, res) {
  const hosting = await populateTrip(Trip.find({ host: req.user._id }).sort({ startDate: 1 }));
  const requests = await JoinRequest.find({ user: req.user._id, status: { $ne: 'withdrawn' } }).lean();
  const joined = await populateTrip(Trip.find({ _id: { $in: requests.map((r) => r.trip) } }).sort({ startDate: 1 }));
  const statusByTrip = new Map(requests.map((r) => [r.trip.toString(), r.status]));

  const pendingCounts = await JoinRequest.aggregate([
    { $match: { trip: { $in: hosting.map((t) => t._id) }, status: 'pending' } },
    { $group: { _id: '$trip', n: { $sum: 1 } } },
  ]);
  const pendingByTrip = new Map(pendingCounts.map((p) => [p._id.toString(), p.n]));

  res.json({
    hosting: hosting.map((t) => ({ ...present(t, req.user), pendingRequests: pendingByTrip.get(t._id.toString()) ?? 0 })),
    joining: joined.map((t) => ({ ...present(t, req.user), myStatus: statusByTrip.get(t._id.toString()) })),
  });
}
