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
  "bribery/corruption": "corruption",
  "bribe/corruption": "corruption",
  road: "infrastructure",
  roads: "infrastructure",
  pothole: "infrastructure",
  potholes: "infrastructure",
  "road/pothole": "infrastructure",
  "roads/potholes": "infrastructure",
  infrastructure: "infrastructure",
  waste: "sanitation",
  garbage: "sanitation",
  trash: "sanitation",
  "waste management": "sanitation",
  streetlight: "electricity",
  streetlights: "electricity",
  power: "electricity",
  "water supply": "water",
};

export const STATUSES = ["pending", "in-progress", "resolved", "rejected"];

export const STATUS_ALIASES = {
  open: "pending",
  inprogress: "in-progress",
  in_progress: "in-progress",
  "in progress": "in-progress",
  ongoing: "in-progress",
  closed: "resolved",
  done: "resolved",
};

export const PRIORITIES = ["low", "medium", "high"];

export const ROLES = ["citizen", "authority", "admin"];

export const STAFF_ROLES = ["authority", "admin"];

export const COMMUNITY_CATEGORIES = [
  "general",
  "environment",
  "infrastructure",
  "water",
  "electricity",
  "sanitation",
  "safety",
  "corruption",
  "other",
];

export const COMMUNITY_CATEGORY_ALIASES = {
  general: "general",
  community: "general",
  environment: "environment",
  environmental: "environment",
  infrastructure: "infrastructure",
  water: "water",
  electricity: "electricity",
  sanitation: "sanitation",
  garbage: "sanitation",
  safety: "safety",
  corruption: "corruption",
  bribery: "corruption",
  other: "other",
};

export const CATEGORY_LABELS = {
  corruption: "Corruption",
  infrastructure: "Infrastructure",
  water: "Water",
  electricity: "Electricity",
  sanitation: "Sanitation",
  safety: "Safety",
  other: "Other",
};

export const STATUS_LABELS = {
  pending: "Pending",
  "in-progress": "In Progress",
  resolved: "Resolved",
  rejected: "Rejected",
};

export const PRIORITY_LABELS = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

export const COMMUNITY_CATEGORY_LABELS = {
  general: "General",
  environment: "Environment",
  infrastructure: "Infrastructure",
  water: "Water",
  electricity: "Electricity",
  sanitation: "Sanitation",
  safety: "Safety",
  corruption: "Corruption",
  other: "Other",
};

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

export const normalizePriority = (value) => {
  const key = String(value || "").toLowerCase().trim();
  return PRIORITIES.includes(key) ? key : "medium";
};

export const isKnownPriority = (value) => {
  const key = String(value || "").toLowerCase().trim();
  return PRIORITIES.includes(key);
};

export const normalizeCommunityCategory = (value) => {
  if (!value) return "general";
  const key = String(value).toLowerCase().trim();
  if (COMMUNITY_CATEGORY_ALIASES[key]) return COMMUNITY_CATEGORY_ALIASES[key];
  return COMMUNITY_CATEGORIES.includes(key) ? key : "general";
};

export const isKnownCommunityCategory = (value) => {
  const key = String(value || "").toLowerCase().trim();
  return COMMUNITY_CATEGORIES.includes(key) || Boolean(COMMUNITY_CATEGORY_ALIASES[key]);
};

export const normalizeVisibility = (value, isPrivate = false) => {
  if (isPrivate === true) return "private";
  const key = String(value || "").toLowerCase().trim();
  return key === "private" ? "private" : "public";
};

export const categoryLabel = (value) => CATEGORY_LABELS[normalizeCategory(value)] || "Other";
export const statusLabel = (value) => STATUS_LABELS[normalizeStatus(value)] || "Pending";
export const priorityLabel = (value) => PRIORITY_LABELS[normalizePriority(value)] || "Medium";
export const communityCategoryLabel = (value) =>
  COMMUNITY_CATEGORY_LABELS[normalizeCommunityCategory(value)] || "General";
