import StatusHistory from "../models/StatusHistory.js";

export const create = (data) => StatusHistory.create(data);

export const findByComplaint = (complaintId) =>
  StatusHistory.find({ complaint: complaintId })
    .populate({ path: "changedBy", select: "name role avatarUrl" })
    .sort({ createdAt: 1 });

export const deleteByComplaint = (complaintId) =>
  StatusHistory.deleteMany({ complaint: complaintId });
