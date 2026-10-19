import { Router } from "express";
import {
  createComplaint,
  getComplaints,
  getComplaintById,
  updateComplaint,
  deleteComplaint,
  upvoteComplaint,
} from "../controller/complaintController.js";
import { validateComplaint } from "../middlewares/validateComplaint.js";

const router = Router();

// POST /api/complaints       -> report a new issue (anonymous allowed)
// GET  /api/complaints       -> public feed (?status=&category=&page=&limit=)
router.route("/").post(validateComplaint, createComplaint).get(getComplaints);

// GET /api/complaints/:id | PATCH /api/complaints/:id | DELETE /api/complaints/:id
router.route("/:id").get(getComplaintById).patch(updateComplaint).delete(deleteComplaint);

// POST /api/complaints/:id/upvote -> +1 upvote
router.post("/:id/upvote", upvoteComplaint);

export default router;
