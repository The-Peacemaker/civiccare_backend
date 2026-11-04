import mongoose from "mongoose";
import * as userService from "../services/userService.js";

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

export const getMe = async (req, res, next) => {
  try {
    const data = await userService.getMe(req.user._id);
    if (!data) return res.status(404).json({ success: false, message: "User not found" });
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

export const updateMe = async (req, res, next) => {
  try {
    const data = await userService.updateMe(req.user._id, req.body);
    if (!data) return res.status(404).json({ success: false, message: "User not found" });
    res.status(200).json({ success: true, message: "Profile updated", data });
  } catch (err) {
    next(err);
  }
};

export const getById = async (req, res, next) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid user id" });
    }
    const data = await userService.getPublicUser(req.params.id);
    if (!data) return res.status(404).json({ success: false, message: "User not found" });
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};
