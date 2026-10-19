import mongoose from "mongoose";
import { STATUSES } from "../config/constants.js";

// Audit trail for the admin workflow: pending -> in-progress -> resolved.
const statusHistorySchema = new mongoose.Schema(
  {
    complaint: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Complaint",
      required: true,
      index: true,
    },
    oldStatus: {
      type: String,
      enum: [...STATUSES, null],
      default: null,
    },
    newStatus: {
      type: String,
      enum: STATUSES,
      required: true,
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    note: {
      type: String,
      trim: true,
      default: "",
      maxlength: [500, "Note cannot exceed 500 characters"],
    },
  },
  { timestamps: true }
);

statusHistorySchema.index({ complaint: 1, createdAt: -1 });

const StatusHistory = mongoose.model("StatusHistory", statusHistorySchema);

export default StatusHistory;
