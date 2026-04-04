import mongoose from 'mongoose';

const PURPOSE = ['signup', 'forgot_password'];

const otpSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    otp: { type: String, required: true },
    expiry: { type: Date, required: true, index: true },
    purpose: { type: String, enum: PURPOSE, required: true },
    /** signup: { username, passwordHash }; forgot_password: {} */
    meta: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

otpSchema.index({ email: 1, purpose: 1 });

export const OTP = mongoose.model('OTP', otpSchema);
