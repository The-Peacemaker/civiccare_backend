import Upvote from "../models/Upvote.js";

export const findOne = (complaintId, userId) =>
  Upvote.findOne({ complaint: complaintId, user: userId });

export const create = (complaintId, userId) =>
  Upvote.create({ complaint: complaintId, user: userId });

export const remove = (complaintId, userId) =>
  Upvote.findOneAndDelete({ complaint: complaintId, user: userId });

export const countByComplaint = (complaintId) => Upvote.countDocuments({ complaint: complaintId });

export const stateForUser = async (complaintId, userId) => {
  if (!userId) return false;
  const existing = await findOne(complaintId, userId);
  return Boolean(existing);
};

export const deleteByComplaint = (complaintId) => Upvote.deleteMany({ complaint: complaintId });
