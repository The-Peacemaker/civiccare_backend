import {
  isKnownCommunityCategory,
  normalizeCommunityCategory,
  normalizeVisibility,
} from "../config/constants.js";

const URL_RE = /^https?:\/\/\S+$/i;

const fail = (res, errors) =>
  res.status(400).json({ success: false, message: "Validation failed", errors });

const bool = (value) => value === true || value === "true";

const validateCommon = (body, errors, { partial }) => {
  if (!partial || body.name !== undefined) {
    const name = String(body.name || "").trim();
    if (!name) errors.push("name is required");
    else if (name.length > 120) errors.push("name cannot exceed 120 characters");
  }
  if (body.description !== undefined && String(body.description).length > 1000) {
    errors.push("description cannot exceed 1000 characters");
  }
  if (body.category !== undefined && !isKnownCommunityCategory(body.category)) {
    errors.push("category is invalid");
  }
  if (body.visibility !== undefined && !["public", "private"].includes(String(body.visibility).toLowerCase())) {
    errors.push("visibility must be public or private");
  }
  if (body.location !== undefined && String(body.location).length > 200) {
    errors.push("location cannot exceed 200 characters");
  }
  if (body.district !== undefined && String(body.district).length > 100) {
    errors.push("district cannot exceed 100 characters");
  }
  if (body.avatarUrl !== undefined && body.avatarUrl !== "" && !URL_RE.test(String(body.avatarUrl))) {
    errors.push("avatarUrl must be a valid URL");
  }
  if (body.cover !== undefined && String(body.cover).length > 200) {
    errors.push("cover cannot exceed 200 characters");
  }
  if (body.icon !== undefined && String(body.icon).length > 20) {
    errors.push("icon cannot exceed 20 characters");
  }
};

export const validateCommunity = (req, res, next) => {
  const body = req.body || {};
  const errors = [];
  validateCommon(body, errors, { partial: false });
  if (errors.length) return fail(res, errors);

  body.name = String(body.name).trim();
  body.category = normalizeCommunityCategory(body.category);
  body.visibility = normalizeVisibility(body.visibility, bool(body.isPrivate));
  next();
};

export const validateCommunityUpdate = (req, res, next) => {
  const body = req.body || {};
  const errors = [];
  validateCommon(body, errors, { partial: true });
  if (errors.length) return fail(res, errors);

  if (body.name !== undefined) body.name = String(body.name).trim();
  if (body.category !== undefined) body.category = normalizeCommunityCategory(body.category);
  if (body.visibility !== undefined || body.isPrivate !== undefined) {
    body.visibility = normalizeVisibility(body.visibility, bool(body.isPrivate));
  }
  next();
};
