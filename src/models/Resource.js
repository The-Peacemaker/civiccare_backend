import mongoose from "mongoose";
import { CATEGORIES } from "../config/constants.js";

const RESOURCE_TYPES = ["guide", "contact", "service", "link", "document"];

const resourceSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Resource title is required"],
      trim: true,
      maxlength: [150, "Title cannot exceed 150 characters"],
    },
    description: {
      type: String,
      trim: true,
      default: "",
      maxlength: [2000, "Description cannot exceed 2000 characters"],
    },
    category: { type: String, enum: CATEGORIES, default: "other" },
    type: { type: String, enum: RESOURCE_TYPES, default: "link" },
    url: { type: String, trim: true, default: "" },
    phone: { type: String, trim: true, default: "" },
    district: { type: String, trim: true, default: "", maxlength: 100 },
    address: { type: String, trim: true, default: "", maxlength: 300 },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

resourceSchema.index({ category: 1, createdAt: -1 });
resourceSchema.index({ district: 1, createdAt: -1 });
resourceSchema.index({ type: 1, createdAt: -1 });

const Resource = mongoose.model("Resource", resourceSchema);

export { RESOURCE_TYPES };
export default Resource;
