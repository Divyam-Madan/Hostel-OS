import mongoose from 'mongoose';

const registrationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    registeredAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const hostelEventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, default: '', maxlength: 5000 },
    venue: { type: String, default: '', trim: true },
    startsAt: { type: Date },
    endsAt: { type: Date },
    isActive: { type: Boolean, default: true },
    registrations: [registrationSchema],
  },
  { timestamps: true }
);

export const HostelEvent = mongoose.model('HostelEvent', hostelEventSchema);
