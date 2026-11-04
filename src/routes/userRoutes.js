import { Router } from "express";
import * as userController from "../controller/userController.js";
import { requireAuth } from "../middlewares/auth.js";

const router = Router();

router.get("/me", requireAuth, userController.getMe);
router.patch("/me", requireAuth, userController.updateMe);
router.get("/:id", userController.getById);

export default router;
