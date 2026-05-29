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
    mood: {
      type: String,
      enum: ['very-low', 'low', 'okay', 'good', 'great'],
      default: 'okay',
      index: true,
    },
    stressLevel: { type: Number, min: 1, max: 5, default: 3, index: true },
    visitDate: { type: Date, default: Date.now },
    notes: { type: String, default: '', maxlength: 2000 },
    topics: [{ type: String, trim: true, maxlength: 80 }],
  },
  { timestamps: true }
);

wellbeingLogSchema.index({ userId: 1, visitDate: -1 });

export const WellbeingLog = mongoose.model('WellbeingLog', wellbeingLogSchema);
