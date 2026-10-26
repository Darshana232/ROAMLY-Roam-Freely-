import mongoose from 'mongoose';

export const GENDERS = ['woman', 'man', 'non-binary', 'prefer-not-to-say'];

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 60 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    // Never returned by default; queries that need it must opt in with select('+passwordHash').
    passwordHash: { type: String, required: true, select: false },
    // Self-declared. Used only to apply women-only trip rules, never shown publicly.
    gender: { type: String, enum: GENDERS, default: 'prefer-not-to-say' },
    homeCity: { type: String, default: 'Bengaluru' },
  },
  { timestamps: true },
);

userSchema.methods.toPublic = function toPublic() {
  return { id: this._id, name: this.name, email: this.email, gender: this.gender, homeCity: this.homeCity };
};

export const User = mongoose.model('User', userSchema);
