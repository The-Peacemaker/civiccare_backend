import mongoose from "mongoose";
import { ROLES } from "../config/constants.js";

// Every actor (Google user, password user or anonymous guest) has a User record.
// Anonymous reporting hides this identity from the public API — it is never
// deleted, so admins can still trace a report back to its author.
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      unique: true,
      sparse: true,
    },
    passwordHash: {
      type: String,
      select: false,
    },
    authProvider: {
      type: String,
      enum: ["google", "password", "guest"],
      default: "guest",
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true,
    },
    avatarUrl: {
      type: String,
      trim: true,
      default: "",
    },
    role: {
      type: String,
      enum: ROLES,
      default: "citizen",
    },
    isGuest: {
      type: Boolean,
      default: false,
    },
    // Public-facing alias for anonymous posters, e.g. "Anonymous User 525".
    anonymousHandle: {
      type: String,
      trim: true,
      default: "",
      maxlength: [50, "Handle cannot exceed 50 characters"],
    },
  },
  { timestamps: true }
);

userSchema.index({ role: 1 });

const User = mongoose.model("User", userSchema);

export default User;
