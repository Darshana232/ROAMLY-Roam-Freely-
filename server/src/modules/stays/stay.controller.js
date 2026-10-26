import { z } from 'zod';
import { AppError } from '../../utils/AppError.js';
import { Destination } from '../destinations/destination.model.js';
import { JoinRequest, Trip } from '../trips/trip.model.js';
import { Review, Stay } from './stay.model.js';

const id = z.string().regex(/^[a-f0-9]{24}$/, 'Invalid id');

export const listQuery = z.object({ destination: z.string().regex(/^[a-z0-9-]+$/) });
export const idParams = z.object({ id });
export const priceQuery = z.object({
  nights: z.coerce.number().int().min(1).max(14).default(1),
  guests: z.coerce.number().int().min(1).max(12).default(1),
});
export const reviewBody = z.object({
  rating: z.number().int().min(1).max(5),
  safetyRating: z.number().int().min(1).max(5),
  text: z.string().trim().min(20, 'Write at least 20 characters so others can learn from it').max(1500),
});

// Itemised price for a stay, so the total never hides a fee.
export function quote(stay, { nights, guests }) {
  const rooms = Math.ceil(guests / stay.sleeps);
  const lines = [{ label: `${rooms} room${rooms > 1 ? 's' : ''} × ${nights} night${nights > 1 ? 's' : ''}`, amount: rooms * nights * stay.roomPerNight }];
  for (const f of stay.fees ?? []) {
    const times = f.per === 'night' ? nights : f.per === 'guest' ? guests : 1;
    lines.push({ label: f.label, amount: f.amount * times });
  }
  const total = lines.reduce((s, l) => s + l.amount, 0);
  const dormTotal = stay.dormBedPerNight ? stay.dormBedPerNight * guests * nights : null;
  return { nights, guests, rooms, lines, total, perPerson: Math.round(total / guests), taxesIncluded: stay.taxesIncluded, dormTotal };
}

function present(stay, q) {
  return {
    id: stay._id,
    name: stay.name,
    kind: stay.kind,
    sample: stay.sample,
    area: stay.area,
    roomPerNight: stay.roomPerNight,
    sleeps: stay.sleeps,
    dormBedPerNight: stay.dormBedPerNight,
    includes: stay.includes,
    safety: stay.safety,
    ratingAvg: stay.ratingAvg,
    safetyAvg: stay.safetyAvg,
    ratingCount: stay.ratingCount,
    quote: quote(stay, q),
  };
}

export async function list(req, res) {
  const dest = await Destination.findOne({ slug: req.validatedQuery.destination }).select('_id');
  if (!dest) throw new AppError(404, 'We don’t have that destination');
  const stays = await Stay.find({ destination: dest._id }).sort({ roomPerNight: 1 }).lean();
  res.json({ stays: stays.map((s) => present(s, { nights: 1, guests: 1 })) });
}

export async function getOne(req, res) {
  const stay = await Stay.findById(req.params.id).populate('destination', 'slug name region').lean();
  if (!stay) throw new AppError(404, 'Stay not found');
  const reviews = await Review.find({ stay: stay._id }).sort({ createdAt: -1 }).populate('user', 'name').lean();
  res.json({
    stay: { ...present(stay, req.validatedQuery), destination: stay.destination },
    reviews: reviews.map((r) => ({
      id: r._id, rating: r.rating, safetyRating: r.safetyRating, text: r.text, createdAt: r.createdAt,
      user: { name: r.user?.name ?? 'Former member' }, verifiedTrip: true,
    })),
  });
}

const startOfToday = () => {
  const n = new Date();
  return new Date(Date.UTC(n.getUTCFullYear(), n.getUTCMonth(), n.getUTCDate()));
};

// Eligible = hosted or was an approved member of a trip to this stay's
// destination that has finished and wasn't cancelled.
async function findEligibleTrip(user, stay) {
  const approved = await JoinRequest.find({ user: user._id, status: 'approved' }).select('trip').lean();
  return Trip.findOne({
    destination: stay.destination,
    status: 'open',
    endDate: { $lt: startOfToday() },
    $or: [{ host: user._id }, { _id: { $in: approved.map((r) => r.trip) } }],
  })
    .sort({ endDate: -1 })
    .lean();
}

export async function eligibility(req, res) {
  const stay = await Stay.findById(req.params.id).lean();
  if (!stay) throw new AppError(404, 'Stay not found');
  if (await Review.exists({ stay: stay._id, user: req.user._id })) {
    return res.json({ eligible: false, reason: 'already-reviewed' });
  }
  const trip = await findEligibleTrip(req.user, stay);
  res.json(trip ? { eligible: true, trip: { id: trip._id, title: trip.title, endDate: trip.endDate } } : { eligible: false, reason: 'no-completed-trip' });
}

export async function addReview(req, res) {
  const stay = await Stay.findById(req.params.id);
  if (!stay) throw new AppError(404, 'Stay not found');

  const trip = await findEligibleTrip(req.user, stay);
  if (!trip) {
    throw new AppError(403, 'Only people who have completed a Roamly trip to this destination can review its stays');
  }

  // The unique (stay, user) index turns a second review into a 409.
  const review = await Review.create({ ...req.body, stay: stay._id, user: req.user._id, trip: trip._id });

  const [agg] = await Review.aggregate([
    { $match: { stay: stay._id } },
    { $group: { _id: null, avg: { $avg: '$rating' }, safety: { $avg: '$safetyRating' }, n: { $sum: 1 } } },
  ]);
  await Stay.updateOne(
    { _id: stay._id },
    { ratingAvg: Math.round(agg.avg * 10) / 10, safetyAvg: Math.round(agg.safety * 10) / 10, ratingCount: agg.n },
  );

  res.status(201).json({ review: { id: review._id } });
}
