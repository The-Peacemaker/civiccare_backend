// Shared domain constants + normalisation helpers.
// Keep these in one place so models, validation and services never drift apart.

export const CATEGORIES = [
  "corruption",
  "infrastructure",
  "water",
  "electricity",
  "sanitation",
  "safety",
  "other",
];

// Values the UI / older clients may send -> canonical category.
export const CATEGORY_ALIASES = {
  bribe: "corruption",
  bribery: "corruption",
  road: "infrastructure",
  roads: "infrastructure",
  pothole: "infrastructure",
  potholes: "infrastructure",
  waste: "sanitation",
  garbage: "sanitation",
  trash: "sanitation",
  streetlight: "electricity",
  streetlights: "electricity",
  power: "electricity",
};

export const STATUSES = ["pending", "in-progress", "resolved", "rejected"];

export const STATUS_ALIASES = {
  open: "pending",
  inprogress: "in-progress",
  in_progress: "in-progress",
  ongoing: "in-progress",
  closed: "resolved",
  done: "resolved",
};

export const PRIORITIES = ["low", "medium", "high"];

export const ROLES = ["citizen", "authority", "admin"];

export const STAFF_ROLES = ["authority", "admin"];

export const normalizeCategory = (value) => {
  if (!value) return "other";
  const key = String(value).toLowerCase().trim();
  return CATEGORY_ALIASES[key] || (CATEGORIES.includes(key) ? key : "other");
};

export const normalizeStatus = (value) => {
  if (!value) return "pending";
  const key = String(value).toLowerCase().trim();
  return STATUS_ALIASES[key] || (STATUSES.includes(key) ? key : "pending");
};

export const isStaff = (user) => Boolean(user && STAFF_ROLES.includes(user.role));

export const isKnownCategory = (value) => {
  const key = String(value || "").toLowerCase().trim();
  return CATEGORIES.includes(key) || Boolean(CATEGORY_ALIASES[key]);
};

export const isKnownStatus = (value) => {
  const key = String(value || "").toLowerCase().trim();
  return STATUSES.includes(key) || Boolean(STATUS_ALIASES[key]);
};
