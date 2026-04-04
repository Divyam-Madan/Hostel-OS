import mongoose from 'mongoose';

/**
 * One document per calendar day (UTC date string YYYY-MM-DD).
 */
const messMenuSchema = new mongoose.Schema(
  {
    date: { type: String, required: true, unique: true, index: true },
    breakfast: [{ type: String }],
    lunch: [{ type: String }],
    snacks: [{ type: String }],
    dinner: [{ type: String }],
  },
  { timestamps: true }
);

export const MessMenu = mongoose.model('MessMenu', messMenuSchema);
