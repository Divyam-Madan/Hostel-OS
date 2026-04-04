import mongoose from 'mongoose';

const TYPES = ['healthcare', 'wheelchair', 'general', 'mess', 'order'];

const alertSchema = new mongoose.Schema(
  {
    type: { type: String, enum: TYPES, required: true, index: true },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, maxlength: 8000 },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    meta: { type: mongoose.Schema.Types.Mixed, default: {} },
    read: { type: Boolean, default: false },
    resolved: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Alert = mongoose.model('Alert', alertSchema);
