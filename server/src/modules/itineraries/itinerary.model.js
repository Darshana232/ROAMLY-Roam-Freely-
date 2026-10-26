import mongoose from 'mongoose';

const itinerarySchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    destination: { type: mongoose.Schema.Types.ObjectId, ref: 'Destination', required: true },
    title: { type: String, required: true, trim: true, maxlength: 80 },
    days: { type: Number, required: true, min: 1, max: 4 },
    mode: { type: String, enum: ['bus', 'car'], required: true },
    startDate: { type: Date, default: null },
    // Only the order of stops is stored. Times are recomputed on every read
    // from the same planner rules, so they can't drift out of sync.
    plan: { type: [[String]], required: true },
  },
  { timestamps: true },
);

export const Itinerary = mongoose.model('Itinerary', itinerarySchema);
