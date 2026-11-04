import mongoose from "mongoose";
import * as notificationService from "../services/notificationService.js";

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

export const list = async (req, res, next) => {
  try {
    const result = await notificationService.listNotifications(req.user._id, req.query);
    res.status(200).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

export const markRead = async (req, res, next) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid notification id" });
    }
    const data = await notificationService.markNotificationRead(req.params.id, req.user._id);
    if (!data) return res.status(404).json({ success: false, message: "Notification not found" });
    res.status(200).json({ success: true, message: "Notification marked as read", data });
  } catch (err) {
    next(err);
  }
};

export const markAllRead = async (req, res, next) => {
  try {
    const result = await notificationService.markAllNotificationsRead(req.user._id);
    res.status(200).json({
      success: true,
      message: "Notifications marked as read",
      modified: result.modifiedCount,
    });
  } catch (err) {
    next(err);
  }
};

export const remove = async (req, res, next) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid notification id" });
    }
    const data = await notificationService.deleteNotification(req.params.id, req.user._id);
    if (!data) return res.status(404).json({ success: false, message: "Notification not found" });
    res.status(200).json({ success: true, message: "Notification deleted" });
  } catch (err) {
    next(err);
  }
};

export const clear = async (req, res, next) => {
  try {
    const result = await notificationService.clearNotifications(req.user._id);
    res.status(200).json({
      success: true,
      message: "Notifications cleared",
      deleted: result.deletedCount,
    });
  } catch (err) {
    next(err);
  }
};
