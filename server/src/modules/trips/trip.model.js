import mongoose from 'mongoose';

const { ObjectId } = mongoose.Schema.Types;

const tripSchema = new mongoose.Schema(
  {
    host: { type: ObjectId, ref: 'User', required: true, index: true },
    destination: { type: ObjectId, ref: 'Destination', required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 90 },
    description: { type: String, trim: true, maxlength: 1200, default: '' },
    meetingPoint: { type: String, trim: true, maxlength: 120, default: '' },
    startDate: { type: Date, required: true, index: true },
    endDate: { type: Date, required: true },
    mode: { type: String, enum: ['bus', 'car'], required: true },
    budgetPerPerson: { type: Number, required: true, min: 0 },
    // Seats for people joining the host. seatsTaken only changes through
    // atomic $inc updates guarded by seatsTaken < seats.
    seats: { type: Number, required: true, min: 1, max: 15 },
    seatsTaken: { type: Number, default: 0, min: 0 },
    womenOnly: { type: Boolean, default: false },
    status: { type: String, enum: ['open', 'cancelled'], default: 'open' },
    // Seeded demo trips, labelled as samples in the UI.
    sample: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export const Trip = mongoose.model('Trip', tripSchema);

const joinRequestSchema = new mongoose.Schema(
  {
    trip: { type: ObjectId, ref: 'Trip', required: true },
    user: { type: ObjectId, ref: 'User', required: true, index: true },
    message: { type: String, trim: true, maxlength: 400, default: '' },
    status: { type: String, enum: ['pending', 'approved', 'rejected', 'withdrawn'], default: 'pending' },
    decidedAt: Date,
    // False once the host decides, until the requester has seen the outcome.
    seenByRequester: { type: Boolean, default: true },
  },
  { timestamps: true },
);

// One request per person per trip, enforced by the database. Two requests
// sent at the same moment can't both get in.
joinRequestSchema.index({ trip: 1, user: 1 }, { unique: true });

export const JoinRequest = mongoose.model('JoinRequest', joinRequestSchema);
