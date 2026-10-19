import Comment from "../models/Comment.js";

const POPULATE = {
  path: "author",
  select: "name email avatarUrl role isGuest anonymousHandle",
};

export const create = (data) => Comment.create(data);

export const findByComplaint = (complaintId, { limit = 50, skip = 0 } = {}) =>
  Comment.find({ complaint: complaintId }).populate(POPULATE).sort({ createdAt: -1 }).skip(skip).limit(limit);

export const countByComplaint = (complaintId) => Comment.countDocuments({ complaint: complaintId });

export const findById = (id) => Comment.findById(id).populate(POPULATE);

export const deleteById = (id) => Comment.findByIdAndDelete(id);

export const deleteByComplaint = (complaintId) => Comment.deleteMany({ complaint: complaintId });
