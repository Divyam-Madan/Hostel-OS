import mongoose from 'mongoose';

const analysisCacheSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, index: true },
    payload: { type: mongoose.Schema.Types.Mixed },
    updatedAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true }
);

export const AnalysisCache = mongoose.model('AnalysisCache', analysisCacheSchema);
