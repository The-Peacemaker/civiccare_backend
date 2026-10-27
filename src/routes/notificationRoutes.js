import { Router } from "express";
import * as notificationController from "../controller/notificationController.js";
import { requireAuth } from "../middlewares/auth.js";

const router = Router();

router.get("/", requireAuth, notificationController.list);
router.patch("/read-all", requireAuth, notificationController.markAllRead);
router.patch("/:id/read", requireAuth, notificationController.markRead);

export default router;
