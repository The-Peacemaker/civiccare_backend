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
