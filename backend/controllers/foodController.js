import { FoodReview } from '../models/FoodReview.js';
import { User } from '../models/User.js';

export async function createReview(req, res, next) {
  try {
    const { foodItem, rating, comment, tags } = req.body;
    const r = Number(rating);
    if (!foodItem || r < 1 || r > 5) {
      return res.status(400).json({ success: false, message: 'foodItem and rating 1-5 required' });
    }
    const rev = await FoodReview.create({
      userId: req.user.id,
      foodItem: String(foodItem).trim(),
      rating: r,
      comment: String(comment || '').trim(),
      tags: Array.isArray(tags) ? tags.map(String) : [],
    });
    await User.findByIdAndUpdate(req.user.id, { $push: { reviews: rev._id } });
    res.status(201).json({
      success: true,
      review: {
        id: rev._id.toString(),
        foodItem: rev.foodItem,
        rating: rev.rating,
        comment: rev.comment,
        createdAt: rev.createdAt,
      },
    });
  } catch (e) {
    next(e);
  }
}

export async function listReviews(req, res, next) {
  try {
    const list = await FoodReview.find().sort({ createdAt: -1 }).limit(500).lean();
    res.json({ success: true, reviews: list });
  } catch (e) {
    next(e);
  }
}
