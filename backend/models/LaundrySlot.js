import mongoose from 'mongoose';

const laundrySlotSchema = new mongoose.Schema(
  {
    date: { type: Date, required: true, index: true },
    timeStart: { type: String, required: true }, // e.g. '6:00 AM'
    timeEnd: { type: String, required: true },   // e.g. '7:00 AM'
    mode: { type: String, enum: ['free', 'paid'], required: true, index: true },
    machineId: { type: String, default: 'M1' },
    capacity: { type: Number, default: 1 },
    isBlocked: { type: Boolean, default: false }, // For maintenance
    createdAt: { type: Date, default: () => new Date() },
  },
  { timestamps: true }
);

// Compound index for efficient queries
laundrySlotSchema.index({ date: 1, mode: 1, isBlocked: 1 });

export const LaundrySlot = mongoose.model('LaundrySlot', laundrySlotSchema);
