import * as complaintRepo from "../repositories/complaintRepository.js";

const ALLOWED_CATEGORIES = ["road", "water", "waste", "electricity", "safety", "other"];
const ALLOWED_STATUS = ["pending", "in-progress", "resolved", "rejected"];

export const createComplaint = async (payload) => {
  const data = {
    title: payload.title?.trim(),
    description: payload.description?.trim(),
    category: payload.category || "other",
    location: payload.location?.trim(),
    isAnonymous: payload.isAnonymous ?? true,
    reportedBy: payload.isAnonymous === false ? payload.reportedBy?.trim() || "" : "",
    imageUrl: payload.imageUrl?.trim() || "",
  };
  return complaintRepo.create(data);
};

export const listComplaints = async (query) => {
  const filter = {};
  if (query.status && ALLOWED_STATUS.includes(query.status)) filter.status = query.status;
  if (query.category && ALLOWED_CATEGORIES.includes(query.category))
    filter.category = query.category;

  const limit = Math.min(parseInt(query.limit, 10) || 50, 100);
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    complaintRepo.findAll(filter, { limit, skip }),
    complaintRepo.countAll(filter),
  ]);

  return { items, total, page, limit };
};

export const getComplaint = (id) => complaintRepo.findById(id);

export const updateComplaint = (id, payload) => {
  // Never allow direct upvote manipulation via PATCH
  const { upvotes, _id, createdAt, updatedAt, __v, ...rest } = payload;
  const clean = { ...rest };
  if (typeof clean.reportedBy === "string") clean.reportedBy = clean.reportedBy.trim();
  if (typeof clean.title === "string") clean.title = clean.title.trim();
  if (typeof clean.description === "string") clean.description = clean.description.trim();
  if (typeof clean.location === "string") clean.location = clean.location.trim();
  return complaintRepo.updateById(id, clean);
};

export const deleteComplaint = (id) => complaintRepo.deleteById(id);

export const upvoteComplaint = (id) => complaintRepo.incrementUpvotes(id);
