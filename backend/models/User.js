import mongoose from 'mongoose';

/**
 * Registered student user. Admin uses JWT without a User document.
 */
const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, trim: true, minlength: 2, maxlength: 50 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    roomNumber: { type: String, default: '', trim: true },
    complaints: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Complaint' }],
    reviews: [{ type: mongoose.Schema.Types.ObjectId, ref: 'FoodReview' }],
    /** Mess / service token numbers issued to this user (recent orders). */
    tokens: [{ type: Number }],
  },
  { timestamps: true }
);

export const User = mongoose.model('User', userSchema);
