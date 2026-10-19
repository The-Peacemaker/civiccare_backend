import mongoose from "mongoose";
import * as complaintService from "../services/complaintService.js";

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);
const invalidId = (res) => res.status(400).json({ success: false, message: "Invalid complaint id" });

export const createComplaint = async (req, res, next) => {
  try {
    const data = await complaintService.createComplaint(req.body, req.user);
    res.status(201).json({ success: true, message: "Complaint reported", data });
  } catch (err) {
    next(err);
  }
};

export const getComplaints = async (req, res, next) => {
  try {
    const result = await complaintService.listComplaints(req.query, req.user);
    res.status(200).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

export const getComplaintById = async (req, res, next) => {
  try {
    if (!isValidId(req.params.id)) return invalidId(res);
    const data = await complaintService.getComplaint(req.params.id, req.user);
    if (!data) return res.status(404).json({ success: false, message: "Complaint not found" });
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

export const updateComplaint = async (req, res, next) => {
  try {
    if (!isValidId(req.params.id)) return invalidId(res);
    const data = await complaintService.updateComplaint(req.params.id, req.body, req.user);
    if (!data) return res.status(404).json({ success: false, message: "Complaint not found" });
    res.status(200).json({ success: true, message: "Complaint updated", data });
  } catch (err) {
    next(err);
  }
};

export const deleteComplaint = async (req, res, next) => {
  try {
    if (!isValidId(req.params.id)) return invalidId(res);
    const data = await complaintService.deleteComplaint(req.params.id, req.user);
    if (!data) return res.status(404).json({ success: false, message: "Complaint not found" });
    res.status(200).json({ success: true, message: "Complaint deleted", data });
  } catch (err) {
    next(err);
  }
};

export const toggleUpvote = async (req, res, next) => {
  try {
    if (!isValidId(req.params.id)) return invalidId(res);
    const result = await complaintService.toggleUpvote(req.params.id, req.user);
    if (!result) return res.status(404).json({ success: false, message: "Complaint not found" });
    res.status(200).json({
      success: true,
      message: result.upvoted ? "Upvoted" : "Upvote removed",
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

export const getComplaintHistory = async (req, res, next) => {
  try {
    if (!isValidId(req.params.id)) return invalidId(res);
    const history = await complaintService.getStatusHistory(req.params.id);
    const items = history.map((h) => ({
      _id: h._id,
      oldStatus: h.oldStatus,
      newStatus: h.newStatus,
      note: h.note,
      changedBy: h.changedBy ? { name: h.changedBy.name, role: h.changedBy.role } : null,
      createdAt: h.createdAt,
    }));
    res.status(200).json({ success: true, items });
  } catch (err) {
    next(err);
  }
};
