import mongoose from "mongoose";
import User from "../models/User.js";

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

// Finds (or lazily creates) the shared guest used while the real auth flow
// from the auth teammate is not wired in yet.
const DEV_GUEST_HANDLE = "Anonymous User 000";

const getOrCreateDevGuest = async () => {
  let user = await User.findOne({ authProvider: "guest", anonymousHandle: DEV_GUEST_HANDLE });
  if (!user) {
    user = await User.create({
      name: "Anonymous User",
      authProvider: "guest",
      isGuest: true,
      role: "citizen",
      anonymousHandle: DEV_GUEST_HANDLE,
    });
  }
  return user;
};

// Auth-agnostic: if the auth module already set req.user, we respect it.
// Otherwise, in development only, allow `x-user-id` (or fall back to a dev guest)
// so the API is testable from Postman before the auth branch is merged.
export const resolveCurrentUser = async (req, res, next) => {
  try {
    if (req.user) return next();

    const allowDevAuth = process.env.ALLOW_DEV_AUTH === "true";
    if (!allowDevAuth) return next();

    const headerId = req.header("x-user-id");
    if (headerId && isValidId(headerId)) {
      req.user = await User.findById(headerId);
      if (req.user) return next();
    }

    req.user = await getOrCreateDevGuest();
    next();
  } catch (err) {
    next(err);
  }
};

export const requireAuth = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: "Authentication required" });
  }
  next();
};

export const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: "Authentication required" });
  }
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ success: false, message: "Insufficient permissions" });
  }
  next();
};
