import mongoose from 'mongoose';

const adminSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 1, maxlength: 120 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    employeeId: { type: String, required: true, unique: true, uppercase: true, trim: true },
    otp: { type: String, select: false },
    otpExpiry: { type: Date },
  },
  { timestamps: true }
);

export const Admin = mongoose.model('Admin', adminSchema);
