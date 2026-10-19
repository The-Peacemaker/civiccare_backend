import * as commentRepo from "../repositories/commentRepository.js";
import * as complaintRepo from "../repositories/complaintRepository.js";
import { toAdminComment, toPublicComment } from "../serializers/complaintSerializer.js";
import { notifyNewComment } from "./notificationService.js";
import { STAFF_ROLES } from "../config/constants.js";

const httpError = (statusCode, message) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
};

export const addComment = async (complaintId, payload, user) => {
  if (!user) throw httpError(401, "Authentication required");

  const complaint = await complaintRepo.findById(complaintId);
  if (!complaint) return null;

  const body = String(payload.body || "").trim();
  if (!body) throw httpError(400, "Comment body is required");

  const isAnonymous = user.isGuest ? true : payload.isAnonymous === true;

  await commentRepo.create({
    complaint: complaintId,
    author: user._id,
    body,
    isAnonymous,
  });
  await complaintRepo.incrementCounter(complaintId, "commentCount", 1);

  if (String(complaint.author?._id || complaint.author) !== String(user._id)) {
    await notifyNewComment({ complaint, commenter: user, isAnonymous });
  }

  const created = await commentRepo.findByComplaint(complaintId, { limit: 1 });
  return toPublicComment(created[0]);
};

export const listComments = async (complaintId) => {
  const complaint = await complaintRepo.findById(complaintId);
  if (!complaint) return null;

  const [items, total] = await Promise.all([
    commentRepo.findByComplaint(complaintId),
    commentRepo.countByComplaint(complaintId),
  ]);
  return { items: items.map(toPublicComment), total };
};

export const listCommentsAdmin = async (complaintId) => {
  const items = await commentRepo.findByComplaint(complaintId);
  return { items: items.map(toAdminComment), total: items.length };
};

export const deleteComment = async (id, user) => {
  const comment = await commentRepo.findById(id);
  if (!comment) return null;

  const isOwner = String(comment.author?._id || comment.author) === String(user._id);
  const isStaff = STAFF_ROLES.includes(user.role);
  if (!isOwner && !isStaff) throw httpError(403, "You cannot delete this comment");

  await commentRepo.deleteById(id);
  await complaintRepo.incrementCounter(comment.complaint, "commentCount", -1);
  return toAdminComment(comment);
};
