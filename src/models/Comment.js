import mongoose from "mongoose";

const commentSchema = new mongoose.Schema(
  {
    complaint: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Complaint",
      required: true,
      index: true,
    },
    // Always stored for moderation, even when displayed anonymously.
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    isAnonymous: {
      type: Boolean,
      default: false,
    },
    body: {
      type: String,
      required: [true, "Comment body is required"],
      trim: true,
      maxlength: [2000, "Comment cannot exceed 2000 characters"],
    },
  },
  { timestamps: true }
);

commentSchema.index({ complaint: 1, createdAt: -1 });

const Comment = mongoose.model("Comment", commentSchema);

export default Comment;
