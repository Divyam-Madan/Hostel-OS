import mongoose from 'mongoose';

const STATUS = ['pending', 'in_progress', 'resolved'];

const complaintSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    category: { type: String, default: 'General', trim: true },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, default: '', maxlength: 5000 },
    priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    status: { type: String, enum: STATUS, default: 'pending' },
    roomHint: { type: String, default: '', trim: true },
  },
  { timestamps: true }
);

export const Complaint = mongoose.model('Complaint', complaintSchema);
