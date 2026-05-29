import mongoose from 'mongoose';

const laundryBookingSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    slotId: { type: mongoose.Schema.Types.ObjectId, ref: 'LaundrySlot', required: true, index: true },
    bookingDate: { type: Date, required: true, index: true },
    mode: { type: String, enum: ['free', 'paid'], required: true },
    tokenId: { type: String, required: true, unique: true }, // e.g. LDY-XXXX-YYYY
    status: { type: String, enum: ['confirmed', 'completed', 'cancelled'], default: 'confirmed', index: true },
    paymentId: { type: String, default: null }, // For paid bookings
    paymentStatus: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
    createdAt: { type: Date, default: () => new Date() },
  },
  { timestamps: true }
);

// Indexes for efficient queries
laundryBookingSchema.index({ userId: 1, status: 1 });
laundryBookingSchema.index({ slotId: 1, status: 1 });
laundryBookingSchema.index({ bookingDate: 1, status: 1 });

export const LaundryBooking = mongoose.model('LaundryBooking', laundryBookingSchema);
