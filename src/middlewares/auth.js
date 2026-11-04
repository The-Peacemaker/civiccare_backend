import mongoose from "mongoose";
import User from "../models/User.js";
import { verifyAccessToken } from "../services/authService.js";

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

// Finds (or lazily creates) the shared guest used while the real auth flow
// is not wired in yet. Never enabled in production.
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

// Auth-agnostic: a valid `Authorization: Bearer <accessToken>` wins.
// Otherwise, in development only, allow `x-user-id` (or fall back to a dev guest)
// so the API stays testable from Postman.
export const resolveCurrentUser = async (req, res, next) => {
  try {
    if (req.user) return next();

    const header = req.header("authorization") || "";
    if (header.startsWith("Bearer ")) {
      const token = header.slice(7).trim();
      try {
        const decoded = verifyAccessToken(token);
        if (decoded.type !== "access") throw new Error("wrong token type");
        const user = await User.findById(decoded.sub);
        if (!user) {
          return res.status(401).json({ success: false, message: "Account not found" });
        }
        req.user = user;
        return next();
      } catch {
        return res.status(401).json({ success: false, message: "Invalid or expired token" });
      }
    }

    const allowDevAuth =
      process.env.ALLOW_DEV_AUTH === "true" && process.env.NODE_ENV !== "production";
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
