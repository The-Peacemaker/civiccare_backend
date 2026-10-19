import { Router } from "express";
import * as adminController from "../controller/adminController.js";
import { requireAuth, requireRole } from "../middlewares/auth.js";
import { STAFF_ROLES } from "../config/constants.js";

const router = Router();

// Every admin route requires a logged-in staff account.
router.use(requireAuth, requireRole(...STAFF_ROLES));

// Full identity (name/email/provider) is only returned here.
router.get("/complaints", adminController.listComplaints);
router.get("/complaints/:id", adminController.getComplaint);
router.get("/complaints/:id/comments", adminController.listComments);

export default router;
