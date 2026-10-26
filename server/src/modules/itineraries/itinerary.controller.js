import { z } from 'zod';
import { AppError } from '../../utils/AppError.js';
import { Destination } from '../destinations/destination.model.js';
import { Itinerary } from './itinerary.model.js';
import { dayWindows, draftPlan, timeline } from './planner.service.js';

const slug = z.string().regex(/^[a-z0-9-]+$/).max(80);
const days = z.coerce.number().int().min(1).max(4);
const mode = z.enum(['bus', 'car']);

export const draftQuery = z.object({ destination: slug, days: days.default(2), mode: mode.default('bus') });

const planShape = z.array(z.array(slug).max(12)).min(1).max(4);

export const previewBody = z.object({ destination: slug, days, mode, plan: planShape });

export const createBody = previewBody.extend({
  title: z.string().trim().min(1).max(80).optional(),
  startDate: z.coerce.date().nullable().optional(),
});

export const updateBody = z.object({
  title: z.string().trim().min(1).max(80).optional(),
  startDate: z.coerce.date().nullable().optional(),
  plan: planShape.optional(),
});

export const idParams = z.object({ id: z.string().regex(/^[a-f0-9]{24}$/, 'Invalid itinerary id') });

async function loadDestination(slugValue) {
  const dest = await Destination.findOne({ slug: slugValue }).lean();
  if (!dest) throw new AppError(404, 'We don’t have that destination');
  return dest;
}

// A plan must have one list per day and only use this destination's
// attractions, each at most once.
function checkPlan(dest, plan, dayCount) {
  if (plan.length !== dayCount) throw new AppError(400, `The plan needs exactly ${dayCount} day${dayCount > 1 ? 's' : ''}`);
  const known = new Set(dest.attractions.map((a) => a.slug));
  const seen = new Set();
  for (const s of plan.flat()) {
    if (!known.has(s)) throw new AppError(400, `"${s}" isn't an attraction in ${dest.name}`);
    if (seen.has(s)) throw new AppError(400, 'Each stop can only appear once in a plan');
    seen.add(s);
  }
}

function render(dest, { days: dayCount, mode: m, plan }) {
  const { windows, journey } = dayWindows(dest, { days: dayCount, mode: m });
  const used = new Set(plan.flat());
  return {
    journey,
    days: timeline(dest, plan, windows),
    unscheduled: dest.attractions.filter((a) => !used.has(a.slug)).map((a) => a.slug),
  };
}

function present(itinerary, dest) {
  return {
    id: itinerary._id,
    title: itinerary.title,
    days: itinerary.days,
    mode: itinerary.mode,
    startDate: itinerary.startDate,
    plan: itinerary.plan,
    updatedAt: itinerary.updatedAt,
    destination: { slug: dest.slug, name: dest.name, region: dest.region, image: dest.image },
    schedule: render(dest, itinerary),
  };
}

// Only the owner may read or change an itinerary. Returning 404 (not 403)
// avoids confirming that someone else's itinerary exists.
async function loadOwned(req) {
  const itinerary = await Itinerary.findOne({ _id: req.params.id, owner: req.user._id });
  if (!itinerary) throw new AppError(404, 'Itinerary not found');
  return itinerary;
}

export async function draft(req, res) {
  const { destination, days: d, mode: m } = req.validatedQuery;
  const dest = await loadDestination(destination);
  const { plan } = draftPlan(dest, { days: d, mode: m });
  res.json({ plan, ...render(dest, { days: d, mode: m, plan }) });
}

export async function preview(req, res) {
  const dest = await loadDestination(req.body.destination);
  checkPlan(dest, req.body.plan, req.body.days);
  res.json(render(dest, req.body));
}

export async function create(req, res) {
  const { destination, days: d, mode: m, plan, title, startDate } = req.body;
  const dest = await loadDestination(destination);
  checkPlan(dest, plan, d);

  const itinerary = await Itinerary.create({
    owner: req.user._id,
    destination: dest._id,
    title: title ?? `${d} day${d > 1 ? 's' : ''} in ${dest.name}`,
    days: d,
    mode: m,
    startDate: startDate ?? null,
    plan,
  });
  res.status(201).json({ itinerary: present(itinerary, dest) });
}

export async function mine(req, res) {
  const items = await Itinerary.find({ owner: req.user._id })
    .sort({ updatedAt: -1 })
    .populate('destination', 'slug name region image')
    .lean();
  res.json({
    itineraries: items.map((i) => ({
      id: i._id, title: i.title, days: i.days, mode: i.mode, startDate: i.startDate, updatedAt: i.updatedAt,
      stops: i.plan.flat().length, destination: i.destination,
    })),
  });
}

export async function getOne(req, res) {
  const itinerary = await loadOwned(req);
  const dest = await Destination.findById(itinerary.destination).lean();
  res.json({ itinerary: present(itinerary, dest) });
}

export async function update(req, res) {
  const itinerary = await loadOwned(req);
  const dest = await Destination.findById(itinerary.destination).lean();
  const { title, startDate, plan } = req.body;

  if (plan) {
    checkPlan(dest, plan, itinerary.days);
    itinerary.plan = plan;
  }
  if (title !== undefined) itinerary.title = title;
  if (startDate !== undefined) itinerary.startDate = startDate;
  await itinerary.save();
  res.json({ itinerary: present(itinerary, dest) });
}

export async function remove(req, res) {
  const itinerary = await loadOwned(req);
  await itinerary.deleteOne();
  res.status(204).end();
}
