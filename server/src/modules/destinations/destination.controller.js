import { z } from 'zod';
import { AppError } from '../../utils/AppError.js';
import { Destination } from './destination.model.js';
import { findTrips, INTERESTS, ORIGINS } from './finder.service.js';

// Query strings arrive as text, so numbers and booleans are coerced here.
export const finderQuery = z.object({
  origin: z.enum(Object.keys(ORIGINS)).default('bengaluru'),
  days: z.coerce.number().int().min(1).max(4).default(2),
  budget: z.coerce.number().int().min(500, 'Budget must be at least ₹500').max(100000).default(5000),
  mode: z.enum(['bus', 'car']).default('bus'),
  groupSize: z.coerce.number().int().min(1).max(12).default(1),
  travelStyle: z.enum(['solo', 'couple', 'friends', 'open-group']).default('solo'),
  interests: z
    .union([z.string(), z.array(z.string())])
    .optional()
    .transform((v) => (v == null ? [] : (Array.isArray(v) ? v : v.split(',')).filter(Boolean)))
    .pipe(z.array(z.enum(INTERESTS)).max(6)),
  vibe: z.enum(['hidden', 'popular', 'any']).default('any'),
  avoidDarkArrival: z
    .enum(['true', 'false'])
    .default('false')
    .transform((v) => v === 'true'),
});

export const slugParams = z.object({ slug: z.string().regex(/^[a-z0-9-]+$/).max(80) });

export async function search(req, res) {
  const prefs = req.validatedQuery;
  // Solo means one person regardless of what the size field says.
  if (prefs.travelStyle === 'solo') prefs.groupSize = 1;
  if (prefs.travelStyle === 'couple') prefs.groupSize = 2;

  const destinations = await Destination.find().lean();
  const { results, excluded, assumptions } = findTrips(destinations, prefs);

  res.json({
    prefs,
    origin: ORIGINS[prefs.origin],
    results: results.map(({ destination: d, ...rest }) => ({
      destination: {
        slug: d.slug, name: d.name, region: d.region, image: d.image, roadKm: d.roadKm,
        crowd: d.crowd, interests: d.interests, summary: d.summary, idealDays: d.idealDays,
      },
      ...rest,
    })),
    excluded,
    assumptions,
  });
}

export async function list(req, res) {
  const destinations = await Destination.find()
    .select('slug name region image roadKm crowd interests idealDays')
    .sort({ roadKm: 1 })
    .lean();
  res.json({ destinations });
}

export async function getOne(req, res) {
  const destination = await Destination.findOne({ slug: req.params.slug }).lean();
  if (!destination) throw new AppError(404, 'We don’t have that destination');
  res.json({ destination });
}

export function meta(req, res) {
  res.json({ origins: ORIGINS, interests: INTERESTS });
}
