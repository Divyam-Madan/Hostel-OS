import mongoose from 'mongoose';

const foodReviewSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    foodItem: { type: String, required: true, trim: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, default: '', maxlength: 2000 },
    tags: [{ type: String }],
  },
  { timestamps: true }
);

export const FoodReview = mongoose.model('FoodReview', foodReviewSchema);
