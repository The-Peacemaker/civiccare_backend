import mongoose from "mongoose";

// One row per user per complaint — the unique index is what prevents
// double voting, including from anonymous (guest) users.
const upvoteSchema = new mongoose.Schema(
  {
    complaint: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Complaint",
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

upvoteSchema.index({ complaint: 1, user: 1 }, { unique: true });
upvoteSchema.index({ user: 1, createdAt: -1 });

const Upvote = mongoose.model("Upvote", upvoteSchema);

export default Upvote;
