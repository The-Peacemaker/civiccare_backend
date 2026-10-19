import mongoose from "mongoose";
import * as commentService from "../services/commentService.js";

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

export const addComment = async (req, res, next) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid complaint id" });
    }
    const data = await commentService.addComment(req.params.id, req.body, req.user);
    if (!data) return res.status(404).json({ success: false, message: "Complaint not found" });
    res.status(201).json({ success: true, message: "Comment added", data });
  } catch (err) {
    next(err);
  }
};

export const listComments = async (req, res, next) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid complaint id" });
    }
    const result = await commentService.listComments(req.params.id);
    if (!result) return res.status(404).json({ success: false, message: "Complaint not found" });
    res.status(200).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

export const deleteComment = async (req, res, next) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid comment id" });
    }
    const data = await commentService.deleteComment(req.params.id, req.user);
    if (!data) return res.status(404).json({ success: false, message: "Comment not found" });
    res.status(200).json({ success: true, message: "Comment deleted", data });
  } catch (err) {
    next(err);
  }
};
