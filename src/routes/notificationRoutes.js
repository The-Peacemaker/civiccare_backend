import { Router } from "express";
import * as notificationController from "../controller/notificationController.js";
import { requireAuth } from "../middlewares/auth.js";
import { validateNotificationQuery } from "../middlewares/validateComplaint.js";

const router = Router();

router.get("/", requireAuth, validateNotificationQuery, notificationController.list);
router.delete("/", requireAuth, notificationController.clear);
router.patch("/read-all", requireAuth, notificationController.markAllRead);
router.patch("/:id/read", requireAuth, notificationController.markRead);
router.delete("/:id", requireAuth, notificationController.remove);

export default router;
