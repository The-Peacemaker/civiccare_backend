import { timeAgo, formatDate } from "../utils/time.js";

export const toPublicNotification = (doc) => {
  const n = doc.toObject ? doc.toObject() : doc;
  return {
    id: String(n._id),
    _id: n._id,
    type: n.type,
    title: n.title,
    message: n.message || "",
    complaintId: n.complaint || null,
    communityId: n.community || null,
    read: Boolean(n.isRead),
    isRead: Boolean(n.isRead),
    time: timeAgo(n.createdAt),
    timeAgo: timeAgo(n.createdAt),
    date: formatDate(n.createdAt),
    createdAt: n.createdAt,
  };
};

export const toSelfNotification = toPublicNotification;
