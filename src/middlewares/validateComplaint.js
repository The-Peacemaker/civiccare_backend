import {
  isKnownCategory,
  isKnownPriority,
  isKnownStatus,
  normalizeCategory,
  normalizePriority,
  normalizeStatus,
} from "../config/constants.js";

const locationText = (location) => {
  if (typeof location === "string") return location.trim();
  if (location && typeof location === "object") return String(location.text || location.label || "").trim();
  return "";
};

const fail = (res, errors) =>
  res.status(400).json({ success: false, message: "Validation failed", errors });

const isPositiveInt = (value) => value === undefined || /^\d+$/.test(String(value));

const validCoords = (coords) => {
  if (!coords || typeof coords !== "object") return true;
  const lat = Number(coords.lat ?? coords.latitude);
  const lng = Number(coords.lng ?? coords.lon ?? coords.longitude);
  if (coords.lat !== undefined || coords.latitude !== undefined) {
    if (!Number.isFinite(lat) || lat < -90 || lat > 90) return false;
  }
  if (coords.lng !== undefined || coords.longitude !== undefined) {
    if (!Number.isFinite(lng) || lng < -180 || lng > 180) return false;
  }
  return true;
};

const validImageUrls = (value) =>
  value === undefined ||
  (Array.isArray(value) &&
    value.every((item) => typeof item === "string" && item.trim().length > 0));

export const validateComplaint = (req, res, next) => {
  const body = req.body || {};
  const errors = [];

  if (!body.title || !String(body.title).trim()) errors.push("title is required");
  if (!body.description || !String(body.description).trim()) errors.push("description is required");
  if (!locationText(body.location)) errors.push("location is required");

  if (body.category !== undefined && !isKnownCategory(body.category)) {
    errors.push("category is invalid");
  }
  if (body.priority !== undefined && !isKnownPriority(body.priority)) {
    errors.push("priority must be low, medium or high");
  }
  if (!validImageUrls(body.imageUrls)) {
    errors.push("imageUrls must be an array of strings");
  }
  if (!validCoords(body.coords || body.coordinates)) {
    errors.push("coords must contain a valid lat (-90..90) and lng (-180..180)");
  }

  if (errors.length) return fail(res, errors);

  if (body.category !== undefined) body.category = normalizeCategory(body.category);
  if (body.priority !== undefined) body.priority = normalizePriority(body.priority);
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
  if (body.priority !== undefined && !isKnownPriority(body.priority)) {
    errors.push("priority must be low, medium or high");
  }
  if (!validImageUrls(body.imageUrls)) {
    errors.push("imageUrls must be an array of strings");
  }
  if (!validCoords(body.coords || body.coordinates)) {
    errors.push("coords must contain a valid lat (-90..90) and lng (-180..180)");
  }
  if (body.assignedTo !== undefined && body.assignedTo !== null) {
    if (!/^[a-f\d]{24}$/i.test(String(body.assignedTo))) errors.push("assignedTo must be a valid user id");
  }

  if (errors.length) return fail(res, errors);

  if (body.category !== undefined) body.category = normalizeCategory(body.category);
  if (body.status !== undefined) body.status = normalizeStatus(body.status);
  if (body.priority !== undefined) body.priority = normalizePriority(body.priority);
  next();
};

export const validateComplaintQuery = (req, res, next) => {
  const query = req.query || {};
  const errors = [];

  if (query.category && query.category !== "all" && !isKnownCategory(query.category)) {
    errors.push("category is invalid");
  }
  if (query.status && query.status !== "all" && !isKnownStatus(query.status)) {
    errors.push("status is invalid");
  }
  if (query.priority && query.priority !== "all" && !isKnownPriority(query.priority)) {
    errors.push("priority is invalid");
  }
  if (!isPositiveInt(query.page)) errors.push("page must be a positive integer");
  if (!isPositiveInt(query.limit)) errors.push("limit must be a positive integer");

  if (errors.length) return fail(res, errors);
  next();
};

export const validateComment = (req, res, next) => {
  const body = req.body || {};
  const text = String(body.body || "").trim();
  if (!text) return fail(res, ["comment body is required"]);
  if (text.length > 2000) return fail(res, ["comment cannot exceed 2000 characters"]);
  if (body.isAnonymous !== undefined && typeof body.isAnonymous !== "boolean") {
    return fail(res, ["isAnonymous must be a boolean"]);
  }
  req.body.body = text;
  next();
};

export const validateNotificationQuery = (req, res, next) => {
  const query = req.query || {};
  const errors = [];
  if (query.unread !== undefined && !["true", "false"].includes(String(query.unread))) {
    errors.push("unread must be true or false");
  }
  if (!isPositiveInt(query.page)) errors.push("page must be a positive integer");
  if (!isPositiveInt(query.limit)) errors.push("limit must be a positive integer");
  if (errors.length) return fail(res, errors);
  next();
};

export const notFound = (req, res) => {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` });
};

// Central error handler - registered last in app.js
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
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({ success: false, message: "File is too large" });
  }
  console.error(err);
  res.status(500).json({
    success: false,
    message:
      process.env.NODE_ENV === "production"
        ? "Internal server error"
        : err.message || "Internal server error",
  });
};
