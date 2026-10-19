import {
  isKnownCategory,
  isKnownStatus,
  normalizeCategory,
  normalizeStatus,
} from "../config/constants.js";

const locationText = (location) => {
  if (typeof location === "string") return location.trim();
  if (location && typeof location === "object") return String(location.text || location.label || "").trim();
  return "";
};

const fail = (res, errors) =>
  res.status(400).json({ success: false, message: "Validation failed", errors });

export const validateComplaint = (req, res, next) => {
  const body = req.body || {};
  const errors = [];

  if (!body.title || !String(body.title).trim()) errors.push("title is required");
  if (!body.description || !String(body.description).trim()) errors.push("description is required");
  if (!locationText(body.location)) errors.push("location is required");

  if (body.category !== undefined && !isKnownCategory(body.category)) {
    errors.push("category is invalid");
  }
  if (body.priority !== undefined && !["low", "medium", "high"].includes(body.priority)) {
    errors.push("priority must be low, medium or high");
  }
  if (body.imageUrls !== undefined && !Array.isArray(body.imageUrls)) {
    errors.push("imageUrls must be an array");
  }

  if (errors.length) return fail(res, errors);

  if (body.category !== undefined) body.category = normalizeCategory(body.category);
  next();
};

export const validateComplaintUpdate = (req, res, next) => {
  const body = req.body || {};
  const errors = [];

  if (body.title !== undefined && !String(body.title).trim()) errors.push("title cannot be empty");
  if (body.description !== undefined && !String(body.description).trim()) {
    errors.push("description cannot be empty");
  }
  if (body.location !== undefined && !locationText(body.location)) {
    errors.push("location cannot be empty");
  }
  if (body.category !== undefined && !isKnownCategory(body.category)) {
    errors.push("category is invalid");
  }
  if (body.status !== undefined && !isKnownStatus(body.status)) {
    errors.push("status is invalid");
  }
  if (body.priority !== undefined && !["low", "medium", "high"].includes(body.priority)) {
    errors.push("priority must be low, medium or high");
  }
  if (body.imageUrls !== undefined && !Array.isArray(body.imageUrls)) {
    errors.push("imageUrls must be an array");
  }

  if (errors.length) return fail(res, errors);

  if (body.category !== undefined) body.category = normalizeCategory(body.category);
  if (body.status !== undefined) body.status = normalizeStatus(body.status);
  next();
};

export const validateComment = (req, res, next) => {
  if (!req.body?.body || !String(req.body.body).trim()) {
    return fail(res, ["comment body is required"]);
  }
  next();
};

export const notFound = (req, res) => {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` });
};

// Central error handler — registered last in app.js
// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, next) => {
  if (err.statusCode) {
    return res.status(err.statusCode).json({ success: false, message: err.message });
  }
  if (err.name === "CastError") {
    return res.status(400).json({ success: false, message: "Invalid id" });
  }
  if (err.name === "ValidationError") {
    const errors = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ success: false, message: "Validation failed", errors });
  }
  if (err.code === 11000) {
    return res.status(409).json({ success: false, message: "Duplicate entry" });
  }
  console.error(err);
  res.status(500).json({ success: false, message: err.message || "Internal server error" });
};
