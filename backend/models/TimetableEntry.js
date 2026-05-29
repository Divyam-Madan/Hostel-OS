import mongoose from 'mongoose';

const TIMETABLE_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const TimetableEntrySchema = new mongoose.Schema(
  {
    day: { type: String, enum: TIMETABLE_DAYS, required: true },
    subject: { type: String, required: true },
    time: { type: String, required: true },
    room: { type: String, default: '' },
    faculty: { type: String, default: '' },
    type: { type: String, default: 'lecture' },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

TimetableEntrySchema.index({ day: 1, order: 1 });

TimetableEntrySchema.method('toJSON', function toJSON() {
  const obj = this.toObject({ virtuals: true });
  obj.id = obj._id.toString();
  delete obj._id;
  delete obj.__v;
  return obj;
});

export default mongoose.model('TimetableEntry', TimetableEntrySchema);
