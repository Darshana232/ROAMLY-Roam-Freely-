import mongoose from 'mongoose';

const coords = { lat: Number, lng: Number };

const attractionSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true },
    name: { type: String, required: true },
    minutes: { type: Number, required: true, min: 10 },
    best: { type: String, enum: ['sunrise', 'morning', 'sunset', 'any'], default: 'any' },
    hours: { type: { open: String, close: String }, default: null },
    coords,
    coordsApprox: Boolean,
    summary: String,
    source: String,
  },
  { _id: false },
);

const destinationSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    region: String,
    coords,
    roadKm: { type: Number, required: true },
    crowd: { type: Number, min: 1, max: 5 },
    costTier: { type: String, enum: ['low', 'mid', 'high'] },
    busFromBlr: Boolean,
    remote: Boolean,
    idealDays: { type: Number, min: 1 },
    interests: [String],
    summary: String,
    source: String,
    image: { src: String, width: Number, height: Number, author: String, license: String, sourceUrl: String },
    attractions: [attractionSchema],
  },
  { timestamps: true },
);

export const Destination = mongoose.model('Destination', destinationSchema);
