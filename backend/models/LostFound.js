import mongoose from 'mongoose';

const LostFoundSchema = new mongoose.Schema({
  type: { type: String, enum: ['lost', 'found'], required: true },
  title: { type: String, required: true },
  desc: String,
  location: String,
  date: { type: Date, default: Date.now },
  postedBy: String,
  emoji: String,
  status: { type: String, enum: ['open', 'claimed'], default: 'open' },
  claimedBy: String,
  imageUrl: String, // store Cloudinary URL
}, { timestamps: true });

export default mongoose.models.LostFound || mongoose.model('LostFound', LostFoundSchema);
