import mongoose from 'mongoose';

const { ObjectId } = mongoose.Schema.Types;

const staySchema = new mongoose.Schema(
  {
    destination: { type: ObjectId, ref: 'Destination', required: true, index: true },
    name: { type: String, required: true, trim: true },
    kind: { type: String, enum: ['hostel', 'homestay', 'guesthouse', 'resort'], required: true },
    // Sample listings show how a listing works; they are not real properties.
    sample: { type: Boolean, default: false },
    area: String,
    roomPerNight: { type: Number, required: true, min: 0 },
    sleeps: { type: Number, required: true, min: 1 },
    dormBedPerNight: { type: Number, default: null },
    taxesIncluded: { type: Boolean, default: true },
    fees: [{ label: String, amount: Number, per: { type: String, enum: ['stay', 'night', 'guest'] } }],
    includes: [String],
    // Declared by the listing. Roamly shows these as declarations, not verified facts.
    safety: {
      reception24h: Boolean,
      womenOnlyDorm: Boolean,
      cctvCommonAreas: Boolean,
      litAccessRoad: Boolean,
      kmFromBusStand: Number,
    },
    ratingAvg: { type: Number, default: null },
    safetyAvg: { type: Number, default: null },
    ratingCount: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export const Stay = mongoose.model('Stay', staySchema);

const reviewSchema = new mongoose.Schema(
  {
    stay: { type: ObjectId, ref: 'Stay', required: true, index: true },
    user: { type: ObjectId, ref: 'User', required: true },
    // The completed trip that made this person eligible to review.
    trip: { type: ObjectId, ref: 'Trip', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    safetyRating: { type: Number, required: true, min: 1, max: 5 },
    text: { type: String, required: true, trim: true, minlength: 20, maxlength: 1500 },
  },
  { timestamps: true },
);

reviewSchema.index({ stay: 1, user: 1 }, { unique: true });

export const Review = mongoose.model('Review', reviewSchema);
