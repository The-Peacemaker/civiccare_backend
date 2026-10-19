import { Router } from "express";
import * as commentController from "../controller/commentController.js";
import { requireAuth } from "../middlewares/auth.js";

const router = Router();

router.delete("/:id", requireAuth, commentController.deleteComment);

export default router;
