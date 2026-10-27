import * as complaintRepo from "../repositories/complaintRepository.js";
import * as commentRepo from "../repositories/commentRepository.js";
import * as upvoteRepo from "../repositories/upvoteRepository.js";
import * as statusHistoryRepo from "../repositories/statusHistoryRepository.js";
import { toAdminComplaint, toPublicComplaint } from "../serializers/complaintSerializer.js";
import { notifyStatusChange } from "./notificationService.js";
import {
  STAFF_ROLES,
  isKnownPriority,
  normalizeCategory,
  normalizePriority,
  normalizeStatus,
} from "../config/constants.js";

const httpError = (statusCode, message) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
};

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Accepts `location` as a plain string or as an object from the Post form,
// plus an optional `coords` object ({lat,lng}) from the report modal.
const normalizeLocation = (location, coords) => {
  const out = { text: "", district: "", latitude: null, longitude: null };
  if (typeof location === "string") {
    out.text = location.trim();
  } else if (location && typeof location === "object") {
    out.text = String(location.text || location.label || "").trim();
    out.district = String(location.district || "").trim();
    out.latitude = Number.isFinite(Number(location.latitude)) ? Number(location.latitude) : null;
    out.longitude = Number.isFinite(Number(location.longitude)) ? Number(location.longitude) : null;
  }
  const lat = coords?.lat ?? coords?.latitude;
  const lng = coords?.lng ?? coords?.lon ?? coords?.longitude;
  if (Number.isFinite(Number(lat))) out.latitude = Number(lat);
  if (Number.isFinite(Number(lng))) out.longitude = Number(lng);
  return out;
};

// Accepts imageUrls[] or a single image/photo URL string from older clients.
const collectImages = (payload) => {
  if (Array.isArray(payload.imageUrls)) {
    return payload.imageUrls.filter(Boolean).map(String).slice(0, 10);
  }
  const single = payload.imageUrl || payload.image || payload.photo;
  if (typeof single === "string" && single.trim()) return [single.trim()];
  return [];
};

const buildFilter = (query) => {
  const filter = {};

  if (query.category && query.category !== "all") {
    filter.category = normalizeCategory(query.category);
  }
  if (query.status && query.status !== "all") {
    filter.status = normalizeStatus(query.status);
  }
  if (query.priority && isKnownPriority(query.priority)) {
    filter.priority = normalizePriority(query.priority);
  }
  if (query.district) {
    filter["location.district"] = new RegExp(`^${escapeRegex(query.district)}$`, "i");
  }
  if (query.q) {
    const rx = new RegExp(escapeRegex(query.q).slice(0, 100), "i");
    filter.$or = [{ title: rx }, { description: rx }];
  }
  return filter;
};

const SORT_MAP = {
  latest: { createdAt: -1 },
  oldest: { createdAt: 1 },
  popular: { upvoteCount: -1, createdAt: -1 },
  trending: { upvoteCount: -1, commentCount: -1, createdAt: -1 },
};

const parsePagination = (query) => {
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || 20, 1), 100);
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  return { limit, page, skip: (page - 1) * limit };
};

export const createComplaint = async (payload, user) => {
  if (!user) throw httpError(401, "Authentication required");

  const isGuest = Boolean(user.isGuest);
  const data = {
    title: String(payload.title).trim(),
    description: String(payload.description).trim(),
    category: normalizeCategory(payload.category),
    location: normalizeLocation(payload.location, payload.coords || payload.coordinates),
    priority: normalizePriority(payload.priority),
    author: user._id,
    // Guests can never be publicly identified; logged-in users choose.
    isAnonymous: isGuest ? true : payload.isAnonymous !== false,
    imageUrls: collectImages(payload),
  };

  const complaint = await complaintRepo.create(data);
  await statusHistoryRepo.create({
    complaint: complaint._id,
    oldStatus: null,
    newStatus: complaint.status,
    changedBy: user._id,
    note: "Report created",
  });

  return toPublicComplaint(await complaintRepo.findById(complaint._id));
};

export const listComplaints = async (query, currentUser) => {
  const filter = buildFilter(query);
  if (query.author === "me" && currentUser) filter.author = currentUser._id;

  const { limit, page, skip } = parsePagination(query);
  const sort = SORT_MAP[query.sort] || SORT_MAP.latest;

  const [items, total] = await Promise.all([
    complaintRepo.findAll(filter, { limit, skip, sort }),
    complaintRepo.countAll(filter),
  ]);

  const serialized = await Promise.all(
    items.map(async (item) => {
      const data = toPublicComplaint(item);
      data.hasUpvoted = await upvoteRepo.stateForUser(item._id, currentUser?._id);
      data.liked = data.hasUpvoted;
      return data;
    })
  );

  return { items: serialized, total, page, limit };
};

export const listAdminComplaints = async (query) => {
  const filter = buildFilter(query);
  const { limit, page, skip } = parsePagination(query);
  const sort = SORT_MAP[query.sort] || SORT_MAP.latest;

  const [items, total] = await Promise.all([
    complaintRepo.findAll(filter, { limit, skip, sort }),
    complaintRepo.countAll(filter),
  ]);

  return { items: items.map(toAdminComplaint), total, page, limit };
};

export const getComplaint = async (id, currentUser) => {
  const complaint = await complaintRepo.findById(id);
  if (!complaint) return null;
  const data = toPublicComplaint(complaint);
  data.hasUpvoted = await upvoteRepo.stateForUser(id, currentUser?._id);
  data.liked = data.hasUpvoted;
  return data;
};

export const getComplaintAdmin = async (id) => {
  const complaint = await complaintRepo.findById(id);
  if (!complaint) return null;
  const data = toAdminComplaint(complaint);
  data.statusHistory = await statusHistoryRepo.findByComplaint(id);
  return data;
};

export const getStatusHistory = (id) => statusHistoryRepo.findByComplaint(id);

export const updateComplaint = async (id, payload, user) => {
  const complaint = await complaintRepo.findById(id);
  if (!complaint) return null;

  const isOwner = String(complaint.author?._id || complaint.author) === String(user._id);
  const isStaff = STAFF_ROLES.includes(user.role);
  if (!isOwner && !isStaff) throw httpError(403, "You cannot edit this report");

  const data = {};
  if (payload.title !== undefined) data.title = String(payload.title).trim();
  if (payload.description !== undefined) data.description = String(payload.description).trim();
  if (payload.category !== undefined) data.category = normalizeCategory(payload.category);
  if (payload.location !== undefined || payload.coords !== undefined || payload.coordinates !== undefined) {
    data.location = normalizeLocation(payload.location, payload.coords || payload.coordinates);
  }
  if (payload.imageUrls !== undefined || payload.image !== undefined || payload.photo !== undefined) {
    data.imageUrls = collectImages(payload);
  }
  if (payload.priority !== undefined) {
    if (!isStaff) throw httpError(403, "Only staff can change priority");
    data.priority = normalizePriority(payload.priority);
  }
  // Owners of a non-guest account may toggle their public anonymity.
  if (payload.isAnonymous !== undefined && !complaint.author?.isGuest) {
    if (isOwner || isStaff) data.isAnonymous = Boolean(payload.isAnonymous);
  }

  const oldStatus = complaint.status;
  let statusChanged = false;

  if (payload.status !== undefined) {
    if (!isStaff) throw httpError(403, "Only staff can change status");
    const newStatus = normalizeStatus(payload.status);
    if (newStatus !== oldStatus) {
      data.status = newStatus;
      data.resolvedAt = newStatus === "resolved" ? new Date() : null;
      statusChanged = true;
    }
  }

  if (payload.assignedTo !== undefined && isStaff) {
    data.assignedTo = payload.assignedTo || null;
  }

  const updated = await complaintRepo.updateById(id, data);

  if (statusChanged) {
    await statusHistoryRepo.create({
      complaint: id,
      oldStatus,
      newStatus: data.status,
      changedBy: user._id,
      note: payload.note ? String(payload.note).slice(0, 500) : "",
    });
    await notifyStatusChange({ complaint: updated, actor: user, oldStatus, newStatus: data.status });
  }

  return isStaff ? toAdminComplaint(updated) : toPublicComplaint(updated);
};

export const deleteComplaint = async (id, user) => {
  const complaint = await complaintRepo.findById(id);
  if (!complaint) return null;

  const isOwner = String(complaint.author?._id || complaint.author) === String(user._id);
  const isStaff = STAFF_ROLES.includes(user.role);
  if (!isOwner && !isStaff) throw httpError(403, "You cannot delete this report");

  await Promise.all([
    complaintRepo.deleteById(id),
    commentRepo.deleteByComplaint(id),
    upvoteRepo.deleteByComplaint(id),
    statusHistoryRepo.deleteByComplaint(id),
  ]);

  return toAdminComplaint(complaint);
};

export const toggleUpvote = async (id, user) => {
  if (!user) throw httpError(401, "Authentication required");
  const complaint = await complaintRepo.findById(id);
  if (!complaint) return null;

  const existing = await upvoteRepo.findOne(id, user._id);
  let upvoted;
  if (existing) {
    await upvoteRepo.remove(id, user._id);
    await complaintRepo.incrementCounter(id, "upvoteCount", -1);
    upvoted = false;
  } else {
    await upvoteRepo.create(id, user._id);
    await complaintRepo.incrementCounter(id, "upvoteCount", 1);
    upvoted = true;
  }

  const fresh = await complaintRepo.findById(id);
  return { upvoted, upvoteCount: fresh.upvoteCount };
};
