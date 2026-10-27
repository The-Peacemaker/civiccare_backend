import { Router } from "express";
import * as resourceController from "../controller/resourceController.js";
import { requireAuth, requireRole } from "../middlewares/auth.js";

const router = Router();

router
  .route("/")
  .get(resourceController.list)
  .post(requireAuth, requireRole("admin", "authority"), resourceController.create);

router.get("/:id", resourceController.getById);

export default router;
