import mongoose from 'mongoose';

const feeRecordSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    semester: { type: String, required: true, trim: true, maxlength: 50 },
    amount: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ['paid', 'pending', 'overdue'],
      default: 'pending',
      index: true,
    },
    dueDate: { type: Date, required: true, index: true },
    paidAt: { type: Date, default: null },
    method: { type: String, trim: true, maxlength: 40, default: '' },
    transactionId: { type: String, trim: true, maxlength: 80, default: null },
    notes: { type: String, trim: true, maxlength: 500, default: '' },
  },
  { timestamps: true }
);

feeRecordSchema.index({ userId: 1, dueDate: 1 });
feeRecordSchema.index({ userId: 1, status: 1 });
// Prevent accidental duplicate transaction ids; sparse so existing null/empty values are ignored.
feeRecordSchema.index({ transactionId: 1 }, { unique: true, sparse: true });

export const FeeRecord = mongoose.model('FeeRecord', feeRecordSchema);