import { Router } from "express";
import * as resourceController from "../controller/resourceController.js";
import { requireAuth, requireRole } from "../middlewares/auth.js";
import {
  validateResource,
  validateResourceUpdate,
} from "../middlewares/validateResource.js";

const router = Router();

router
  .route("/")
  .get(resourceController.list)
  .post(requireAuth, requireRole("admin", "authority"), validateResource, resourceController.create);

router
  .route("/:id")
  .get(resourceController.getById)
  .patch(requireAuth, validateResourceUpdate, resourceController.update)
  .delete(requireAuth, resourceController.remove);

export default router;
