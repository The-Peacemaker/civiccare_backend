import mongoose from "mongoose";
import { COMMUNITY_CATEGORIES } from "../config/constants.js";

const communitySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Community name is required"],
      trim: true,
      unique: true,
      maxlength: [120, "Community name cannot exceed 120 characters"],
    },
    description: {
      type: String,
      trim: true,
      default: "",
      maxlength: [1000, "Description cannot exceed 1000 characters"],
    },
    category: { type: String, enum: COMMUNITY_CATEGORIES, default: "general" },
    visibility: { type: String, enum: ["public", "private"], default: "public" },
    // Frontend uses a free-text location ("Green Valley, NY"); district is kept
    // for filtering and map/report compatibility.
    location: { type: String, trim: true, default: "", maxlength: 200 },
    district: { type: String, trim: true, default: "", maxlength: 100 },
    avatarUrl: { type: String, trim: true, default: "" },
    icon: { type: String, trim: true, default: "" },
    cover: { type: String, trim: true, default: "" },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    memberCount: { type: Number, default: 0, min: 0 },
    postCount: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

communitySchema.index({ category: 1, createdAt: -1 });
communitySchema.index({ district: 1, createdAt: -1 });
communitySchema.index({ visibility: 1, createdAt: -1 });

const Community = mongoose.model("Community", communitySchema);

export default Community;
