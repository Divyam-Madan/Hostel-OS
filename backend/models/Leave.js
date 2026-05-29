import mongoose from 'mongoose';

const leaveSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: ['leave', 'outing'], required: true }, // 'leave' or 'outing'
    from: { type: Date, required: true },
    to: { type: Date, required: true },
    reason: { type: String, required: true, maxlength: 500 },
    parentConsent: { type: String, required: true }, // e.g. 'Parent informed via phone'
    returnTime: { type: String, default: null }, // for outings: 'Before 10:30 PM'
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending', index: true },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', default: null },
    approverNotes: { type: String, default: '', maxlength: 500 },
    appliedOn: { type: Date, default: () => new Date() },
  },
  { timestamps: true }
);

leaveSchema.index({ userId: 1, status: 1 });
leaveSchema.index({ createdAt: -1 });
leaveSchema.index({ userId: 1, from: 1, to: 1, status: 1 }); // For overlapping leave detection

export const Leave = mongoose.model('Leave', leaveSchema);
