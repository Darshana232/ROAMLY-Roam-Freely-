// Seeds reference data and a small, clearly-labelled demo world:
//   - destinations (from data/destinations.json, built from Wikipedia)
//   - sample stays, two per destination
//   - demo accounts and sample trips, dated relative to today
// Safe to run repeatedly: destinations and stays are upserted, demo data is
// only created once. No reviews are seeded, since every review must come from
// a real completed trip.
import { readFile } from 'node:fs/promises';
import bcrypt from 'bcryptjs';
import { Destination } from '../modules/destinations/destination.model.js';
import { Stay } from '../modules/stays/stay.model.js';
import { User } from '../modules/auth/user.model.js';
import { JoinRequest, Trip } from '../modules/trips/trip.model.js';

export const DEMO_PASSWORD = 'roamly-demo-2026';
export const DEMO_EMAIL = 'demo@roamly.app';

const STAY_TEMPLATES = {
  low: [
    { kind: 'hostel', name: 'Sample hostel', roomPerNight: 1400, sleeps: 2, dormBedPerNight: 550, area: 'Near the bus stand', km: 0.6 },
    { kind: 'homestay', name: 'Sample family homestay', roomPerNight: 1800, sleeps: 3, area: 'Edge of town', km: 2.5 },
  ],
  mid: [
    { kind: 'hostel', name: 'Sample backpacker hostel', roomPerNight: 1900, sleeps: 2, dormBedPerNight: 750, area: 'Town centre', km: 0.8 },
    { kind: 'homestay', name: 'Sample estate homestay', roomPerNight: 3200, sleeps: 3, area: 'Outside town', km: 6 },
  ],
  high: [
    { kind: 'guesthouse', name: 'Sample guesthouse', roomPerNight: 3000, sleeps: 2, area: 'Town centre', km: 1 },
    { kind: 'resort', name: 'Sample riverside stay', roomPerNight: 6500, sleeps: 2, area: 'Outside town', km: 9 },
  ],
};

async function seedDestinations() {
  const data = JSON.parse(await readFile(new URL('./data/destinations.json', import.meta.url), 'utf8'));
  await Destination.bulkWrite(
    data.map((d) => ({ updateOne: { filter: { slug: d.slug }, update: { $set: d }, upsert: true } })),
  );
  return Destination.find().lean();
}

async function seedStays(destinations) {
  const ops = destinations.flatMap((d) =>
    STAY_TEMPLATES[d.costTier].map((t) => {
      const hostel = t.kind === 'hostel';
      const doc = {
        destination: d._id,
        name: `${t.name} in ${d.name}`,
        kind: t.kind,
        sample: true,
        area: t.area,
        roomPerNight: t.roomPerNight,
        sleeps: t.sleeps,
        dormBedPerNight: t.dormBedPerNight ?? null,
        taxesIncluded: true,
        fees: t.kind === 'resort' ? [{ label: 'Resort fee', amount: 300, per: 'night' }] : [],
        includes: t.kind === 'homestay' ? ['Breakfast'] : [],
        safety: {
          reception24h: hostel || t.kind === 'resort',
          womenOnlyDorm: hostel,
          cctvCommonAreas: t.kind !== 'homestay',
          litAccessRoad: t.km < 3,
          kmFromBusStand: t.km,
        },
      };
      return { updateOne: { filter: { destination: d._id, name: doc.name }, update: { $set: doc }, upsert: true } };
    }),
  );
  await Stay.bulkWrite(ops);
}

const dayOffset = (n) => {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + n));
};

async function seedDemoWorld(destinations) {
  if (await User.exists({ email: DEMO_EMAIL })) return;

  const hash = await bcrypt.hash(DEMO_PASSWORD, 12);
  const [demo, asha, rohan, kiran] = await User.create([
    { name: 'Demo Traveller', email: DEMO_EMAIL, passwordHash: hash, gender: 'woman' },
    { name: 'Asha (sample host)', email: 'asha@demo.roamly.app', passwordHash: hash, gender: 'woman' },
    { name: 'Rohan (sample host)', email: 'rohan@demo.roamly.app', passwordHash: hash, gender: 'man' },
    { name: 'Kiran (sample host)', email: 'kiran@demo.roamly.app', passwordHash: hash, gender: 'non-binary' },
  ]);
  const dest = (slug) => destinations.find((d) => d.slug === slug)._id;

  const base = { sample: true, status: 'open' };
  const [hampi, gokarna, , agumbe, sakleshpur] = await Trip.create([
    {
      ...base, host: rohan._id, destination: dest('hampi'), title: 'Hampi long weekend: boulders and ruins',
      description: 'Overnight bus Friday, two full days on bicycles between the temple sites, back Sunday night. Splitting a guesthouse.',
      meetingPoint: 'Majestic bus stand', startDate: dayOffset(12), endDate: dayOffset(14), mode: 'bus', budgetPerPerson: 4500, seats: 4,
    },
    {
      ...base, host: asha._id, destination: dest('gokarna'), title: 'Women-only Gokarna beach trek',
      description: 'Kudle to Om Beach on foot, sunset at Kudle. Hostel dorm, women-only.',
      meetingPoint: 'Majestic bus stand', startDate: dayOffset(19), endDate: dayOffset(21), mode: 'bus', budgetPerPerson: 5000, seats: 5, womenOnly: true,
    },
    {
      ...base, host: kiran._id, destination: dest('coorg-madikeri'), title: 'Slow weekend in Coorg',
      description: 'Car from Bengaluru, homestay near Madikeri, Abbey Falls and Raja’s Seat at sunset.',
      meetingPoint: 'Kengeri metro', startDate: dayOffset(26), endDate: dayOffset(27), mode: 'car', budgetPerPerson: 6000, seats: 3,
    },
    {
      ...base, host: asha._id, destination: dest('agumbe'), title: 'Rainforest and sunset point, Agumbe',
      description: 'Overnight bus, waterfalls by day, sunset point in the evening.',
      meetingPoint: 'Majestic bus stand', startDate: dayOffset(5), endDate: dayOffset(6), mode: 'bus', budgetPerPerson: 3500, seats: 2,
    },
    // Finished last month, so the demo account can review Sakleshpur stays.
    {
      ...base, host: asha._id, destination: dest('sakleshpur'), title: 'Sakleshpur estates weekend',
      startDate: dayOffset(-24), endDate: dayOffset(-23), mode: 'bus', budgetPerPerson: 4000, seats: 3, seatsTaken: 1,
    },
  ]);

  await JoinRequest.create([
    { trip: sakleshpur._id, user: demo._id, status: 'approved', decidedAt: dayOffset(-30) },
    { trip: hampi._id, user: kiran._id, status: 'pending', message: 'I cycle a lot and can share a room.' },
    { trip: agumbe._id, user: demo._id, status: 'pending', message: 'Would love to join for the sunset point.' },
    { trip: gokarna._id, user: demo._id, status: 'approved', decidedAt: dayOffset(-1) },
  ]);
  await Trip.updateOne({ _id: gokarna._id }, { $inc: { seatsTaken: 1 } });
}

export async function seed() {
  const destinations = await seedDestinations();
  await seedStays(destinations);
  await seedDemoWorld(destinations);
  console.log(`Seeded ${destinations.length} destinations, sample stays and demo accounts`);
}

// `npm run seed` runs this file directly against MONGO_URI.
if (import.meta.url === `file://${process.argv[1]}`) {
  const { connectDB } = await import('../config/db.js');
  const mongoose = (await import('mongoose')).default;
  await connectDB();
  await seed();
  await mongoose.disconnect();
}
