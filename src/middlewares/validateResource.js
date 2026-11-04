import { isKnownCategory, normalizeCategory } from "../config/constants.js";
import { RESOURCE_TYPES } from "../models/Resource.js";

const URL_RE = /^https?:\/\/\S+$/i;
const PHONE_RE = /^[+()\-\s\d]{6,25}$/;

const fail = (res, errors) =>
  res.status(400).json({ success: false, message: "Validation failed", errors });

const check = (body, errors, { partial }) => {
  if (!partial || body.title !== undefined) {
    const title = String(body.title || "").trim();
    if (!title) errors.push("title is required");
    else if (title.length > 150) errors.push("title cannot exceed 150 characters");
  }
  if (body.description !== undefined && String(body.description).length > 2000) {
    errors.push("description cannot exceed 2000 characters");
  }
  if (body.category !== undefined && !isKnownCategory(body.category)) {
    errors.push("category is invalid");
  }
  if (body.type !== undefined && !RESOURCE_TYPES.includes(body.type)) {
    errors.push(`type must be one of: ${RESOURCE_TYPES.join(", ")}`);
  }
  if (body.url !== undefined && body.url !== "" && !URL_RE.test(String(body.url))) {
    errors.push("url must be a valid http(s) URL");
  }
  if (body.phone !== undefined && body.phone !== "" && !PHONE_RE.test(String(body.phone))) {
    errors.push("phone must be a valid phone number");
  }
  if (body.district !== undefined && String(body.district).length > 100) {
    errors.push("district cannot exceed 100 characters");
  }
  if (body.address !== undefined && String(body.address).length > 300) {
    errors.push("address cannot exceed 300 characters");
  }
};

export const validateResource = (req, res, next) => {
  const body = req.body || {};
  const errors = [];
  check(body, errors, { partial: false });
  if (errors.length) return fail(res, errors);

  body.title = String(body.title).trim();
  body.category = normalizeCategory(body.category);
  next();
};

export const validateResourceUpdate = (req, res, next) => {
  const body = req.body || {};
  const errors = [];
  check(body, errors, { partial: true });
  if (errors.length) return fail(res, errors);

  if (body.title !== undefined) body.title = String(body.title).trim();
  if (body.category !== undefined) body.category = normalizeCategory(body.category);
  next();
};
