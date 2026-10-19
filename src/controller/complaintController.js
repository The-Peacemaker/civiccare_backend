import mongoose from "mongoose";
import * as complaintService from "../services/complaintService.js";

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

export const createComplaint = async (req, res, next) => {
  try {
    const complaint = await complaintService.createComplaint(req.body);
    res.status(201).json({ success: true, message: "Complaint reported", data: complaint });
  } catch (err) {
    // Mongoose validation errors -> 400 with readable messages
    if (err.name === "ValidationError") {
      const errors = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: "Validation failed", errors });
    }
    next(err);
  }
};

export const getComplaints = async (req, res, next) => {
  try {
    const result = await complaintService.listComplaints(req.query);
    res.status(200).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

export const getComplaintById = async (req, res, next) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid complaint id" });
    }
    const complaint = await complaintService.getComplaint(req.params.id);
    if (!complaint) {
      return res.status(404).json({ success: false, message: "Complaint not found" });
    }
    res.status(200).json({ success: true, data: complaint });
  } catch (err) {
    next(err);
  }
};

export const updateComplaint = async (req, res, next) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid complaint id" });
    }
    const complaint = await complaintService.updateComplaint(req.params.id, req.body);
    if (!complaint) {
      return res.status(404).json({ success: false, message: "Complaint not found" });
    }
    res.status(200).json({ success: true, message: "Complaint updated", data: complaint });
  } catch (err) {
    if (err.name === "ValidationError") {
      const errors = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: "Validation failed", errors });
    }
    next(err);
  }
};

export const deleteComplaint = async (req, res, next) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid complaint id" });
    }
    const complaint = await complaintService.deleteComplaint(req.params.id);
    if (!complaint) {
      return res.status(404).json({ success: false, message: "Complaint not found" });
    }
    res.status(200).json({ success: true, message: "Complaint deleted", data: complaint });
  } catch (err) {
    next(err);
  }
};

export const upvoteComplaint = async (req, res, next) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid complaint id" });
    }
    const complaint = await complaintService.upvoteComplaint(req.params.id);
    if (!complaint) {
      return res.status(404).json({ success: false, message: "Complaint not found" });
    }
    res.status(200).json({ success: true, message: "Upvoted", data: complaint });
  } catch (err) {
    next(err);
  }
};
