import mongoose from "mongoose";
import * as complaintService from "../services/complaintService.js";
import * as commentService from "../services/commentService.js";

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

export const listComplaints = async (req, res, next) => {
  try {
    const result = await complaintService.listAdminComplaints(req.query);
    res.status(200).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

export const getComplaint = async (req, res, next) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid complaint id" });
    }
    const data = await complaintService.getComplaintAdmin(req.params.id);
    if (!data) return res.status(404).json({ success: false, message: "Complaint not found" });
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

export const listComments = async (req, res, next) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid complaint id" });
    }
    const result = await commentService.listCommentsAdmin(req.params.id);
    res.status(200).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};
