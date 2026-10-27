import Notification from "../models/Notification.js";

// Fire-and-forget style helper used by complaint/comment services.
// Notifications are a side effect, so a failure should never break the main action.
export const createNotification = async (payload) => {
  try {
    if (!payload?.recipient) return null;
    return await Notification.create(payload);
  } catch (err) {
    console.error("Notification failed:", err.message);
    return null;
  }
};

export const notifyStatusChange = ({ complaint, actor, oldStatus, newStatus }) =>
  createNotification({
    recipient: complaint.author?._id || complaint.author,
    type: "status-change",
    title: "Your report status was updated",
    message: `"${complaint.title}" moved from ${oldStatus} to ${newStatus}.`,
    complaint: complaint._id,
  });

export const notifyNewComment = ({ complaint, commenter, isAnonymous }) =>
  createNotification({
    recipient: complaint.author?._id || complaint.author,
    type: "comment",
    title: "New comment on your report",
    message: isAnonymous
      ? `An anonymous user commented on "${complaint.title}".`
      : `${commenter.name} commented on "${complaint.title}".`,
    complaint: complaint._id,
  });

export const listNotifications = async (userId, query = {}) => {
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || 30, 1), 100);
  const page = Math.max(parseInt(query.page, 10) || 1, 1);

  const filter = { recipient: userId };
  if (query.unread === "true") filter.isRead = false;

  const [items, total, unread] = await Promise.all([
    Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Notification.countDocuments({ recipient: userId }),
    Notification.countDocuments({ recipient: userId, isRead: false }),
  ]);

  return { items, total, unread, page, limit };
};

export const markNotificationRead = (id, userId) =>
  Notification.findOneAndUpdate(
    { _id: id, recipient: userId },
    { isRead: true },
    { returnDocument: "after" }
  );

export const markAllNotificationsRead = (userId) =>
  Notification.updateMany({ recipient: userId, isRead: false }, { isRead: true });
