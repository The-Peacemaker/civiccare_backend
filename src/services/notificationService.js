import Notification from "../models/Notification.js";
import { toPublicNotification } from "../serializers/notificationSerializer.js";

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

const recipientId = (complaint) => complaint.author?._id || complaint.author;

export const notifyStatusChange = ({ complaint, actor, oldStatus, newStatus }) =>
  createNotification({
    recipient: recipientId(complaint),
    type: "status-change",
    title: "Your report status was updated",
    message: `"${complaint.title}" moved from ${oldStatus} to ${newStatus}.`,
    complaint: complaint._id,
  });

export const notifyNewComment = ({ complaint, commenter, isAnonymous }) =>
  createNotification({
    recipient: recipientId(complaint),
    type: "comment",
    title: "New comment on your report",
    message: isAnonymous
      ? `An anonymous user commented on "${complaint.title}".`
      : `${commenter.name} commented on "${complaint.title}".`,
    complaint: complaint._id,
  });

export const notifyUpvote = ({ complaint, actor }) => {
  if (String(recipientId(complaint)) === String(actor?._id)) return null;
  return createNotification({
    recipient: recipientId(complaint),
    type: "upvote",
    title: "Someone upvoted your report",
    message: `"${complaint.title}" just got another upvote.`,
    complaint: complaint._id,
  });
};

export const notifyAssignment = ({ complaint, actor }) =>
  createNotification({
    recipient: complaint.assignedTo?._id || complaint.assignedTo,
    type: "assignment",
    title: "A report was assigned to you",
    message: `"${complaint.title}" was assigned to you by ${actor?.name || "an authority"}.`,
    complaint: complaint._id,
  });

export const notifyCommunityActivity = ({ recipient, community, actor, action }) => {
  if (!recipient || String(recipient) === String(actor?._id)) return null;
  return createNotification({
    recipient,
    type: "community",
    title: "Community activity",
    message: `${actor?.name || "Someone"} ${action} "${community.name}".`,
    community: community._id,
  });
};

export const listNotifications = async (userId, query = {}) => {
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || 30, 1), 100);
  const page = Math.max(parseInt(query.page, 10) || 1, 1);

  const filter = { recipient: userId };
  if (query.unread === "true") filter.isRead = false;
  if (query.unread === "false") filter.isRead = true;

  const [items, total, unread] = await Promise.all([
    Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Notification.countDocuments({ recipient: userId }),
    Notification.countDocuments({ recipient: userId, isRead: false }),
  ]);

  return { items: items.map(toPublicNotification), total, unread, page, limit };
};

export const markNotificationRead = async (id, userId) => {
  const updated = await Notification.findOneAndUpdate(
    { _id: id, recipient: userId },
    { isRead: true },
    { returnDocument: "after" }
  );
  return updated ? toPublicNotification(updated) : null;
};

export const markAllNotificationsRead = (userId) =>
  Notification.updateMany({ recipient: userId, isRead: false }, { isRead: true });

export const deleteNotification = async (id, userId) =>
  Notification.findOneAndDelete({ _id: id, recipient: userId });

export const clearNotifications = (userId) => Notification.deleteMany({ recipient: userId });

export const deleteByComplaint = (complaintId) =>
  Notification.deleteMany({ complaint: complaintId });

export const deleteByCommunity = (communityId) =>
  Notification.deleteMany({ community: communityId });
