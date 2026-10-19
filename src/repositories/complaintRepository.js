import Complaint from "../models/Complaint.js";

// Thin data-access layer so controllers/services never touch Mongoose directly.

export const create = (data) => Complaint.create(data);

export const findAll = (filter = {}, options = {}) => {
  const { limit = 50, skip = 0 } = options;
  return Complaint.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit);
};

export const countAll = (filter = {}) => Complaint.countDocuments(filter);

export const findById = (id) => Complaint.findById(id);

export const updateById = (id, data) =>
  Complaint.findByIdAndUpdate(id, data, { new: true, runValidators: true });

export const deleteById = (id) => Complaint.findByIdAndDelete(id);

export const incrementUpvotes = (id) =>
  Complaint.findByIdAndUpdate(id, { $inc: { upvotes: 1 } }, { new: true });
