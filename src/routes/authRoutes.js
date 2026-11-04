import { Router } from "express";
import * as authController from "../controller/authController.js";
import { requireAuth } from "../middlewares/auth.js";

const router = Router();

router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/guest", authController.guest);
router.post("/google", authController.google);
router.post("/refresh", authController.refresh);
router.get("/me", requireAuth, authController.me);
router.post("/logout", requireAuth, authController.logout);

export default router;
