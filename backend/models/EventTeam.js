import mongoose from 'mongoose';

const teamMemberSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    roll: { type: String, required: true, trim: true, maxlength: 50 },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    joinedAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const eventTeamSchema = new mongoose.Schema(
  {
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'HostelEvent', required: true, index: true },
    teamName: { type: String, required: true, trim: true, maxlength: 120 },
    teamCode: { type: String, required: true, unique: true, index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    maxSize: { type: Number, default: 4, min: 1, max: 8 },
    members: { type: [teamMemberSchema], default: [] },
  },
  { timestamps: true }
);

eventTeamSchema.index({ eventId: 1, teamName: 1 }, { unique: true });
eventTeamSchema.index({ eventId: 1, teamCode: 1 }, { unique: true });

export const EventTeam = mongoose.model('EventTeam', eventTeamSchema);
