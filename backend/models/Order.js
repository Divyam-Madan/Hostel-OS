import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    items: [{ type: String, required: true }],
    tokenNumber: { type: Number, required: true, unique: true, index: true },
    mealType: { type: String, enum: ['breakfast', 'lunch', 'snacks', 'dinner', 'other'], default: 'other' },
  },
  { timestamps: true }
);

export const Order = mongoose.model('Order', orderSchema);
