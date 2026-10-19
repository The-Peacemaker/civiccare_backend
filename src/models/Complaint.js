import mongoose from "mongoose";
import { CATEGORIES, PRIORITIES, STATUSES } from "../config/constants.js";

const complaintSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [150, "Title cannot exceed 150 characters"],
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
      maxlength: [5000, "Description cannot exceed 5000 characters"],
    },
    category: {
      type: String,
      enum: CATEGORIES,
      default: "other",
    },
    location: {
      text: {
        type: String,
        required: [true, "Location is required"],
        trim: true,
        maxlength: [300, "Location cannot exceed 300 characters"],
      },
      district: {
        type: String,
        trim: true,
        default: "",
        maxlength: [100, "District cannot exceed 100 characters"],
      },
      latitude: { type: Number, default: null },
      longitude: { type: Number, default: null },
    },
    status: {
      type: String,
      enum: STATUSES,
      default: "pending",
    },
    priority: {
      type: String,
      enum: PRIORITIES,
      default: "medium",
    },
    // Identity is ALWAYS stored for admin traceability.
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    // Controls ONLY public visibility. Never deletes the author link.
    isAnonymous: {
      type: Boolean,
      default: true,
    },
    imageUrls: {
      type: [String],
      default: [],
    },
    upvoteCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    commentCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Feed, map and dashboard query support.
complaintSchema.index({ status: 1, createdAt: -1 });
complaintSchema.index({ category: 1, createdAt: -1 });
complaintSchema.index({ priority: 1, createdAt: -1 });
complaintSchema.index({ "location.district": 1, createdAt: -1 });
complaintSchema.index({ upvoteCount: -1, createdAt: -1 });
complaintSchema.index({ "location.latitude": 1, "location.longitude": 1 });

const Complaint = mongoose.model("Complaint", complaintSchema);

export default Complaint;
