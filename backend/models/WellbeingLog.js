import mongoose from 'mongoose';

/** Counselling / health visit records for warden analytics (not shown to students as a list API). */
const wellbeingLogSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    kind: {
      type: String,
      enum: ['counselling', 'health', 'general'],
      default: 'counselling',
    },
    visitDate: { type: Date, default: Date.now },
    notes: { type: String, default: '', maxlength: 2000 },
  },
  { timestamps: true }
);

export const WellbeingLog = mongoose.model('WellbeingLog', wellbeingLogSchema);
