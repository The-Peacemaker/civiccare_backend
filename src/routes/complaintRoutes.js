import { Router } from "express";
import * as complaintController from "../controller/complaintController.js";
import * as commentController from "../controller/commentController.js";
import { requireAuth } from "../middlewares/auth.js";
import {
  validateComplaint,
  validateComplaintUpdate,
  validateComment,
} from "../middlewares/validateComplaint.js";

const router = Router();

// Public feed. Optional auth adds `hasUpvoted` per item.
// POST is anonymous-friendly: identity is stored, never exposed.
router
  .route("/")
  .get(complaintController.getComplaints)
  .post(requireAuth, validateComplaint, complaintController.createComplaint);

router.get("/:id/history", complaintController.getComplaintHistory);
router.post("/:id/upvote", requireAuth, complaintController.toggleUpvote);

router
  .route("/:id/comments")
  .get(commentController.listComments)
  .post(requireAuth, validateComment, commentController.addComment);

router
  .route("/:id")
  .get(complaintController.getComplaintById)
  .patch(requireAuth, validateComplaintUpdate, complaintController.updateComplaint)
  .delete(requireAuth, complaintController.deleteComplaint);

export default router;
